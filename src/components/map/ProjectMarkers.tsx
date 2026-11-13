import { Html } from "@react-three/drei";
import { memo } from "react";
import { HOME_MARKER, COLORS, SHADOW_ALPHA_MAP, SHADOW_GEOMETRY, SHADOW_Y, SPHERE_GEOMETRY, STEM_GEOMETRY, } from "./MapConsts";
import type { ProjectMapMarker, MapMarker } from "../../types/map";
import { getMarkerPosition } from "./GeometryHelpers";

const ProjectMarkers = memo(function ProjectMarkers({
    markers,
    onSelect,
}: {
    markers: ProjectMapMarker[];
    onSelect: (marker: MapMarker) => void;
}) {
    const displayMarkers: MapMarker[] = [HOME_MARKER, ...markers];

    return (
        <group>
            {displayMarkers.map(marker => {
                const position = getMarkerPosition(
                    marker.coordinates[0],
                    marker.coordinates[1]
                );

                return (
                    <group key={marker.project ? `${marker.project.id}-${marker.name}` : "school"} position={position}>
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
                );
            })}
        </group>
    );
});

export default ProjectMarkers