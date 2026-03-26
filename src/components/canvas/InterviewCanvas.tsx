"use client";
import { Tldraw, useEditor, TLRecord } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useEffect, useRef, useCallback } from "react";
import { CUSTOM_SHAPE_UTILS } from "./shapes";
import { VendorToolbar } from "./toolbar/VendorToolbar";
import { parseCanvasToGraph, hasGraphChanged } from "@/lib/graph-parser";
import { SemanticGraph } from "@/types";

interface Props {
  onGraphChange: (graph: SemanticGraph) => void;
  onCanvasRecordsChange?: (records: TLRecord[]) => void;
}

const DEBOUNCE_MS = 1500;

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

export function InterviewCanvas({ onGraphChange, onCanvasRecordsChange }: Props) {
  return (
    <div className="w-full h-full relative">
      <Tldraw
        shapeUtils={CUSTOM_SHAPE_UTILS}
        components={{ Toolbar: () => null }} // hide default toolbar
      >
        <VendorToolbar />
        <CanvasWatcher
          onGraphChange={onGraphChange}
          onCanvasRecordsChange={onCanvasRecordsChange}
        />
      </Tldraw>
    </div>
  );
}