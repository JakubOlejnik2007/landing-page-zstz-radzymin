import { memo, useMemo, useEffect } from "react";
import type { FeatureCollection } from "../../types/map";
import { buildCountriesGeometry } from "./GeometryHelpers";

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

export default CountryMap;