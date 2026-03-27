import type { ShapeMeta } from "@/types";

// Tell tldraw's schema types about our custom "database" shape.
// This is required so `TLShape<"database">` satisfies `ShapeUtil`'s `Shape extends TLShape` constraint.
declare module "@tldraw/tlschema" {
  interface TLGlobalShapePropsMap {
    database: {
      meta: ShapeMeta;
      w: number;
      h: number;
    };
    cache: {
      meta: ShapeMeta;
      w: number;
      h: number;
    };
    queue: {
      meta: ShapeMeta;
      w: number;
      h: number;
    };
    server: {
      meta: ShapeMeta;
      w: number;
      h: number;
    };
    client: {
      meta: ShapeMeta;
      w: number;
      h: number;
    };
    cdn: {
      meta: ShapeMeta;
      w: number;
      h: number;
    };
    generic: {
      meta: ShapeMeta;
      geo?: string | undefined;
      w: number;
      h: number;
    };
  }
}

