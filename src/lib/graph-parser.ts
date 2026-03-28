import { TLRecord, TLShape, TLArrowShape, TLArrowBinding } from "@tldraw/tldraw"
import type { TLShapeId } from "@tldraw/tldraw"
import { SemanticGraph, SemanticNode, SemanticEdge, Annotation } from "@/types"

// ─── Shape type guards ────────────────────────────────────────────

type VendorShapeType = "database" | "cache" | "queue" | "server" | "client" | "cdn"

const VENDOR_TYPES = new Set<string>([
  "database", "cache", "queue", "server", "client", "cdn"
])

function isVendorShape(shape: TLShape): boolean {
  return VENDOR_TYPES.has(shape.type)
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

// ─── Main parser ─────────────────────────────────────────────────

export function parseCanvasToGraph(records: TLRecord[]): SemanticGraph {
  const allShapes = records.filter((r) => r.typeName === "shape") as TLShape[]

  const nonArrowShapes = allShapes.filter((s) => s.type !== "arrow")
  const arrows = allShapes.filter((s) => s.type === "arrow") as TLArrowShape[]
  const arrowBindings = records.filter(
    (r) => r.typeName === "binding" && r.type === "arrow"
  ) as TLArrowBinding[]

  // ── 1. Vendor nodes ──────────────────────────────────────────

  const vendorNodes: SemanticNode[] = nonArrowShapes
    .filter(isVendorShape)
    .filter((s) => Boolean((s.props as any).meta?.vendor))
    .map((s) => {
      const meta = (s.props as any).meta
      return {
        id: s.id,
        vendor: meta.vendor,
        category: meta.category,
        label: meta.label || meta.vendor,
        isGeneric: false,
      }
    })

  // ── 2. Generic nodes (rectangle, circle, cylinder, diamond) ──

  const genericNodes: SemanticNode[] = nonArrowShapes
    .filter(isGenericShape)
    .map((s) => {
      const meta = (s.props as any).meta ?? {}
      const props = s.props as any
      // Use geo type as fallback description if no label
      const geoFallback = props.geo ?? "component"
      const label = meta.label?.trim() || ""
      return {
        id: s.id,
        vendor: "generic",
        category: "generic" as const,
        label: label || geoFallback,
        isGeneric: true,
      }
    })

  const nodes: SemanticNode[] = [...vendorNodes, ...genericNodes]

  // ── 3. Text annotations (standalone text shapes) ─────────────

  const annotations: Annotation[] = nonArrowShapes
    .filter(isTextShape)
    .map((s) => ({
      id: s.id,
      text: extractTextFromShape(s),
    }))
    .filter((a) => a.text.length > 0) // drop empty text shapes

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
    .filter((e) => nodeIds.has(e.from) || nodeIds.has(e.to))
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
    (n) => !n.label || n.label === "component" || 
           ["rectangle", "ellipse", "diamond"].includes(n.label)
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