import { memo } from "react";
import { Line } from "@react-three/drei";
import type { ProjectMapMarker } from "../../types/map";
import { homePosition, ARC_HEIGHT, COLORS } from "./MapConsts";
import { createArc, getMarkerPosition } from "./GeometryHelpers";

const ConnectionArcs = memo(function ConnectionArcs({
    markers,
}: {
    markers: ProjectMapMarker[];
}) {
    return (
        <>
            {markers.map(marker => (
                <Line
                    key={`${marker.project.id}-${marker.name}`}
                    points={createArc(
                        homePosition,
                        getMarkerPosition(marker.coordinates[0], marker.coordinates[1]),
                        ARC_HEIGHT
                    )}
                    color={COLORS.arc}
                    lineWidth={3}
                    transparent
                    opacity={0.9}
                />
            ))}
        </>
    );
});

export default ConnectionArcs;