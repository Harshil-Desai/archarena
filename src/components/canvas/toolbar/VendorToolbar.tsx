"use client";
import { useEditor, useValue } from "@tldraw/tldraw";
import { VENDOR_CATALOGUE } from "../shapes";

// ─── Inline SVG Icons ────────────────────────────────────────────

function SelectIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="19" x2="19" y2="5" />
      <polyline points="12 5 19 5 19 12" />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="8" y1="20" x2="16" y2="20" />
    </svg>
  );
}

function HandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-4 0v1M14 10V4a2 2 0 0 0-4 0v6M10 10V5a2 2 0 0 0-4 0v9" />
      <path d="M18 11a2 2 0 0 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.9-2.4L3.3 16a2 2 0 0 1 3-2.5L8 15" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function RectangleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
    </svg>
  );
}

function CylinderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l10 10-10 10L2 12z" />
    </svg>
  );
}

// ─── Tool Button ─────────────────────────────────────────────────

interface ToolButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolButton({ icon, tooltip, isActive, disabled, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      aria-label={tooltip}
      className={`
        w-9 h-9 rounded-lg flex items-center justify-center
        transition-colors duration-100
        ${isActive ? "bg-gray-700 text-white" : "bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white"}
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {icon}
    </button>
  );
}

// ─── Basic Shape Helpers ─────────────────────────────────────────

type GeoType = "rectangle" | "ellipse" | "diamond" | "cylinder";

interface BasicShapeConfig {
  icon: React.ReactNode;
  tooltip: string;
  geo: GeoType;
  w: number;
  h: number;
}

const BASIC_SHAPES: BasicShapeConfig[] = [
  {
    icon: <RectangleIcon />,
    tooltip: "Generic component (double-click to label)",
    geo: "rectangle",
    w: 140,
    h: 70,
  },
  {
    icon: <CylinderIcon />,
    tooltip: "Generic database / storage",
    geo: "cylinder",
    w: 80,
    h: 100,
  },
  {
    icon: <CircleIcon />,
    tooltip: "Generic service / actor",
    geo: "ellipse",
    w: 90,
    h: 90,
  },
  {
    icon: <DiamondIcon />,
    tooltip: "Decision / gateway",
    geo: "diamond",
    w: 100,
    h: 100,
  },
];

// ─── VendorToolbar Component ─────────────────────────────────────

export function VendorToolbar() {
  const editor = useEditor();

  // Reactive current tool id — updates when tool changes
  const currentToolId = useValue("currentToolId", () => editor.getCurrentToolId(), [editor]);

  // Reactive selection count for enabling/disabling delete
  const hasSelection = useValue("hasSelection", () => editor.getSelectedShapeIds().length > 0, [editor]);

  // ─── Tool mode handlers ──────────────────

  const setTool = (toolName: string) => {
    editor.setCurrentTool(toolName);
  };

  // ─── Shape insertion helpers ─────────────

  const getViewportCenter = () => {
    const bounds = editor.getViewportPageBounds();
    return { x: bounds.center.x, y: bounds.center.y };
  };

  const insertBasicShape = (config: BasicShapeConfig) => {
    const center = getViewportCenter();
    editor.createShape({
      type: "generic",
      x: center.x - config.w / 2,
      y: center.y - config.h / 2,
      props: {
        w: config.w,
        h: config.h,
        meta: {
          vendor: "generic",
          category: "generic",
          label: "",
          isLabeled: false,
        },
        geo: config.geo,
      },
    });
    editor.setCurrentTool("select");
  };

  const insertVendorShape = (category: keyof typeof VENDOR_CATALOGUE, vendor: string) => {
    const center = getViewportCenter();
    editor.createShape({
      type: category,
      x: center.x - 60,
      y: center.y - 40,
      props: {
        w: 120,
        h: 80,
        meta: { vendor, category, label: "", isLabeled: true },
      },
    });
    editor.setCurrentTool("select");
  };

  // ─── Canvas actions ──────────────────────

  const handleUndo = () => editor.undo();
  const handleRedo = () => editor.redo();
  const handleDelete = () => {
    const ids = editor.getSelectedShapeIds();
    if (ids.length > 0) editor.deleteShapes(ids);
  };

  return (
    <div
      className="absolute left-3 top-1/2 -translate-y-1/2 z-10
                 flex flex-col items-center gap-1 bg-gray-900 rounded-xl p-1.5
                 border border-gray-700 shadow-lg shadow-black/30"
    >
      {/* ── Section A: Tool Modes ── */}
      <ToolButton
        icon={<SelectIcon />}
        tooltip="Select & move (V)"
        isActive={currentToolId === "select"}
        onClick={() => setTool("select")}
      />
      <ToolButton
        icon={<ArrowIcon />}
        tooltip="Draw connection arrow (A)"
        isActive={currentToolId === "arrow"}
        onClick={() => setTool("arrow")}
      />
      <ToolButton
        icon={<TextIcon />}
        tooltip="Add text annotation (T)"
        isActive={currentToolId === "text"}
        onClick={() => setTool("text")}
      />
      <ToolButton
        icon={<HandIcon />}
        tooltip="Pan canvas (H)"
        isActive={currentToolId === "hand"}
        onClick={() => setTool("hand")}
      />

      {/* Arrow helper text */}
      {currentToolId === "arrow" && (
        <div
          className="absolute left-full ml-2 top-12 z-20
                     bg-gray-900 border border-gray-700 rounded-md px-2.5 py-1.5
                     text-[10px] text-gray-400 leading-relaxed whitespace-nowrap
                     shadow-md shadow-black/20"
        >
          Click a shape edge to start · Double-click arrow to label it
        </div>
      )}

      {/* Text helper text */}
      {currentToolId === "text" && (
        <div
          className="absolute left-full ml-2 top-24 z-20
                     bg-gray-900 border border-gray-700 rounded-md 
                     px-2.5 py-1.5 text-[10px] text-gray-400 
                     leading-relaxed whitespace-nowrap
                     shadow-md shadow-black/20"
        >
          Click anywhere on canvas to add text · These annotations are included in AI context
        </div>
      )}

      {/* ── Divider ── */}
      <div className="w-7 h-px bg-gray-700 my-0.5" />

      {/* ── Section B: Basic Shapes ── */}
      {BASIC_SHAPES.map((config, i) => (
        <ToolButton
          key={`basic-${i}`}
          icon={config.icon}
          tooltip={config.tooltip}
          onClick={() => insertBasicShape(config)}
        />
      ))}

      {/* ── Divider ── */}
      <div className="w-7 h-px bg-gray-700 my-0.5" />

      {/* ── Section B continued: Vendor Categories ── */}
      {(
        Object.entries(VENDOR_CATALOGUE) as Array<
          [keyof typeof VENDOR_CATALOGUE, readonly string[]]
        >
      ).map(([category, vendors]) => (
        <div key={category} className="group relative">
          <button
            title={category.charAt(0).toUpperCase() + category.slice(1)}
            aria-label={category.charAt(0).toUpperCase() + category.slice(1)}
            className="w-9 h-9 rounded-lg bg-transparent text-gray-400
                       hover:bg-gray-800 hover:text-white
                       flex items-center justify-center cursor-pointer
                       transition-colors duration-100 text-base"
          >
            <img src={`/icons/categories/${category}.svg`} className="w-5 h-5" />
          </button>

          {/* Vendor submenu on hover */}
          <div
            className="absolute left-full ml-1 top-0 hidden group-hover:flex
                       flex-col gap-0.5 bg-gray-900 rounded-lg p-2
                       border border-gray-700 min-w-[140px] shadow-lg shadow-black/30 z-30"
          >
            <p className="text-[10px] text-gray-500 uppercase tracking-wider px-2 mb-1 font-medium">
              {category}
            </p>
            {vendors.map((vendor) => (
              <button
                key={vendor}
                onClick={() => insertVendorShape(category, vendor)}
                className="flex items-center gap-2 px-2 py-1.5 rounded
                           hover:bg-gray-700 text-sm text-gray-300 hover:text-white
                           transition-colors duration-75 cursor-pointer"
              >
                <img
                  src={`/icons/vendors/${vendor}.svg`}
                  className="w-4 h-4"
                  alt=""
                  onError={(e) => {
                    // Hide broken icon gracefully
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {vendor}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* ── Divider ── */}
      <div className="w-7 h-px bg-gray-700 my-0.5" />

      {/* ── Section C: Canvas Actions ── */}
      <ToolButton
        icon={<UndoIcon />}
        tooltip="Undo (Ctrl+Z)"
        onClick={handleUndo}
      />
      <ToolButton
        icon={<RedoIcon />}
        tooltip="Redo (Ctrl+Shift+Z)"
        onClick={handleRedo}
      />
      <ToolButton
        icon={<TrashIcon />}
        tooltip="Delete selected (Del)"
        disabled={!hasSelection}
        onClick={handleDelete}
      />
    </div>
  );
}