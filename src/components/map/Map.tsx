import { useEffect, useMemo, useState } from "react";
import { Canvas, } from "@react-three/fiber";
// W starszych wersjach three (< 0.151) funkcja nazywa się mergeBufferGeometries
import type { FeatureCollection, MapMarker, ProjectMapMarker } from "../../types/map";
import type { ErasmusProject } from "../../types/project";
import Scene from "./Scene";
import { COLORS, CAMERA } from "./MapConsts";


export default function EuropeMap3D() {
    const [data, setData] = useState<FeatureCollection | null>(null);
    const [projects, setProjects] = useState<ErasmusProject[] | null>(null);
    const [selected, setSelected] = useState<MapMarker | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        Promise.all([
            fetch("/data/europe.geojson", { signal: controller.signal }),
            fetch("/data/erasmus-projects.json", { signal: controller.signal }),
        ])
            .then(async ([geoResponse, projectsResponse]) => {
                if (!geoResponse.ok) {
                    throw new Error("Nie udało się pobrać GeoJSON");
                }

                if (!projectsResponse.ok) {
                    throw new Error("Nie udało się pobrać projektów Erasmus+");
                }

                return Promise.all([
                    geoResponse.json(),
                    projectsResponse.json(),
                ]);
            })
            .then(([geoData, projectData]) => {
                setData(geoData);
                setProjects(projectData.projects);
            })
            .catch(err => {
                if (err.name !== "AbortError") setError(err.message);
            });

        return () => controller.abort();
    }, []);

    const markers = useMemo<ProjectMapMarker[]>(() => {
        if (!projects) return [];

        return projects.flatMap(project =>
            project.locations.map(location => ({
                ...location,
                project,
            }))
        );
    }, [projects]);

    if (error) {
        return <div>{error}</div>;
    }

    if (!data || !projects) {
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
                <Scene data={data} markers={markers} onSelect={setSelected} />
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
                        zIndex: 40,
                        background: COLORS.panelBackground,
                        border: `1px solid ${selected.color}`,
                        color: COLORS.panelText,
                        maxHeight: "calc(100% - 40px)",
                        overflowY: "auto",
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

                    {selected.project ? (
                        <>
                            <h3>{selected.project.title}</h3>
                            <p>{selected.name}, {selected.country}</p>
                            <p>{selected.project.year} · {selected.project.program}</p>
                            <p>{selected.project.number}</p>
                            {selected.project.amount !== null && (
                                <p>
                                    Dofinansowanie: {new Intl.NumberFormat("pl-PL").format(selected.project.amount)} {selected.project.currency}
                                </p>
                            )}
                            <p>{selected.project.participants}</p>
                            <p>{selected.description}</p>
                            <p>{selected.project.audience === "teachers" ? "Projekt dla nauczycieli" : "Projekt z udziałem uczniów"}</p>
                            {selected.project.article.find(item => item.language === "pl")?.content
                                .split("{?}")
                                .map((part, index) => (
                                    <span key={index}>
                                        {part && <p>{part}</p>}
                                        {index < selected.project!.assets.length && (
                                            <img
                                                src={selected.project!.assets[index]}
                                                alt=""
                                                style={{ width: "100%", borderRadius: 8, margin: "8px 0" }}
                                            />
                                        )}
                                    </span>
                                ))}
                        </>
                    ) : (
                        <>
                            <h3>{selected.name}</h3>
                            <p>{selected.country}</p>
                            <p>{selected.description}</p>
                        </>
                    )}
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