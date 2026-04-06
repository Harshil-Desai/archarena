import { ShapeUtil, TLShape, HTMLContainer, useEditor, useValue } from "@tldraw/tldraw";
import { Rectangle2d } from "@tldraw/editor";
import type { Geometry2d, TLGeometryOpts, TLShapeUtilCanBindOpts } from "@tldraw/editor";
import { useState, useRef, useEffect, useCallback } from "react";

export type AppServerShapeType = TLShape<"appServer">;

function LabelEditor({ shape }: { shape: AppServerShapeType }) {
  const editor = useEditor();
  const editingId = useValue("editingId", () => editor.getEditingShapeId(), [editor]);
  const isEditing = editingId === shape.id;
  const [text, setText] = useState(shape.props.meta.label || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const textRef = useRef(text);
  useEffect(() => { textRef.current = text; }, [text]);


  useEffect(() => {
    if (isEditing) {
      setText(shape.props.meta.label || "");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isEditing, shape.props.meta.label]);

  const commitLabel = useCallback((forcedText?: string) => {
    const finalStr = typeof forcedText === 'string' ? forcedText : text;
    const trimmed = finalStr.trim();
    if (trimmed === shape.props.meta.label) return;
    editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: {
        ...shape.props,
        meta: { ...shape.props.meta, label: trimmed, isLabeled: true },
      },
    });
    if (editor.getEditingShapeId() === shape.id) { editor.setCurrentTool("select"); }
  }, [editor, shape, text]);

  const commitRef = useRef(commitLabel);
  useEffect(() => { commitRef.current = commitLabel; }, [commitLabel]);

  useEffect(() => {
    return () => { commitRef.current?.(textRef.current); };
  }, []);

  if (!isEditing) return null;

  return (
    <input
      ref={inputRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => commitLabel()}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); commitLabel(); }
        if (e.key === "Escape") editor.setCurrentTool("select");
        e.stopPropagation();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute inset-0 w-full h-full bg-transparent text-white pt-10
                 text-xs text-center border-2 border-orange-500 rounded-lg
                 outline-none z-10"
      placeholder="Type label..."
      style={{ caretColor: "white" }}
    />
  );
}

export class AppServerShapeUtil extends ShapeUtil<AppServerShapeType> {
  static override type = "appServer" as const;

  getDefaultProps(): AppServerShapeType["props"] {
    return {
      w: 120,
      h: 80,
      meta: { vendor: "node", category: "appServer", label: "", isLabeled: true },
    };
  }

  getGeometry(shape: AppServerShapeType, _opts?: TLGeometryOpts): Geometry2d {
    return new Rectangle2d({
      x: 0, y: 0,
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override canBind(_opts: TLShapeUtilCanBindOpts): boolean { return true; }
  override canEdit(): boolean { return true; }

  component(shape: AppServerShapeType) {
    const { meta } = shape.props;
    const isUnlabeled = !meta.isLabeled;

    return (
      <HTMLContainer>
        <div
          className={`
            relative flex flex-col items-center justify-center
            w-full h-full rounded-lg border-2 bg-gray-950 focus-within:[&>span]:opacity-0
            ${isUnlabeled ? "border-red-500 stroke-red-500 text-red-500" : "border-orange-500 text-orange-500"}
          `}
        >
          <img src={`/icons/vendors/${meta.vendor}.svg`} className="w-8 h-8" alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <span className="text-xs text-white mt-1">{meta.label || "App Server"}</span>

          {isUnlabeled && (
            <div
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 
                         rounded-full flex items-center justify-center cursor-help"
              title="Add a label to this component for accurate AI review"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="6" x2="12" y2="14" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
          )}

          <LabelEditor shape={shape} />
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: AppServerShapeType) {
    return <rect width={shape.props.w} height={shape.props.h} rx={8} />;
  }
}
