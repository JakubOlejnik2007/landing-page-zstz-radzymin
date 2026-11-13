import type { Marker } from "./map";

type ProjectAudience = "students" | "teachers";

type ProjectTranslation = {
    language: string;
    content: string;
};

export type ErasmusProject = {
    id: string;
    year: number;
    program: string;
    title: string;

    number: string;
    amount: number | null;
    currency: "PLN" | "EUR" | null;

    audience: ProjectAudience;
    participants: string;

    locations: Marker[];

    article: ProjectTranslation[];
    assets: string[];

    hue: string;
};