import { ShapeUtil, TLShape, HTMLContainer, useEditor, useValue } from "@tldraw/tldraw";
import { Rectangle2d } from "@tldraw/editor";
import type { Geometry2d, TLGeometryOpts, TLShapeUtilCanBindOpts } from "@tldraw/editor";
import { useState, useRef, useEffect, useCallback } from "react";

// Shape type definition
export type CacheShapeType = TLShape<"cache">;

// ─── Inline label editor ─────────────────────────────────────────
function LabelEditor({ shape }: { shape: CacheShapeType }) {
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
        meta: {
          ...shape.props.meta,
          label: trimmed,
          isLabeled: true,
        },
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
                 text-xs text-center border-2 border-blue-400 rounded-lg
                 outline-none z-10"
      placeholder="Type label..."
      style={{ caretColor: "white" }}
    />
  );
}

export class CacheShapeUtil extends ShapeUtil<CacheShapeType> {
  static override type = "cache" as const;

  getDefaultProps(): CacheShapeType["props"] {
    return {
      w: 120,
      h: 80,
      meta: {
        vendor: "redis",
        category: "cache",
        label: "",
        isLabeled: true,
      },
    };
  }

  getGeometry(shape: CacheShapeType, _opts?: TLGeometryOpts): Geometry2d {
    return new Rectangle2d({
      x: 0,
      y: 0,
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override canBind(_opts: TLShapeUtilCanBindOpts): boolean {
    return true;
  }

  override canEdit(): boolean {
    return true;
  }

  component(shape: CacheShapeType) {
    const { meta } = shape.props;
    const isUnlabeled = !meta.isLabeled;

    return (
      <HTMLContainer>
        <div
          className={`
            relative flex flex-col items-center justify-center
            w-full h-full rounded-lg border-2 bg-blue-950
            ${isUnlabeled ? "border-red-500" : "border-green-400"}
          `}
        >
          <img src={`/icons/vendors/${meta.vendor}.svg`} className="w-8 h-8" alt="" />
          <span className="text-xs text-white mt-1">{meta.label || meta.vendor}</span>

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

  indicator(shape: CacheShapeType) {
    return <rect width={shape.props.w} height={shape.props.h} rx={8} />;
  }
}
