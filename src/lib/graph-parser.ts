import { TLRecord, TLShape, TLArrowShape, TLArrowBinding } from "@tldraw/tldraw";
import type { TLShapeId } from "@tldraw/tldraw";
import { SemanticGraph, SemanticNode, SemanticEdge } from "@/types";

type VendorShapeType = "database" | "cache" | "queue" | "server" | "client" | "cdn";
type VendorShape = TLShape<VendorShapeType>;

function isVendorShape(shape: TLShape): shape is VendorShape {
  switch (shape.type) {
    case "database":
    case "cache":
    case "queue":
    case "server":
    case "client":
    case "cdn":
      return true;
    default:
      return false;
  }
}

function richTextToPlainText(richText: unknown): string {
  if (!richText) return "";
  if (typeof richText === "string") return richText;
  if (Array.isArray(richText)) return richText.map(richTextToPlainText).join("");
  if (typeof richText === "object") {
    const rt = richText as { text?: unknown; content?: unknown };
    if (typeof rt.text === "string") return rt.text;
    if (Array.isArray(rt.content)) return rt.content.map(richTextToPlainText).join("");
  }
  return "";
}

export function parseCanvasToGraph(records: TLRecord[]): SemanticGraph {
  const shapes = records.filter(
    (r) => r.typeName === "shape" && r.type !== "arrow"
  ) as TLShape[];

  const arrows = records.filter(
    (r) => r.typeName === "shape" && r.type === "arrow"
  ) as TLArrowShape[];

  const arrowBindings = records.filter(
    (r) => r.typeName === "binding" && r.type === "arrow"
  ) as TLArrowBinding[];

  // Build nodes from vendor shapes
  const nodes: SemanticNode[] = shapes
    .filter(isVendorShape)
    .filter((s) => Boolean(s.props.meta.vendor)) // only our vendor shapes
    .map((s) => ({
      id: s.id,
      vendor: s.props.meta.vendor,
      category: s.props.meta.category,
      label: s.props.meta.label || s.props.meta.vendor,
    }));

  // Build edges from arrows
  const edges: SemanticEdge[] = arrows
    .map((arrow) => {
      const startBinding =
        arrowBindings.find((b) => b.fromId === arrow.id && b.props.terminal === "start") ??
        null;
      const endBinding =
        arrowBindings.find((b) => b.fromId === arrow.id && b.props.terminal === "end") ??
        null;

      const fromId = startBinding?.toId ?? null;
      const toId = endBinding?.toId ?? null;
      const label = richTextToPlainText(arrow.props.richText).trim();

      return {
        from: fromId,
        to: toId,
        label,
        isLabeled: label.length > 0,
      };
    })
    .filter(
      (
        e
      ): e is {
        from: TLShapeId;
        to: TLShapeId;
        label: string;
        isLabeled: boolean;
      } => Boolean(e.from && e.to)
    )
    .map((e) => ({
      from: `${e.from}`,
      to: `${e.to}`,
      label: e.label,
      isLabeled: e.isLabeled,
    })); // drop unbound arrows + convert ids to strings

  const unlabeledEdgeCount = edges.filter((e) => !e.isLabeled).length;

  return {
    nodes,
    edges,
    unlabeledEdgeCount,
    isValid: unlabeledEdgeCount === 0,
  };
}

// Client-side diff — returns true only if graph changed meaningfully
export function hasGraphChanged(
  prev: SemanticGraph | null,
  next: SemanticGraph
): boolean {
  if (!prev) return true;
  // Cheap structural compare — avoid sending if nothing semantic changed
  return JSON.stringify(prev) !== JSON.stringify(next);
}