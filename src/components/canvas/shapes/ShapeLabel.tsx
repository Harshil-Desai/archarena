import { useEditor, useValue } from "@tldraw/tldraw";
import { useState, useRef, useEffect, useCallback } from "react";

export function ShapeLabel({ shape, defaultLabel }: { shape: any, defaultLabel: string }) {
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
        meta: { ...shape.props.meta, label: trimmed, isLabeled: shape.type === "generic" ? trimmed !== "" : true },
      },
    });
    editor.setCurrentTool("select");
  }, [editor, shape, text]);

  if (!isEditing) {
    if (!shape.props.meta.label && !defaultLabel) return null;
    return (
      <span className="text-xs text-white mt-1 z-10 px-1 text-center truncate w-full pointer-events-none">
        {shape.props.meta.label || defaultLabel}
      </span>
    );
  }

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
      className="mt-1 w-full max-w-[90%] bg-gray-900 border border-blue-400 text-white text-xs text-center rounded outline-none z-20 pointer-events-auto"
      placeholder="Type label..."
      style={{ caretColor: "white" }}
    />
  );
}
