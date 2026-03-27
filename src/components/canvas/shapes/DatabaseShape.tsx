import { ShapeUtil, TLShape, HTMLContainer, useEditor, useValue } from "@tldraw/tldraw";
import { Rectangle2d } from "@tldraw/editor";
import type { Geometry2d, TLGeometryOpts, TLShapeUtilCanBindOpts } from "@tldraw/editor";
import { useState, useRef, useEffect, useCallback } from "react";

// Shape type definition
export type DatabaseShapeType = TLShape<"database">;

// ─── Inline label editor (rendered when shape is being edited) ───
function LabelEditor({ shape }: { shape: DatabaseShapeType }) {
  const editor = useEditor();
  const editingId = useValue("editingId", () => editor.getEditingShapeId(), [editor]);
  const isEditing = editingId === shape.id;
  const [text, setText] = useState(shape.props.meta.label || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setText(shape.props.meta.label || "");
      // Focus after a tick to ensure the input is mounted
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
        if (e.key === "Enter") {
          e.preventDefault();
          commitLabel();
        }
        if (e.key === "Escape") {
          editor.setCurrentTool("select");
        }
        // Stop propagation so tldraw doesn't intercept keystrokes
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

export class DatabaseShapeUtil extends ShapeUtil<DatabaseShapeType> {
  static override type = "database" as const;

  getDefaultProps(): DatabaseShapeType["props"] {
    return {
      w: 120,
      h: 80,
      meta: {
        vendor: "postgresql",
        category: "database",
        label: "",
        isLabeled: true,
      },
    };
  }

  getGeometry(shape: DatabaseShapeType, _opts?: TLGeometryOpts): Geometry2d {
    return new Rectangle2d({
      x: 0,
      y: 0,
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true, // Needed for arrow binding hit-testing
    });
  }

  // Allow arrows to bind to this shape
  override canBind(_opts: TLShapeUtilCanBindOpts): boolean {
    return true;
  }

  // Allow double-click to edit label
  override canEdit(): boolean {
    return true;
  }

  component(shape: DatabaseShapeType) {
    const { meta } = shape.props;
    const isUnlabeled = !meta.isLabeled;

    return (
      <HTMLContainer>
        <div
          className={`
            relative flex flex-col items-center justify-center
            w-full h-full rounded-lg border-2 bg-blue-950
            ${isUnlabeled ? "border-red-500" : "border-blue-400"}
          `}
        >
          {/* Vendor icon */}
          <img
            src={`/icons/vendors/${meta.vendor}.svg`}
            className="w-8 h-8"
            alt=""
          />
          <span className="text-xs text-white mt-1">
            {meta.label || meta.vendor}
          </span>

          {/* Validation badge */}
          {isUnlabeled && (
            <div
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 
                         rounded-full flex items-center justify-center
                         cursor-help"
              title="Add a label to this component for accurate AI review"
            >
              <span className="text-white text-xs font-bold">!</span>
            </div>
          )}

          {/* Inline label editor */}
          <LabelEditor shape={shape} />
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: DatabaseShapeType) {
    return <rect width={shape.props.w} height={shape.props.h} rx={8} />;
  }
}
