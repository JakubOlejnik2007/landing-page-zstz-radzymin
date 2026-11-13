/* ------------------------------------------------------------------ */
/*  GEOMETRIA / RZUTOWANIE                                             */
/* ------------------------------------------------------------------ */

import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Feature, Position, FeatureCollection } from "../../types/map";
import { MAP_SCALE_X, MAP_SCALE_Y, MARKER_HEIGHT, ARC_SEGMENTS, MIN_LON, MAX_LON, MIN_LAT, MAX_LAT, COLORS, SHADING } from "./MapConsts";
import { BufferAttribute, BufferGeometry, Color, ExtrudeGeometry, Path, QuadraticBezierCurve3, Shape, SRGBColorSpace, Vector3 } from "three";

function project(lon: number, lat: number): [number, number] {
    return [(lon - 10) * MAP_SCALE_X, (lat - 54) * MAP_SCALE_Y];
}

export function getMarkerPosition(lon: number, lat: number, height = MARKER_HEIGHT) {
    const [x, y] = project(lon, lat);
    return new Vector3(x, height, -y);
}

export function createArc(start: Vector3, end: Vector3, height = 2) {
    const midpoint = new Vector3(
        (start.x + end.x) / 2,
        height,
        (start.z + end.z) / 2
    );

    return new QuadraticBezierCurve3(start, midpoint, end).getPoints(
        ARC_SEGMENTS
    );
}

function getVisiblePolygons(feature: Feature): Position[][][] {
    const polygons: Position[][][] =
        feature.geometry.type === "Polygon"
            ? [feature.geometry.coordinates]
            : feature.geometry.coordinates;

    return polygons.filter(polygon => {
        const ring = polygon[0];
        let lon = 0;
        let lat = 0;

        for (const point of ring) {
            lon += point[0];
            lat += point[1];
        }

        lon /= ring.length;
        lat /= ring.length;

        return lon >= MIN_LON && lon <= MAX_LON && lat >= MIN_LAT && lat <= MAX_LAT;
    });
}

function isEuropeanFeature(feature: Feature) {
    const { CONTINENT: continent, NAME: name } = feature.properties;

    if (name === "Russia") return false;
    return continent === "Europe" || name === "Turkey";
}

function createShape(polygon: Position[][], scale = 1): Shape | null {
    const outerRing = polygon[0];

    if (!outerRing || outerRing.length < 3) return null;

    const outer = outerRing.map(([lon, lat]) => project(lon, lat));

    let centerX = 0;
    let centerY = 0;
    for (const [x, y] of outer) {
        centerX += x;
        centerY += y;
    }
    centerX /= outer.length;
    centerY /= outer.length;

    const transformRing = (ring: Position[]) =>
        ring.map(([lon, lat]) => {
            const [x, y] = project(lon, lat);
            return [
                centerX + (x - centerX) * scale,
                centerY + (y - centerY) * scale,
            ] as Position;
        });

    const points = transformRing(outerRing);
    const shape = new Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i][0], points[i][1]);
    }

    for (let r = 1; r < polygon.length; r++) {
        const holePoints = transformRing(polygon[r]);
        const hole = new Path();
        hole.moveTo(holePoints[0][0], holePoints[0][1]);
        for (let i = 1; i < holePoints.length; i++) {
            hole.lineTo(holePoints[i][0], holePoints[i][1]);
        }
        shape.holes.push(hole);
    }

    return shape;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Buduje JEDNĄ geometrię dla wszystkich krajów.
 * Kolory są zapisane w vertex colors:
 *  - ścianka górna/dolna = kolor kraju,
 *  - boki + bevel = ten sam kolor o obniżonej jasności (HSL).
 * Dzięki temu cała mapa to 1 mesh, 1 materiał, 1 draw call.
 */
export function buildCountriesGeometry(
    data: FeatureCollection
): BufferGeometry | null {
    const parts: BufferGeometry[] = [];

    const base = new Color();
    const top = new Color();
    const side = new Color();
    const hsl = { h: 0, s: 0, l: 0 };

    data.features.forEach((feature, index) => {
        if (!isEuropeanFeature(feature)) return;

        // losowanie koloru kraju – bez zmian (paleta + indeks)
        base.set(COLORS.countryPalette[index % COLORS.countryPalette.length]);
        base.getHSL(hsl, SRGBColorSpace);

        top.setHSL(
            hsl.h,
            hsl.s,
            clamp01(hsl.l + SHADING.topLightnessShift),
            SRGBColorSpace
        );
        side.setHSL(
            (hsl.h + SHADING.sideHueShift + 1) % 1,
            clamp01(hsl.s * SHADING.sideSaturationScale),
            clamp01(hsl.l - SHADING.sideLightnessDrop),
            SRGBColorSpace
        );

        for (const polygon of getVisiblePolygons(feature)) {
            const shape = createShape(polygon, 0.985);
            if (!shape) continue;

            const geometry = new ExtrudeGeometry(shape, {
                depth: 0.25,
                bevelEnabled: true,
                bevelSegments: 1,
                steps: 1,
                bevelSize: 0.045,
                bevelThickness: 0.045,
            });

            geometry.rotateX(-Math.PI / 2);
            geometry.deleteAttribute("uv"); // niepotrzebne, mniej pamięci

            const count = geometry.attributes.position.count;
            const colors = new Float32Array(count * 3);

            const paint = (start: number, length: number, c: Color) => {
                for (let i = start; i < start + length; i++) {
                    colors[i * 3] = c.r;
                    colors[i * 3 + 1] = c.g;
                    colors[i * 3 + 2] = c.b;
                }
            };

            if (geometry.groups.length) {
                // grupa 0 = ścianki górna/dolna, grupa 1 = boki + bevel
                for (const g of geometry.groups) {
                    paint(g.start, g.count, g.materialIndex === 0 ? top : side);
                }
            } else {
                paint(0, count, top);
            }

            geometry.setAttribute("color", new BufferAttribute(colors, 3));
            geometry.clearGroups();
            parts.push(geometry);
        }
    });

    if (!parts.length) return null;

    const merged = mergeGeometries(parts, false);
    parts.forEach(part => part.dispose());

    return merged;
}