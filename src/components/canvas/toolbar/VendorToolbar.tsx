"use client";
import { useEditor } from "@tldraw/tldraw";
import { VENDOR_CATALOGUE } from "../shapes";

export function VendorToolbar() {
  const editor = useEditor();

  const addShape = (category: string, vendor: string) => {
    editor.createShape({
      type: category,
      x: 200,
      y: 200,
      props: {
        w: 120,
        h: 80,
        meta: { vendor, category, label: "", isLabeled: false },
      },
    });
  };

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10
                    flex flex-col gap-2 bg-gray-900 rounded-xl p-2 
                    border border-gray-700">
      {Object.entries(VENDOR_CATALOGUE).map(([category, vendors]) => (
        <div key={category} className="group relative">
          {/* Category icon button */}
          <button className="w-10 h-10 rounded-lg bg-gray-800 
                             hover:bg-gray-700 flex items-center justify-center">
            <img src={`/icons/categories/${category}.svg`} className="w-5 h-5" />
          </button>

          {/* Vendor submenu on hover */}
          <div className="absolute left-12 top-0 hidden group-hover:flex
                          flex-col gap-1 bg-gray-900 rounded-lg p-2
                          border border-gray-700 min-w-[140px]">
            <p className="text-xs text-gray-400 uppercase px-2 mb-1">
              {category}
            </p>
            {vendors.map((vendor) => (
              <button
                key={vendor}
                onClick={() => addShape(category, vendor)}
                className="flex items-center gap-2 px-2 py-1 rounded
                           hover:bg-gray-700 text-sm text-white"
              >
                <img src={`/icons/vendors/${vendor}.svg`} className="w-4 h-4" />
                {vendor}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}