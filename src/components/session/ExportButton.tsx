"use client";

import { useState, useEffect } from "react";
import { useEditor } from "@tldraw/tldraw";
import { useSession } from "next-auth/react";
import { createPortal } from "react-dom";
import { ProBadge } from "@/components/ui/ProBadge";

export function ExportButton() {
  const editor = useEditor();
  const { data: authSession } = useSession();
  const tier = (authSession?.user as { tier?: string } | undefined)?.tier ?? "FREE";
  const canExport = tier === "PRO" || tier === "PREMIUM";
  const [isExporting, setIsExporting] = useState(false);
  const [target, setTarget] = useState<Element | null>(null);

  useEffect(() => {
    setTarget(document.getElementById("export-button-portal"));
  }, []);

  const handleExport = async () => {
    if (!canExport) return;
    setIsExporting(true);
    try {
      const shapeIds = Array.from(editor.getCurrentPageShapeIds());
      if (shapeIds.length === 0) return;
      
      const { blob } = await editor.toImage(shapeIds, {
        format: "png",
        scale: 2,
      });
      
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sysdraw-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[export] Failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const button = !canExport ? (
    <a
      href="/billing"
      className="text-xs text-gray-500 hover:text-gray-300 border border-gray-800 hover:border-gray-600 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
      title="Export available on Pro plan"
    >
      <ProBadge size="xs" />
      Export
    </a>
  ) : (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isExporting ? "Exporting..." : "Export"}
    </button>
  );

  if (!target) return null;
  return createPortal(button, target);
}
