import { memo, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
// W starszych wersjach three (< 0.151) funkcja nazywa się mergeBufferGeometries
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* ------------------------------------------------------------------ */
/*  KOLORY I CIENIOWANIE – wszystko w jednym miejscu                   */
/* ------------------------------------------------------------------ */

const COLORS = {
    // scena – morze: jasna, turkusowa woda wokół mapy, ciemniejsza i głębsza ku brzegom
    // (gradient jest tłem CSS za przezroczystym canvasem)
    background:
        "radial-gradient(ellipse 75% 70% at 50% 46%, #C9F0F7 0%, #8FD3E8 32%, #4FA6D1 66%, #2B76AE 100%)",

    // paleta krajów (kolor kraju = countryPalette[index % długość])
    countryPalette: [
        "rgb(189, 229, 177)",
        "rgb(204, 224, 170)",
        "rgb(230, 213, 173)",
        "rgb(220, 236, 189)",
    ],

    // światła
    ambientLight: "#FFF4E0",
    mainLight: "#FFE9C7", // ciepłe słońce
    fillLight: "#6FB7E8", // chłodne światło odbite od wody
    hemiSky: "#E6F6FF",
    hemiGround: "#7FA37A",

    // łuki połączeń – czerwień
    arc: "#D9383A",

    // etykiety przy markerach
    labelBackground: "rgba(5, 20, 40, 0.92)",
    labelText: "white",

    // panel szczegółów
    panelBackground: "rgba(5, 20, 40, 0.95)",
    panelText: "white",
    panelClose: "white",

    // podpowiedź na dole
    hint: "#E8F6FC", // jasny tekst czytelny na ciemniejszej wodzie
} as const;

const SHADING = {
    // o ile (0..1) zmniejszyć jasność HSL boków/bevela względem koloru kraju
    sideLightnessDrop: 0.25,
    // mnożnik nasycenia boków (1 = bez zmian, 0 = szarość) – daje oliwkowy ton
    sideSaturationScale: 0.4,
    // przesunięcie odcienia boków (0..1 = pełny obrót koła barw; ujemne = w stronę żółci)
    sideHueShift: -0.03,
    // przesunięcie jasności górnej ścianki (0 = dokładnie kolor kraju)
    topLightnessShift: 0,
} as const;

const CAMERA = {
    fov: 25,
    position: [0, 21, 42.6] as [number, number, number],
    minDistance: 23,
    maxDistance: 60,
} as const;

/* ------------------------------------------------------------------ */
/*  STAŁE MAPY                                                         */
/* ------------------------------------------------------------------ */

const MIN_LON = -25;
const MAX_LON = 45;
const MIN_LAT = 34;
const MAX_LAT = 72;

const MAP_SCALE_X = 0.52;
const MAP_SCALE_Y = 0.82;

const MARKER_HEIGHT = 1.15;
const ARC_HEIGHT = 6;
const ARC_SEGMENTS = 24;

type Position = [number, number];

type Feature = {
    properties: {
        CONTINENT?: string;
        NAME?: string;
        ADMIN?: string;
    };
    geometry: {
        type: "Polygon" | "MultiPolygon";
        coordinates: any;
    };
};

type FeatureCollection = {
    features: Feature[];
};

type Marker = {
    name: string;
    country: string;
    coordinates: Position;
    description: string;
    color: string;
    primary?: boolean;
};

const markers: Marker[] = [
    {
        name: "",
        country: "",
        coordinates: [100000, 100000],
        description: "",
        color: "#000",
        primary: true,
    },
    // Kolory pinów: stonowana paleta współgrająca z zielono-piaskową mapą
    {
        name: "Radzymin",
        country: "Polska",
        coordinates: [21.184, 52.416],
        description: "Siedziba szkoły",
        color: "#F2B84B",
        primary: true,
    },
    {
        name: "Barcelona",
        country: "Hiszpania",
        coordinates: [2.1686, 41.3874],
        description: "Projekt Erasmus+ w Barcelonie",
        color: "#2A9D8F",
    },
    {
        name: "Malaga",
        country: "Hiszpania",
        coordinates: [-4.4214, 36.7213],
        description: "Projekt Erasmus+ w Maladze",
        color: "#E07A5F",
    },
    {
        name: "Rzym",
        country: "Włochy",
        coordinates: [12.4964, 41.9028],
        description: "Projekt Erasmus+ w Rzymie",
        color: "#8D6BB0",
    },
    {
        name: "Malta",
        country: "Malta",
        coordinates: [14.5141, 35.8992],
        description: "Projekt Erasmus+ na Malcie",
        color: "#3D7EA6",
    },
    {
        name: "Trapani",
        country: "Włochy",
        coordinates: [12.5372, 38.0176],
        description: "Kurs Yoga and Meditation for Educators w ramach akredytacji SCH",
        color: "#8D6BB0",
    },
    {
        name: "Rodos",
        country: "Grecja",
        coordinates: [28.2278, 36.4341],
        description: "Szkolenie Climate Change Education dla nauczycieli",
        color: "#3D7EA6",
    },
    {
        name: "Florencja",
        country: "Włochy",
        coordinates: [11.2558, 43.7696],
        description: "Kurs językowy dla nauczycieli w ramach akredytacji SCH",
        color: "#E07A5F",
    },
    {
        name: "Walencja",
        country: "Hiszpania",
        coordinates: [-0.3763, 39.4699],
        description: "Szkolenie dotyczące wykorzystania sztucznej inteligencji w edukacji",
        color: "#2A9D8F",
    },
    {
        name: "Lizbona",
        country: "Portugalia",
        coordinates: [-9.1393, 38.7223],
        description: "Szkolenie Leadership and Conflict Management dla kadry kierowniczej",
        color: "#C95C7C",
    },
    {
        name: "Padwa",
        country: "Włochy",
        coordinates: [11.8768, 45.4064],
        description: "Kurs Italian cooking and UNESCO Mediterranean diet dla nauczycieli",
        color: "#F2B84B",
    },
    {
        name: "Dublin",
        country: "Irlandia",
        coordinates: [-6.2603, 53.3498],
        description:
            "Wizyta studyjna Erasmus+ VET – poznawanie irlandzkiego systemu kształcenia zawodowego i poszukiwanie partnerów do współpracy",
        color: "#2A9D8F",
    },
];

/* ------------------------------------------------------------------ */
/*  GEOMETRIA / RZUTOWANIE                                             */
/* ------------------------------------------------------------------ */

function project(lon: number, lat: number): [number, number] {
    return [(lon - 10) * MAP_SCALE_X, (lat - 54) * MAP_SCALE_Y];
}

function getMarkerPosition(lon: number, lat: number, height = MARKER_HEIGHT) {
    const [x, y] = project(lon, lat);
    return new THREE.Vector3(x, height, -y);
}

function createArc(start: THREE.Vector3, end: THREE.Vector3, height = 2) {
    const midpoint = new THREE.Vector3(
        (start.x + end.x) / 2,
        height,
        (start.z + end.z) / 2
    );

    return new THREE.QuadraticBezierCurve3(start, midpoint, end).getPoints(
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

function createShape(polygon: Position[][], scale = 1): THREE.Shape | null {
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
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i][0], points[i][1]);
    }

    for (let r = 1; r < polygon.length; r++) {
        const holePoints = transformRing(polygon[r]);
        const hole = new THREE.Path();
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
function buildCountriesGeometry(
    data: FeatureCollection
): THREE.BufferGeometry | null {
    const parts: THREE.BufferGeometry[] = [];

    const base = new THREE.Color();
    const top = new THREE.Color();
    const side = new THREE.Color();
    const hsl = { h: 0, s: 0, l: 0 };

    data.features.forEach((feature, index) => {
        if (!isEuropeanFeature(feature)) return;

        // losowanie koloru kraju – bez zmian (paleta + indeks)
        base.set(COLORS.countryPalette[index % COLORS.countryPalette.length]);
        base.getHSL(hsl, THREE.SRGBColorSpace);

        top.setHSL(
            hsl.h,
            hsl.s,
            clamp01(hsl.l + SHADING.topLightnessShift),
            THREE.SRGBColorSpace
        );
        side.setHSL(
            (hsl.h + SHADING.sideHueShift + 1) % 1,
            clamp01(hsl.s * SHADING.sideSaturationScale),
            clamp01(hsl.l - SHADING.sideLightnessDrop),
            THREE.SRGBColorSpace
        );

        for (const polygon of getVisiblePolygons(feature)) {
            const shape = createShape(polygon, 0.985);
            if (!shape) continue;

            const geometry = new THREE.ExtrudeGeometry(shape, {
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

            const paint = (start: number, length: number, c: THREE.Color) => {
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

            geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
            geometry.clearGroups();
            parts.push(geometry);
        }
    });

    if (!parts.length) return null;

    const merged = mergeGeometries(parts, false);
    parts.forEach(part => part.dispose());

    return merged;
}

/* ------------------------------------------------------------------ */
/*  DANE STATYCZNE POLICZONE RAZ (poza Reactem)                        */
/* ------------------------------------------------------------------ */

const visibleMarkers = markers
    .filter(marker => marker.name)
    .map(marker => ({
        marker,
        position: getMarkerPosition(marker.coordinates[0], marker.coordinates[1]),
    }));

const homePosition = getMarkerPosition(21.184, 52.416);

const arcs = visibleMarkers
    .filter(({ marker }) => !marker.primary)
    .map(({ marker, position }) => ({
        key: marker.name,
        points: createArc(homePosition, position, ARC_HEIGHT),
    }));

// współdzielone geometrie markerów
const SPHERE_GEOMETRY = new THREE.SphereGeometry(0.32, 20, 20);
const STEM_GEOMETRY = new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6);
// miękki cień pod pinem (płaski dysk na powierzchni mapy)
const SHADOW_GEOMETRY = new THREE.PlaneGeometry(0.9, 0.9);
// wysokość górnej ścianki mapy względem środka pinu (depth 0.25 + bevel 0.045)
const SHADOW_Y = 0.295 - MARKER_HEIGHT + 0.012;

// radialna maska cienia (alphaMap czyta kanał zielony): biały środek -> czarny brzeg = pełna -> zerowa krycie
const SHADOW_ALPHA_MAP = (() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.35, "#8c8c8c");
    g.addColorStop(0.7, "#2a2a2a");
    g.addColorStop(1, "#000000");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
})();

/* ------------------------------------------------------------------ */
/*  KOMPONENTY                                                         */
/* ------------------------------------------------------------------ */

const CountryMap = memo(function CountryMap({
    data,
}: {
    data: FeatureCollection;
}) {
    const geometry = useMemo(() => buildCountriesGeometry(data), [data]);

    useEffect(() => () => geometry?.dispose(), [geometry]);

    if (!geometry) return null;

    return (
        <mesh geometry={geometry} matrixAutoUpdate={false} dispose={null}>
            {/* Lambert = oświetlenie liczone per wierzchołek, najtańsze cieniowanie */}
            <meshLambertMaterial vertexColors />
        </mesh>
    );
});

const ConnectionArcs = memo(function ConnectionArcs() {
    return (
        <>
            {arcs.map(arc => (
                <Line
                    key={arc.key}
                    points={arc.points}
                    color={COLORS.arc}
                    lineWidth={3}
                    transparent
                    opacity={0.9}
                />
            ))}
        </>
    );
});

const ProjectMarkers = memo(function ProjectMarkers({
    onSelect,
}: {
    onSelect: (marker: Marker) => void;
}) {
    return (
        <group>
            {visibleMarkers.map(({ marker, position }) => (
                <group key={marker.name} position={position}>
                    {/* cień pod pinem */}
                    <mesh
                        geometry={SHADOW_GEOMETRY}
                        dispose={null}
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[0.06, SHADOW_Y, 0.06]}
                    >
                        <meshBasicMaterial
                            color="#1c2a14"
                            alphaMap={SHADOW_ALPHA_MAP}
                            transparent
                            opacity={0.55}
                            depthWrite={false}
                        />
                    </mesh>

                    <mesh
                        geometry={SPHERE_GEOMETRY}
                        dispose={null}
                        onClick={() => onSelect(marker)}
                    >
                        {/* Lambert = matowa, cieniowana kulka (bez białego połysku); emissive utrzymuje kolor w cieniu */}
                        <meshLambertMaterial
                            color={marker.color}
                            emissive={marker.color}
                            emissiveIntensity={0.18}
                        />
                    </mesh>

                    <mesh
                        geometry={STEM_GEOMETRY}
                        dispose={null}
                        position={[0, -0.65, 0]}
                    >
                        <meshLambertMaterial color={marker.color} />
                    </mesh>

                    <Html
                        position={[0.45, 0.8, 0]}
                        center={false}
                        sprite
                        distanceFactor={12}
                        occlude={false}
                        zIndexRange={[9999, 0]}
                        style={{ pointerEvents: "auto", whiteSpace: "nowrap" }}
                    >
                        <div
                            onClick={event => {
                                event.stopPropagation();
                                onSelect(marker);
                            }}
                            style={{
                                padding: "6px 11px",
                                borderRadius: "7px",
                                background: COLORS.labelBackground,
                                border: `1px solid ${marker.color}`,
                                color: COLORS.labelText,
                                fontFamily: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
                                fontSize: "13px",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                cursor: "pointer",
                                boxShadow: `0 0 12px ${marker.color}40`,
                            }}
                        >
                            {marker.name}
                        </div>
                    </Html>
                </group>
            ))}
        </group>
    );
});

const Scene = memo(function Scene({
    data,
    onSelect,
}: {
    data: FeatureCollection;
    onSelect: (marker: Marker) => void;
}) {
    return (
        <>
            {/* tło (gradient morza) jest w CSS za przezroczystym canvasem */}

            {/* niższe ambient + hemisphere = większy kontrast między jasnymi a zacienionymi ściankami */}
            <ambientLight intensity={0.5} color={COLORS.ambientLight} />
            <hemisphereLight
                args={[COLORS.hemiSky, COLORS.hemiGround, 0.6]}
            />
            {/* słońce nisko z lewej – wyraźnie oświetla górę i lewe boki, rzuca cień na prawe */}
            <directionalLight
                position={[-16, 13, 9]}
                intensity={3.4}
                color={COLORS.mainLight}
            />
            {/* chłodne światło z przeciwnej strony – rysuje krawędzie od prawej */}
            <directionalLight
                position={[14, 8, -12]}
                intensity={1.3}
                color={COLORS.fillLight}
            />

            <ConnectionArcs />
            <CountryMap data={data} />
            <ProjectMarkers onSelect={onSelect} />

            <OrbitControls
                enableDamping
                dampingFactor={0.06}
                minDistance={CAMERA.minDistance}
                maxDistance={CAMERA.maxDistance}
                maxPolarAngle={Math.PI / 2.05}
                minPolarAngle={0.35}
                target={[2.5, 0, 3.5]}
            />
        </>
    );
});

export default function EuropeMap3D() {
    const [data, setData] = useState<FeatureCollection | null>(null);
    const [selected, setSelected] = useState<Marker | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        fetch("/data/europe.geojson", { signal: controller.signal })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Nie udało się pobrać GeoJSON");
                }
                return response.json();
            })
            .then(setData)
            .catch(err => {
                if (err.name !== "AbortError") setError(err.message);
            });

        return () => controller.abort();
    }, []);

    if (error) {
        return <div>{error}</div>;
    }

    if (!data) {
        return <div>Ładowanie mapy Europy...</div>;
    }

    return (
        <div
            style={{
                width: "100%",
                flex: 1,
                minHeight: 0,
                position: "relative",
                overflow: "hidden",
                background: COLORS.background,
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Canvas
                // render tylko gdy coś się zmienia (obrót, zoom, kliknięcie)
                frameloop="demand"
                camera={{
                    position: CAMERA.position,
                    fov: CAMERA.fov,
                    near: 0.1,
                    far: 250,
                }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, powerPreference: "high-performance" }}
                style={{ flex: 1, background: "transparent" }}
            >
                <Scene data={data} onSelect={setSelected} />
            </Canvas>

            {selected && (
                <div
                    style={{
                        position: "absolute",
                        right: 20,
                        top: 20,
                        width: 230,
                        padding: 18,
                        borderRadius: 12,
                        background: COLORS.panelBackground,
                        border: `1px solid ${selected.color}`,
                        color: COLORS.panelText,
                    }}
                >
                    <button
                        onClick={() => setSelected(null)}
                        style={{
                            float: "right",
                            background: "transparent",
                            color: COLORS.panelClose,
                            border: 0,
                            cursor: "pointer",
                            fontSize: 18,
                        }}
                    >
                        ×
                    </button>

                    <h3>{selected.name}</h3>
                    <p>{selected.country}</p>
                    <p>{selected.description}</p>
                </div>
            )}

            <div
                style={{
                    position: "absolute",
                    left: 18,
                    bottom: 18,
                    color: COLORS.hint,
                    fontSize: 12,
                    pointerEvents: "none",
                }}
            >
                Przeciągnij, aby obrócić · Scroll, aby przybliżyć
            </div>
        </div>
    );
}