import { ShapeUtil, TLShape, HTMLContainer } from "@tldraw/tldraw";
import { ShapeMeta } from "@/types";
import { Rectangle2d } from "@tldraw/editor";
import type { Geometry2d, TLGeometryOpts } from "@tldraw/editor";

// Shape type definition
export type DatabaseShapeType = TLShape<"database">;

export class DatabaseShapeUtil extends ShapeUtil<DatabaseShapeType> {
  static override type = "database" as const;

  getDefaultProps(): DatabaseShapeType["props"] {
    return {
      w: 120,
      h: 80,
      meta: {
        vendor: "postgresql",  // default — user can change
        category: "database",
        label: "",
        isLabeled: false,
      },
    };
  }

  getGeometry(shape: DatabaseShapeType, _opts?: TLGeometryOpts): Geometry2d {
    return new Rectangle2d({
      x: 0,
      y: 0,
      width: shape.props.w,
      height: shape.props.h,
      // Geometry is used for hit-testing & layout; we don't need to fill it.
      isFilled: false,
    });
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
          {/* Vendor icon — map vendor string to SVG */}
          <img
            src={`/icons/vendors/${meta.vendor}.svg`}
            className="w-8 h-8"
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
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: DatabaseShapeType) {
    return <rect width={shape.props.w} height={shape.props.h} rx={8} />;
  }
}
