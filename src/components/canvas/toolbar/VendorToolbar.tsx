"use client";
import { useEditor, useValue } from "@tldraw/tldraw";

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

function ServerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <path d="M5 16v-3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
      <path d="M12 8v3" />
    </svg>
  );
}

function DataFlowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M2 15h10" />
      <path d="M9 18l3-3-3-3" />
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
  { icon: <RectangleIcon />, tooltip: "Generic component (double-click to label)", geo: "rectangle", w: 140, h: 70 },
  { icon: <CylinderIcon />, tooltip: "Generic database / storage", geo: "cylinder", w: 80, h: 100 },
  { icon: <CircleIcon />, tooltip: "Generic service / actor", geo: "ellipse", w: 90, h: 90 },
  { icon: <DiamondIcon />, tooltip: "Decision / gateway", geo: "diamond", w: 100, h: 100 },
];

const TOOLBAR_CATEGORIES = [
  {
    name: "Compute",
    icon: <ServerIcon />,
    items: [
      { id: "client", label: "Client (Browser/Mobile)", type: "client", vendor: "web" },
      { id: "webserver", label: "Web Server", type: "webServer", vendor: "nginx" },
      { id: "appserver", label: "App Server", type: "appServer", vendor: "node" },
      { id: "apigateway", label: "API Gateway", type: "apiGateway", vendor: "kong" },
    ]
  },
  {
    name: "Storage",
    icon: <CylinderIcon />,
    items: [
      { id: "rdbms", label: "Relational DB", type: "relationalDb", vendor: "postgresql" },
      { id: "nosql", label: "NoSQL DB", type: "noSqlDb", vendor: "mongodb" },
      { id: "object", label: "Object Storage", type: "objectStorage", vendor: "s3" },
      { id: "graph", label: "Graph DB", type: "graphDb", vendor: "neo4j" },
    ]
  },
  {
    name: "Network",
    icon: <NetworkIcon />,
    items: [
      { id: "lb", label: "Load Balancer", type: "loadBalancer", vendor: "loadbalancer" },
      { id: "cdn", label: "CDN", type: "cdn", vendor: "cloudfront" }
    ]
  },
  {
    name: "Data Flow",
    icon: <DataFlowIcon />,
    items: [
      { id: "cache", label: "Cache", type: "cache", vendor: "redis" },
      { id: "queue", label: "Message Queue", type: "queue", vendor: "kafka" }
    ]
  }
];

// ─── VendorToolbar Component ─────────────────────────────────────

export function VendorToolbar() {
  const editor = useEditor();
  const currentToolId = useValue("currentToolId", () => editor.getCurrentToolId(), [editor]);
  const hasSelection = useValue("hasSelection", () => editor.getSelectedShapeIds().length > 0, [editor]);

  const setTool = (toolName: string) => editor.setCurrentTool(toolName);

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
        meta: { vendor: "generic", category: "generic", label: "", isLabeled: false },
        geo: config.geo,
      },
    });
    editor.setCurrentTool("select");
  };

  const insertShape = (type: string, vendor: string, labelText: string) => {
    const center = getViewportCenter();
    editor.createShape({
      type: type as any,
      x: center.x - 60,
      y: center.y - 40,
      props: {
        w: 120,
        h: 80,
        meta: { vendor, category: type, label: "", isLabeled: true },
      },
    });
    editor.setCurrentTool("select");
  };

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
                 border border-gray-800 shadow-lg shadow-black/30"
    >
      {/* ── Section A: Tool Modes ── */}
      <ToolButton icon={<SelectIcon />} tooltip="Select & move (V)" isActive={currentToolId === "select"} onClick={() => setTool("select")} />
      <ToolButton icon={<ArrowIcon />} tooltip="Draw connection arrow (A)" isActive={currentToolId === "arrow"} onClick={() => setTool("arrow")} />
      <ToolButton icon={<TextIcon />} tooltip="Add text annotation (T)" isActive={currentToolId === "text"} onClick={() => setTool("text")} />
      <ToolButton icon={<HandIcon />} tooltip="Pan canvas (H)" isActive={currentToolId === "hand"} onClick={() => setTool("hand")} />

      {currentToolId === "arrow" && (
        <div className="absolute left-full ml-2 top-12 z-20 bg-gray-900 border border-gray-800 rounded-md px-2.5 py-1.5 text-[10px] text-gray-400 leading-relaxed whitespace-nowrap shadow-md shadow-black/20">
          Click a shape edge to start · Double-click arrow to label it
        </div>
      )}

      {currentToolId === "text" && (
        <div className="absolute left-full ml-2 top-24 z-20 bg-gray-900 border border-gray-800 rounded-md px-2.5 py-1.5 text-[10px] text-gray-400 leading-relaxed whitespace-nowrap shadow-md shadow-black/20">
          Click anywhere on canvas to add text · These annotations are included in AI context
        </div>
      )}

      <div className="w-7 h-px bg-gray-800 my-0.5" />

      {/* ── Section B: Basic Shapes ── */}
      {BASIC_SHAPES.map((config, i) => (
        <ToolButton key={`basic-${i}`} icon={config.icon} tooltip={config.tooltip} onClick={() => insertBasicShape(config)} />
      ))}

      <div className="w-7 h-px bg-gray-800 my-0.5" />

      {/* ── Section B continued: Component Categories ── */}
      {TOOLBAR_CATEGORIES.map((category) => (
        <div key={category.name} className="group relative">
          <button
            title={category.name}
            aria-label={category.name}
            className="w-9 h-9 rounded-lg bg-transparent text-gray-400
                       hover:bg-gray-800 hover:text-white
                       flex items-center justify-center cursor-pointer
                       transition-colors duration-100 text-base"
          >
            {category.icon}
          </button>

          {/* Submenu on hover */}
          <div
            className="absolute left-full ml-1 top-0 hidden group-hover:flex
                       flex-col gap-0.5 bg-gray-900 rounded-lg p-2
                       border border-gray-800 min-w-[200px] shadow-lg shadow-black/30 z-30"
          >
            <p className="text-[10px] text-gray-500 uppercase tracking-wider px-2 mb-1 font-medium">
              {category.name}
            </p>
            {category.items.map((item) => (
              <button
                key={item.id}
                title={`${item.label} / ${item.vendor}`}
                onClick={() => insertShape(item.type, item.vendor, item.label)}
                className="flex items-center gap-2 px-2 py-1.5 rounded
                           hover:bg-gray-700 text-sm text-gray-300 hover:text-white
                           transition-colors duration-75 cursor-pointer"
              >
                <img
                  src={`/icons/vendors/${item.vendor}.svg`}
                  className="w-4 h-4 object-contain"
                  alt=""
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="flex flex-col text-left">
                  <span className="font-medium text-white text-xs">{item.label}</span>
                  <span className="text-[10px] text-gray-400">{item.vendor}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="w-7 h-px bg-gray-800 my-0.5" />

      {/* ── Section C: Canvas Actions ── */}
      <ToolButton icon={<UndoIcon />} tooltip="Undo (Ctrl+Z)" onClick={handleUndo} />
      <ToolButton icon={<RedoIcon />} tooltip="Redo (Ctrl+Shift+Z)" onClick={handleRedo} />
      <ToolButton icon={<TrashIcon />} tooltip="Delete selected (Del)" disabled={!hasSelection} onClick={handleDelete} />
    </div>
  );
}