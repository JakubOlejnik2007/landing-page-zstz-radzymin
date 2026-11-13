import { Html } from "@react-three/drei";
import { memo, useMemo } from "react";
import {
    HOME_MARKER,
    COLORS,
    SHADOW_ALPHA_MAP,
    SHADOW_GEOMETRY,
    SHADOW_Y,
    SPHERE_GEOMETRY,
    STEM_GEOMETRY,
} from "./MapConsts";
import type { MapMarker, CityMarker, ProjectMapMarker } from "../../types/map";
import { getMarkerPosition } from "./GeometryHelpers";

const ProjectMarkers = memo(function ProjectMarkers({
    markers,
    onSelect,
}: {
    markers: ProjectMapMarker[];
    onSelect: (marker: MapMarker) => void;
}) {
    const cityMarkers = useMemo(() => {
        const cities = new Map<string, CityMarker>();

        markers.forEach(marker => {
            const key = `${marker.name.trim().toLowerCase()}-${marker.country.trim().toLowerCase()}`;

            const existing = cities.get(key);

            if (existing) {
                if (!existing.projects.some(project => project.id === marker.project.id)) {
                    existing.projects.push(marker.project);
                }
                return;
            }

            cities.set(key, {
                ...marker,
                projects: [marker.project],
            });
        });

        return Array.from(cities.values());
    }, [markers]);

    const displayMarkers: MapMarker[] = [HOME_MARKER, ...cityMarkers];

    return (
        <group>
            {displayMarkers.map(marker => {
                const position = getMarkerPosition(
                    marker.coordinates[0],
                    marker.coordinates[1]
                );

                return (
                    <group
                        key={`${marker.name}-${marker.country}`}
                        position={position}
                    >
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
                            zIndexRange={[0, 2]}
                            occlude={false}
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
                                {marker.projects && marker.projects.length > 1
                                    ? ` (${marker.projects.length})`
                                    : ""}
                            </div>
                        </Html>
                    </group>
                );
            })}
        </group>
    );
});

export default ProjectMarkers;