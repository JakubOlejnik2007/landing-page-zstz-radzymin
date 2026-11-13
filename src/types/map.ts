import type { ErasmusProject } from "./project";

export type Position = [number, number];

export type Marker = {
    name: string;
    country: string;
    coordinates: Position;
    description: string;
    color: string;
    primary?: boolean;
};

export type Feature = {
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

export type FeatureCollection = {
    features: Feature[];
};


export type ProjectMapMarker = Marker & {
    project: ErasmusProject;
};

export type CityMarker = Marker & {
    projects: ErasmusProject[];
};

export type MapMarker = Marker & {
    projects?: ErasmusProject[];
};