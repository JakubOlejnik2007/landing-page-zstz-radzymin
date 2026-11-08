import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const MAP_BACKGROUND = "#071426";

const MIN_LON = -25;
const MAX_LON = 45;
const MIN_LAT = 34;
const MAX_LAT = 72;

const MAP_SCALE_X = 0.52;
const MAP_SCALE_Y = 0.82;

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

const countryColors = [
    "#A5C8E8",
    "#B8D8D0",
    "#D8C8E8",
    "#E8D5B5",
    "#B9C9E8",
    "#D8E2B8",
    "#E8C5C5",
    "#B8DCE8",
];

const markers: Marker[] = [
    {
        name: "",
        country: "",
        coordinates: [100000, 100000],
        description: "",
        color: "#000",
        primary: true
    },
    {
        name: "Radzymin",
        country: "Polska",
        coordinates: [21.184, 52.416],
        description: "Siedziba szkoły",
        color: "#FACC15",
        primary: true,
    },
    {
        name: "Barcelona",
        country: "Hiszpania",
        coordinates: [2.1686, 41.3874],
        description: "Projekt Erasmus+ w Barcelonie",
        color: "#38BDF8",
    },
    {
        name: "Malaga",
        country: "Hiszpania",
        coordinates: [-4.4214, 36.7213],
        description: "Projekt Erasmus+ w Maladze",
        color: "#F59E0B",
    },
    {
        name: "Rzym",
        country: "Włochy",
        coordinates: [12.4964, 41.9028],
        description: "Projekt Erasmus+ w Rzymie",
        color: "#A78BFA",
    },
    {
        name: "Malta",
        country: "Malta",
        coordinates: [14.5141, 35.8992],
        description: "Projekt Erasmus+ na Malcie",
        color: "#34D399",
    }, {
        name: "Trapani",
        country: "Włochy",
        coordinates: [12.5372, 38.0176],
        description: "Kurs Yoga and Meditation for Educators w ramach akredytacji SCH",
        color: "#A78BFA",
    },
    {
        name: "Rodos",
        country: "Grecja",
        coordinates: [28.2278, 36.4341],
        description: "Szkolenie Climate Change Education dla nauczycieli",
        color: "#34D399",
    },
    {
        name: "Florencja",
        country: "Włochy",
        coordinates: [11.2558, 43.7696],
        description: "Kurs językowy dla nauczycieli w ramach akredytacji SCH",
        color: "#F59E0B",
    },
    {
        name: "Walencja",
        country: "Hiszpania",
        coordinates: [-0.3763, 39.4699],
        description: "Szkolenie dotyczące wykorzystania sztucznej inteligencji w edukacji",
        color: "#38BDF8",
    },
    {
        name: "Lizbona",
        country: "Portugalia",
        coordinates: [-9.1393, 38.7223],
        description: "Szkolenie Leadership and Conflict Management dla kadry kierowniczej",
        color: "#F472B6",
    },
    {
        name: "Padwa",
        country: "Włochy",
        coordinates: [11.8768, 45.4064],
        description: "Kurs Italian cooking and UNESCO Mediterranean diet dla nauczycieli",
        color: "#FACC15",
    },
    {
        name: "Dublin",
        country: "Irlandia",
        coordinates: [-6.2603, 53.3498],
        description: "Wizyta studyjna Erasmus+ VET – poznawanie irlandzkiego systemu kształcenia zawodowego i poszukiwanie partnerów do współpracy",
        color: "#38BDF8",
    }
];



function project(lon: number, lat: number): [number, number] {
    return [
        (lon - 10) * MAP_SCALE_X,
        (lat - 54) * MAP_SCALE_Y,
    ];
}

function getVisiblePolygons(feature: Feature): Position[][][] {
    const polygons =
        feature.geometry.type === "Polygon"
            ? [feature.geometry.coordinates]
            : feature.geometry.coordinates;

    const getArea = (polygon: Position[][]) => {
        const ring = polygon[0];
        let area = 0;

        for (let i = 0; i < ring.length; i++) {
            const current = ring[i];
            const next = ring[(i + 1) % ring.length];

            area += current[0] * next[1] - next[0] * current[1];
        }

        return Math.abs(area / 2);
    };

    const getCenter = (polygon: Position[][]) => {
        const ring = polygon[0];

        return {
            lon: ring.reduce((sum, point) => sum + point[0], 0) / ring.length,
            lat: ring.reduce((sum, point) => sum + point[1], 0) / ring.length,
        };
    };

    const europeanPolygons = polygons.filter(polygon => {
        const { lon, lat } = getCenter(polygon);

        return (
            lon >= MIN_LON &&
            lon <= MAX_LON &&
            lat >= MIN_LAT &&
            lat <= MAX_LAT
        );
    });

    return europeanPolygons;
}
function createArc(
    start: THREE.Vector3,
    end: THREE.Vector3,
    height = 2
) {
    const midpoint = new THREE.Vector3(
        (start.x + end.x) / 2,
        height,
        (start.z + end.z) / 2
    );

    const curve = new THREE.QuadraticBezierCurve3(
        start,
        midpoint,
        end
    );

    return curve.getPoints(50);
}

function clipBoundary(
    points: Position[],
    inside: (point: Position) => boolean,
    intersection: (a: Position, b: Position) => Position
): Position[] {
    const result: Position[] = [];

    if (!points.length) return result;

    for (let i = 0; i < points.length; i++) {
        const current = points[i];
        const previous = points[(i + points.length - 1) % points.length];

        const currentInside = inside(current);
        const previousInside = inside(previous);

        if (currentInside) {
            if (!previousInside) {
                result.push(intersection(previous, current));
            }
            result.push(current);
        } else if (previousInside) {
            result.push(intersection(previous, current));
        }
    }

    return result;
}

function clipRing(ring: Position[]): Position[] {
    let points = ring.slice(0, -1);

    points = clipBoundary(
        points,
        p => p[0] >= MIN_LON,
        (a, b) => {
            const t = (MIN_LON - a[0]) / (b[0] - a[0]);
            return [MIN_LON, a[1] + t * (b[1] - a[1])];
        }
    );

    points = clipBoundary(
        points,
        p => p[0] <= MAX_LON,
        (a, b) => {
            const t = (MAX_LON - a[0]) / (b[0] - a[0]);
            return [MAX_LON, a[1] + t * (b[1] - a[1])];
        }
    );

    points = clipBoundary(
        points,
        p => p[1] >= MIN_LAT,
        (a, b) => {
            const t = (MIN_LAT - a[1]) / (b[1] - a[1]);
            return [a[0] + t * (b[0] - a[0]), MIN_LAT];
        }
    );

    points = clipBoundary(
        points,
        p => p[1] <= MAX_LAT,
        (a, b) => {
            const t = (MAX_LAT - a[1]) / (b[1] - a[1]);
            return [a[0] + t * (b[0] - a[0]), MAX_LAT];
        }
    );

    return points;
}

function createShape(
    polygon: Position[][],
    scale = 1
): THREE.Shape | null {
    const outerRing = polygon[0];

    if (!outerRing || outerRing.length < 3) return null;

    const projected = outerRing.map(([lon, lat]) =>
        project(lon, lat)
    );

    const centerX =
        projected.reduce((sum, point) => sum + point[0], 0) /
        projected.length;

    const centerY =
        projected.reduce((sum, point) => sum + point[1], 0) /
        projected.length;

    const transformRing = (ring: Position[]) =>
        ring.map(([lon, lat]) => {
            const [x, y] = project(lon, lat);

            return [
                centerX + (x - centerX) * scale,
                centerY + (y - centerY) * scale,
            ] as [number, number];
        });

    const points = transformRing(outerRing);

    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);

    points.slice(1).forEach(([x, y]) => {
        shape.lineTo(x, y);
    });

    polygon.slice(1).forEach(ring => {
        const holePoints = transformRing(ring);

        const hole = new THREE.Path();
        hole.moveTo(holePoints[0][0], holePoints[0][1]);

        holePoints.slice(1).forEach(([x, y]) => {
            hole.lineTo(x, y);
        });

        shape.holes.push(hole);
    });

    return shape;
}

function CountryMap({
    data,
}: {
    data: FeatureCollection;
}) {
    const countries = useMemo(() => {
        const geometries: {
            id: string;
            geometry: THREE.ExtrudeGeometry;
            color: string;
        }[] = [];

        data.features.forEach((feature, index) => {
            const continent = feature.properties.CONTINENT;
            const name = feature.properties.NAME;

            if (
                continent !== "Europe" &&
                name !== "Turkey" || name === "Russia"
            ) {
                return;
            }

            const polygons = getVisiblePolygons(feature);

            polygons.forEach((polygon: Position[][]) => {
                const shape = createShape(polygon, 0.985);

                if (!shape) return;

                const geometry = new THREE.ExtrudeGeometry(shape, {
                    depth: 0.25,
                    bevelEnabled: true,
                    bevelSegments: 1,
                    steps: 1,
                    bevelSize: 0.045,
                    bevelThickness: 0.045,
                });

                geometry.rotateX(-Math.PI / 2);
                geometry.computeVertexNormals();

                geometries.push({
                    id: `${index}-${geometries.length}`,
                    geometry,
                    color: countryColors[index % countryColors.length],
                });
            });
        });

        return geometries;
    }, [data]);

    return (
        <group>
            {countries.map(country => (
                <mesh
                    key={country.id}
                    geometry={country.geometry}
                >
                    <meshStandardMaterial
                        attach="material-0"
                        color={new THREE.Color(country.color).multiplyScalar(0.7)}
                        roughness={0.65}
                        metalness={0.25}
                    />
                    <meshStandardMaterial
                        attach="material-1"
                        color="#2685CF"
                        roughness={0.45}
                        metalness={0.2}
                    />
                </mesh>
            ))}
        </group>
    );
}

import { Line } from "@react-three/drei";

function ConnectionArc({
    start,
    end,
}: {
    start: THREE.Vector3;
    end: THREE.Vector3;
}) {
    const points = useMemo(
        () => createArc(start, end, 6),
        [start, end]
    );

    return (
        <Line
            points={points}
            color="crimson"
            lineWidth={3}
            transparent
            opacity={0.7}
        />
    );
}

function ProjectMarkers({
    onSelect,
}: {
    onSelect: (marker: Marker) => void;
}) {
    return (
        <group>
            {markers.map((marker, index) => {
                const [x, z] = project(
                    marker.coordinates[0],
                    marker.coordinates[1]
                );

                return (
                    <group
                        key={`${index}-${marker.name}`}
                        position={[x, 1.15, -z]}
                    >
                        <mesh
                            onClick={() => onSelect(marker)}
                        >
                            <sphereGeometry args={[0.32, 24, 24]} />
                            <meshStandardMaterial
                                color={marker.color}
                                emissive={marker.color}
                                emissiveIntensity={1.5}
                            />
                        </mesh>

                        <mesh
                            position={[0, -0.65, 0]}
                        >
                            <cylinderGeometry args={[0.025, 0.025, 0.7, 8]} />
                            <meshStandardMaterial color={marker.color} />
                        </mesh>

                        <Html
                            position={[0.45, 0.8, 0]}
                            center={false}
                            sprite
                            distanceFactor={12}
                            occlude={false}
                            zIndexRange={[9999, 0]}
                            style={{
                                pointerEvents: "auto",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <div
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onSelect(marker);
                                }}
                                style={{
                                    padding: "6px 11px",
                                    borderRadius: "7px",
                                    background: "rgba(5, 20, 40, 0.92)",
                                    border: `1px solid ${marker.color}`,
                                    color: "white",
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
                );
            })}
        </group>
    );
}
function getMarkerPosition(
    lon: number,
    lat: number,
    height = 1.15
) {
    const [x, y] = project(lon, lat);

    return new THREE.Vector3(x, height, -y);
}


function Scene({
    data,
    onSelect,
}: {
    data: FeatureCollection;
    onSelect: (marker: Marker) => void;
}) {

    const radzymin = getMarkerPosition(21.184, 52.416);

    return (
        <>
            <color attach="background" args={[MAP_BACKGROUND]} />

            <ambientLight intensity={1.2} />

            <directionalLight
                position={[-10, 20, 10]}
                intensity={2.5}
            />

            <directionalLight
                position={[10, 12, -10]}
                intensity={1}
                color="#38BDF8"
            />

            {

                markers.filter(location => !location.primary).map(location => {
                    const end = getMarkerPosition(
                        location.coordinates[0],
                        location.coordinates[1]
                    );

                    return (
                        <ConnectionArc
                            key={location.name}
                            start={radzymin}
                            end={end}
                        />
                    );
                })
            }

            <CountryMap data={data} />

            <ProjectMarkers onSelect={onSelect} />




            <OrbitControls
                enableDamping
                dampingFactor={0.06}
                minDistance={16}
                maxDistance={42}
                maxPolarAngle={Math.PI / 2.05}
                minPolarAngle={0.35}
                target={[0, 0, 0]}
            />
        </>
    );
}

export default function EuropeMap3D() {
    const [data, setData] = useState<FeatureCollection | null>(null);
    const [selected, setSelected] = useState<Marker | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/data/europe.geojson")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Nie udało się pobrać GeoJSON");
                }
                return response.json();
            })
            .then(setData)
            .catch(error => setError(error.message));
    }, []);

    if (error) {
        return <div>{error}</div>;
    }

    if (!data) {
        return <div>Ładowanie mapy Europy...</div>;
    }

    return (
        <div style={{
            width: "100%",
            flex: 1,
            minHeight: 0,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
        }}>
            <Canvas
                camera={{
                    position: [0, 15, 30],
                    fov: 35,
                    near: 0.1,
                    far: 250,
                }}
                dpr={[1, 2]}
                style={{

                    flex: 1,
                }}
            >
                <Scene
                    data={data}
                    onSelect={setSelected}
                />
            </Canvas>

            {selected && (
                <div style={{
                    position: "absolute",
                    right: 20,
                    top: 20,
                    width: 230,
                    padding: 18,
                    borderRadius: 12,
                    background: "rgba(5, 20, 40, 0.95)",
                    border: `1px solid ${selected.color}`,
                    color: "white",
                }}>
                    <button
                        onClick={() => setSelected(null)}
                        style={{
                            float: "right",
                            background: "transparent",
                            color: "white",
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

            <div style={{
                position: "absolute",
                left: 18,
                bottom: 18,
                color: "#94A3B8",
                fontSize: 12,
                pointerEvents: "none",
            }}>
                Przeciągnij, aby obrócić · Scroll, aby przybliżyć
            </div>
        </div>
    );
}
