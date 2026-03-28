import { ShapeUtil, TLShape, HTMLContainer, useEditor, useValue } from "@tldraw/tldraw";
import { Rectangle2d } from "@tldraw/editor";
import type { Geometry2d, TLGeometryOpts, TLShapeUtilCanBindOpts } from "@tldraw/editor";
import { useState, useRef, useEffect, useCallback } from "react";

export type GenericShapeType = TLShape<"generic">;

// ─── SVG shape outlines for each geo variant ─────────────────────
function GeoOutline({ geo, w, h }: { geo: string | undefined; w: number; h: number }) {
  const cls = "stroke-current fill-none stroke-[1.5]";
  switch (geo) {
    case "ellipse":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full absolute inset-0 text-gray-500 opacity-30">
          <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 2} ry={h / 2 - 2} className={cls} />
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full absolute inset-0 text-gray-500 opacity-30">
          <path d={`M${w / 2} 2 L${w - 2} ${h / 2} L${w / 2} ${h - 2} L2 ${h / 2}Z`} className={cls} />
        </svg>
      );
    case "cylinder":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full absolute inset-0 text-gray-500 opacity-30">
          <ellipse cx={w / 2} cy={12} rx={w / 2 - 2} ry={10} className={cls} />
          <line x1={2} y1={12} x2={2} y2={h - 10} className={cls} />
          <line x1={w - 2} y1={12} x2={w - 2} y2={h - 10} className={cls} />
          <ellipse cx={w / 2} cy={h - 10} rx={w / 2 - 2} ry={10} className={cls} />
        </svg>
      );
    default: // rectangle — the border-radius on the container is enough
      return null;
  }
}

// ─── Inline label editor ─────────────────────────────────────────
function LabelEditor({ shape }: { shape: GenericShapeType }) {
  const editor = useEditor();
  const editingId = useValue("editingId", () => editor.getEditingShapeId(), [editor]);
  const isEditing = editingId === shape.id;
  const [text, setText] = useState(shape.props.meta.label || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setText(shape.props.meta.label || "");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isEditing, shape.props.meta.label]);

  const commitLabel = useCallback(() => {
    const trimmed = text.trim();
    editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: {
        ...shape.props,
        meta: { ...shape.props.meta, label: trimmed, isLabeled: trimmed.length > 0 },
      },
    });
    editor.setCurrentTool("select");
  }, [editor, shape, text]);

  if (!isEditing) return null;

  return (
    <input
      ref={inputRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commitLabel}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); commitLabel(); }
        if (e.key === "Escape") editor.setCurrentTool("select");
        e.stopPropagation();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute inset-0 w-full h-full bg-transparent text-white
                 text-xs text-center border-2 border-gray-400 rounded-lg
                 outline-none z-10"
      placeholder="Type label..."
      style={{ caretColor: "white" }}
    />
  );
}

export class GenericShapeUtil extends ShapeUtil<GenericShapeType> {
  static override type = "generic" as const;

  getDefaultProps(): GenericShapeType["props"] {
    return {
      w: 140,
      h: 70,
      geo: "rectangle",  // ✅ move here
      meta: {
        vendor: "generic",
        category: "generic",
        label: "",
        isLabeled: false,
      },
    };
  }

  getGeometry(shape: GenericShapeType, _opts?: TLGeometryOpts): Geometry2d {
    return new Rectangle2d({
      x: 0,
      y: 0,
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override canBind(_opts: TLShapeUtilCanBindOpts): boolean { return true; }
  override canEdit(): boolean { return true; }

  component(shape: GenericShapeType) {
    const { meta, w, h, geo } = shape.props;
    const isUnlabeled = !meta.isLabeled;
    // const geo = meta.geo || "rectangle";

    return (
      <HTMLContainer>
        <div
          className={`
            relative flex flex-col items-center justify-center
            w-full h-full rounded-lg border-2 bg-gray-900/80
            ${isUnlabeled ? "border-red-500" : "border-gray-500"}
          `}
        >
          <GeoOutline geo={geo} w={w} h={h} />

          <span className="text-xs text-gray-300 z-[1]">
            {meta.label || geo}
          </span>

          {/* Validation badge */}
          {isUnlabeled && (
            <div
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500
                         rounded-full flex items-center justify-center cursor-help"
              title="Add a label to this component for accurate AI review"
            >
              <span className="text-white text-xs font-bold">!</span>
            </div>
          )}

          <LabelEditor shape={shape} />
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: GenericShapeType) {
    return <rect width={shape.props.w} height={shape.props.h} rx={8} />;
  }
}
