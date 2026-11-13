import { OrbitControls } from "@react-three/drei";
import { memo } from "react";
import { CAMERA, COLORS } from "./MapConsts";
import type { FeatureCollection, ProjectMapMarker, MapMarker } from "../../types/map";
import ConnectionArcs from "./ConnectionArcs";
import CountryMap from "./CountryMap";
import ProjectMarkers from "./ProjectMarkers";

const Scene = memo(function Scene({
    data,
    markers,
    onSelect,
}: {
    data: FeatureCollection;
    markers: ProjectMapMarker[];
    onSelect: (marker: MapMarker) => void;
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

            <ConnectionArcs markers={markers} />
            <CountryMap data={data} />
            <ProjectMarkers markers={markers} onSelect={onSelect} />

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

export default Scene;