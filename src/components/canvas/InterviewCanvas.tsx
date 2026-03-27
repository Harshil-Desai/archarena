"use client";
import { Tldraw, useEditor, TLRecord } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useEffect, useRef, useCallback } from "react";
import { CUSTOM_SHAPE_UTILS } from "./shapes";
import { VendorToolbar } from "./toolbar/VendorToolbar";
import { CanvasHintOverlay } from "./hints/CanvasHintOverlay";
import { parseCanvasToGraph, hasGraphChanged } from "@/lib/graph-parser";
import { SemanticGraph } from "@/types";

interface Props {
  onGraphChange: (graph: SemanticGraph) => void;
  onCanvasRecordsChange?: (records: TLRecord[]) => void;
}

const DEBOUNCE_MS = 1500;

/**
 * Null out all irrelevant tldraw UI chrome.
 * We keep only the canvas itself with pan/zoom/selection.
 */
const TLDRAW_COMPONENT_OVERRIDES = {
  Toolbar: null,
  MainMenu: null,
  PageMenu: null,
  NavigationPanel: null,
  ContextMenu: null,
  StylePanel: null,
  ActionsMenu: null,
  SharePanel: null,
  DebugPanel: null,
  HelpMenu: null,
  // Keep: KeyboardShortcutsDialog (tldraw default)
} as const;

function CanvasWatcher({ onGraphChange, onCanvasRecordsChange }: Props) {
  const editor = useEditor();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastGraphRef = useRef<SemanticGraph | null>(null);

  const handleChange = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const records = Object.values(editor.store.allRecords()) as TLRecord[];
      const graph = parseCanvasToGraph(records);

      // Client-side diff — only propagate if something changed
      if (hasGraphChanged(lastGraphRef.current, graph)) {
        lastGraphRef.current = graph;
        // Pass latest canvas records along with the semantic graph update.
        // This is used for hint triggering.
        onCanvasRecordsChange?.(records);
        onGraphChange(graph);
      }
    }, DEBOUNCE_MS);
  }, [editor, onGraphChange, onCanvasRecordsChange]);

  useEffect(() => {
    const unsub = editor.store.listen(handleChange, { scope: "document" });
    return () => {
      unsub();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [editor, handleChange]);

  return null;
}

/**
 * Keyboard shortcut handler — only fires when canvas container is focused.
 * tldraw handles most shortcuts when its canvas has focus, but we add
 * Escape → select tool as a safety net and ensure shortcuts work even
 * when focus is on the toolbar area within the canvas container.
 */
function CanvasKeyboardShortcuts() {
  const editor = useEditor();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Check if the event target is inside the canvas container
      const canvasContainer = document.querySelector(
        "[data-canvas-container]"
      );
      if (!canvasContainer?.contains(target) && target !== document.body) {
        return;
      }

      // tldraw handles most of these natively when its canvas is focused.
      // We add them here as a fallback for when focus is on toolbar buttons etc.
      switch (e.key.toLowerCase()) {
        case "v":
          if (!e.ctrlKey && !e.metaKey) editor.setCurrentTool("select");
          break;
        case "a":
          if (!e.ctrlKey && !e.metaKey) editor.setCurrentTool("arrow");
          break;
        case "t":
          if (!e.ctrlKey && !e.metaKey) editor.setCurrentTool("text");
          break;
        case "h":
          if (!e.ctrlKey && !e.metaKey) editor.setCurrentTool("hand");
          break;
        case "escape":
          editor.setCurrentTool("select");
          break;
        case "delete":
        case "backspace":
          if (!e.ctrlKey && !e.metaKey) {
            const selectedIds = editor.getSelectedShapeIds();
            if (selectedIds.length > 0) {
              editor.deleteShapes(selectedIds);
            }
          }
          break;
        case "z":
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              editor.redo();
            } else {
              editor.undo();
            }
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editor]);

  return null;
}

export function InterviewCanvas({ onGraphChange, onCanvasRecordsChange }: Props) {
  return (
    <div className="w-full h-full relative" data-canvas-container>
      <Tldraw
        shapeUtils={CUSTOM_SHAPE_UTILS}
        components={TLDRAW_COMPONENT_OVERRIDES}
      >
        <VendorToolbar />
        <CanvasKeyboardShortcuts />
        <CanvasWatcher
          onGraphChange={onGraphChange}
          onCanvasRecordsChange={onCanvasRecordsChange}
        />
      </Tldraw>
      <CanvasHintOverlay />
    </div>
  );
}