import { TLRecord, TLShape, TLArrowShape, TLArrowBinding, TLStoreSnapshot } from "@tldraw/tldraw"
import type { TLShapeId } from "@tldraw/tldraw"
import { SemanticGraph, SemanticNode, SemanticEdge, Annotation, ShapeMeta } from "@/types"

// ─── Shape type guards ────────────────────────────────────────────

type ShapeWithMeta = TLShape & {
  props: TLShape["props"] & {
    meta: ShapeMeta
    w?: number
    h?: number
    geo?: string
  }
}

interface AnnotationCandidate extends Annotation {
  x: number
  y: number
}

interface NodeCandidate {
  node: SemanticNode
  x: number
  y: number
}

const ANNOTATION_ASSOCIATION_DISTANCE = 240

function hasShapeMeta(shape: TLShape): shape is ShapeWithMeta {
  const props = shape.props as Record<string, unknown>
  const meta = props.meta as Record<string, unknown> | undefined

  return Boolean(
    meta &&
    typeof meta.vendor === "string" &&
    typeof meta.category === "string" &&
    typeof meta.label === "string"
  )
}

function isVendorShape(shape: TLShape): shape is ShapeWithMeta {
  return shape.type !== "arrow" &&
    shape.type !== "text" &&
    shape.type !== "generic" &&
    hasShapeMeta(shape)
}

function isGenericShape(shape: TLShape): boolean {
  return shape.type === "generic"
}

function isTextShape(shape: TLShape): boolean {
  return shape.type === "text"
}

// ─── Rich text extraction ────────────────────────────────────────

function richTextToPlainText(richText: unknown): string {
  if (!richText) return ""
  if (typeof richText === "string") return richText
  if (Array.isArray(richText)) return richText.map(richTextToPlainText).join("")
  if (typeof richText === "object") {
    const rt = richText as { text?: unknown; content?: unknown }
    if (typeof rt.text === "string") return rt.text
    if (Array.isArray(rt.content)) return rt.content.map(richTextToPlainText).join("")
  }
  return ""
}

function extractTextFromShape(shape: TLShape): string {
  const props = shape.props as Record<string, unknown>
  // Try richText first (tldraw v2 text shapes use this)
  if (props.richText) return richTextToPlainText(props.richText).trim()
  // Fallback to plain text prop
  if (typeof props.text === "string") return props.text.trim()
  return ""
}

function getShapeCenter(shape: TLShape): { x: number; y: number } {
  const props = shape.props as Record<string, unknown>
  const width = typeof props.w === "number" ? props.w : 0
  const height = typeof props.h === "number" ? props.h : 0

  return {
    x: shape.x + width / 2,
    y: shape.y + height / 2,
  }
}

function distanceBetween(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

function attachAnnotationDescriptions(
  nodes: NodeCandidate[],
  annotations: AnnotationCandidate[]
): SemanticNode[] {
  const descriptions = new Map<string, string[]>()

  for (const annotation of annotations) {
    let nearestNodeId: string | null = null
    let nearestDistance = Number.POSITIVE_INFINITY

    for (const node of nodes) {
      const distance = distanceBetween(annotation, node)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestNodeId = node.node.id
      }
    }

    if (
      nearestNodeId &&
      nearestDistance <= ANNOTATION_ASSOCIATION_DISTANCE
    ) {
      const existing = descriptions.get(nearestNodeId) ?? []
      existing.push(annotation.text)
      descriptions.set(nearestNodeId, existing)
    }
  }

  return nodes.map(({ node }) => {
    const description = descriptions.get(node.id)?.join("\n")
    return description ? { ...node, description } : node
  })
}

export function isCanvasSnapshot(value: unknown): value is TLStoreSnapshot {
  if (!value || typeof value !== "object") return false

  const snapshot = value as Record<string, unknown>
  return Boolean(
    snapshot.store &&
    typeof snapshot.store === "object" &&
    snapshot.schema &&
    typeof snapshot.schema === "object"
  )
}

export function getRecordsFromCanvasSnapshot(snapshot: TLStoreSnapshot): TLRecord[] {
  return Object.values(snapshot.store) as TLRecord[]
}

// ─── Main parser ─────────────────────────────────────────────────

export function parseCanvasToGraph(records: TLRecord[]): SemanticGraph {
  const allShapes = records.filter((r) => r.typeName === "shape") as TLShape[]

  const nonArrowShapes = allShapes.filter((s) => s.type !== "arrow")
  const arrows = allShapes.filter((s) => s.type === "arrow") as TLArrowShape[]
  const arrowBindings = records.filter(
    (r) => r.typeName === "binding" && r.type === "arrow"
  ) as TLArrowBinding[]

  // ── 1. Vendor nodes ──────────────────────────────────────────

  const vendorNodes: NodeCandidate[] = nonArrowShapes
    .filter(isVendorShape)
    .map((s) => {
      const meta = (s.props as ShapeWithMeta["props"]).meta
      return {
        node: {
          id: s.id,
          vendor: meta.vendor,
          category: meta.category,
          label: meta.label || meta.vendor,
          isGeneric: false,
        },
        ...getShapeCenter(s),
      }
    })

  // ── 2. Generic nodes (rectangle, circle, cylinder, diamond) ──

  const genericNodes: NodeCandidate[] = nonArrowShapes
    .filter(isGenericShape)
    .map((s) => {
      const props = s.props as ShapeWithMeta["props"]
      const meta = props.meta
      // Use geo type as fallback description if no label
      const geoFallback = props.geo ?? "component"
      const label = meta.label?.trim() || ""
      return {
        node: {
          id: s.id,
          vendor: "generic",
          category: "generic" as const,
          label: label || geoFallback,
          isGeneric: true,
        },
        ...getShapeCenter(s),
      }
    })

  const nodeCandidates: NodeCandidate[] = [...vendorNodes, ...genericNodes]

  // ── 3. Text annotations (standalone text shapes) ─────────────

  const annotationCandidates: AnnotationCandidate[] = nonArrowShapes
    .filter(isTextShape)
    .map((s) => ({
      id: s.id,
      text: extractTextFromShape(s),
      ...getShapeCenter(s),
    }))
    .filter((a) => a.text.length > 0) // drop empty text shapes

  const nodes = attachAnnotationDescriptions(nodeCandidates, annotationCandidates)
  const annotations: Annotation[] = annotationCandidates.map(({ id, text }) => ({
    id,
    text,
  }))

  // ── 4. Edges from arrows ─────────────────────────────────────

  // Build a set of all known node ids for validation
  const nodeIds = new Set(nodes.map((n) => n.id))

  const edges: SemanticEdge[] = arrows
    .map((arrow) => {
      const startBinding = arrowBindings.find(
        (b) => b.fromId === arrow.id && b.props.terminal === "start"
      ) ?? null
      const endBinding = arrowBindings.find(
        (b) => b.fromId === arrow.id && b.props.terminal === "end"
      ) ?? null

      const fromId = startBinding?.toId ?? null
      const toId = endBinding?.toId ?? null
      const label = richTextToPlainText(arrow.props.richText).trim()

      return { from: fromId, to: toId, label, isLabeled: label.length > 0 }
    })
    .filter(
      (e): e is { from: TLShapeId; to: TLShapeId; label: string; isLabeled: boolean } =>
        Boolean(e.from && e.to)
    )
    // Only keep edges where both endpoints are known nodes
    // This filters out arrows connecting to non-semantic shapes
    .filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to))
    .map((e) => ({
      from: `${e.from}`,
      to: `${e.to}`,
      label: e.label,
      isLabeled: e.isLabeled,
    }))

  // ── 5. Counts and validity ───────────────────────────────────

  const unlabeledEdgeCount = edges.filter((e) => !e.isLabeled).length

  // Generic shapes without a real user label (showing geo fallback)
  const unlabeledGenericCount = genericNodes.filter(
    ({ node }) => !node.label || node.label === "component" ||
           ["rectangle", "ellipse", "diamond"].includes(node.label)
  ).length

  return {
    nodes,
    edges,
    annotations,
    unlabeledEdgeCount,
    unlabeledGenericCount,
    isValid: unlabeledEdgeCount === 0,
  }
}

// ─── Client-side diff ────────────────────────────────────────────

export function hasGraphChanged(
  prev: SemanticGraph | null,
  next: SemanticGraph
): boolean {
  if (!prev) return true
  return JSON.stringify(prev) !== JSON.stringify(next)
}
