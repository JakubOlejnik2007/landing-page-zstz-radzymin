import { useEffect, useMemo, useState } from "react";
import { Canvas, } from "@react-three/fiber";
// W starszych wersjach three (< 0.151) funkcja nazywa się mergeBufferGeometries
import type { FeatureCollection, MapMarker, ProjectMapMarker } from "../../types/map";
import type { ErasmusProject } from "../../types/project";
import Scene from "./Scene";
import { COLORS, CAMERA } from "./MapConsts";


export default function EuropeMap3D() {
    const [data, setData] = useState<FeatureCollection | null>(null);
    const [selected, setSelected] = useState<MapMarker | null>(null);
    const [projects, setProjects] = useState<ErasmusProject[] | null>(null);
    const [selectedProject, setSelectedProject] = useState<ErasmusProject | null>(null);
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

    const handleSelect = (marker: MapMarker) => {
        setSelected(marker);
        setSelectedProject(null);
    };

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
                <Scene data={data} markers={markers} onSelect={handleSelect} />
            </Canvas>


            {selected && (
                <div
                    style={{
                        position: "absolute",
                        right: 20,
                        top: 20,
                        width: 280,
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
                        onClick={() => {
                            if (selectedProject) {
                                setSelectedProject(null);
                            } else {
                                setSelected(null);
                            }
                        }}
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

                    {selectedProject ? (
                        <>
                            <button
                                onClick={() => setSelectedProject(null)}
                                style={{
                                    background: "transparent",
                                    color: COLORS.panelText,
                                    border: 0,
                                    cursor: "pointer",
                                    padding: 0,
                                }}
                            >
                                ← Wróć do miasta
                            </button>

                            <h3>{selectedProject.title}</h3>
                            <p>{selected.name}, {selected.country}</p>
                            <p>{selectedProject.year} · {selectedProject.program}</p>
                            <p>{selectedProject.number}</p>

                            {selectedProject.amount !== null && (
                                <p>
                                    Dofinansowanie: {new Intl.NumberFormat("pl-PL").format(selectedProject.amount)} {selectedProject.currency}
                                </p>
                            )}

                            <p>{selectedProject.participants}</p>
                            <p>
                                {selectedProject.audience === "teachers"
                                    ? "Projekt dla nauczycieli"
                                    : "Projekt z udziałem uczniów"}
                            </p>

                            {(selectedProject.article.find(item => item.language === "pl")?.content ?? "")
                                .split("{?}")
                                .map((part, index) => (
                                    <span key={index}>
                                        {part && <p>{part}</p>}
                                        {index < selectedProject.assets.length && (
                                            <img
                                                src={selectedProject.assets[index]}
                                                alt=""
                                                style={{
                                                    width: "100%",
                                                    borderRadius: 8,
                                                    margin: "8px 0",
                                                }}
                                            />
                                        )}
                                    </span>
                                ))}
                        </>
                    ) : (
                        <>
                            <h3>{selected.name}</h3>
                            <p>{selected.country}</p>

                            {selected.projects && selected.projects.length > 0 ? (
                                <>
                                    <p>{selected.projects.length} projektów</p>

                                    {selected.projects.map(project => (
                                        <button
                                            key={project.id}
                                            onClick={() => setSelectedProject(project)}
                                            style={{
                                                display: "block",
                                                width: "100%",
                                                textAlign: "left",
                                                padding: 10,
                                                marginBottom: 8,
                                                borderRadius: 8,
                                                border: `1px solid ${project.hue}`,
                                                background: "transparent",
                                                color: COLORS.panelText,
                                                cursor: "pointer",
                                            }}
                                        >
                                            <strong>{project.title}</strong>
                                            <br />
                                            <small>{project.year} · {project.program}</small>
                                        </button>
                                    ))}
                                </>
                            ) : (
                                <p>{selected.description}</p>
                            )}
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