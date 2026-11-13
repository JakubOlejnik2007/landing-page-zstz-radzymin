import type { Marker } from "../types/map";
import type { ErasmusProject } from "../types/project";

export async function loadErasmusProjects(): Promise<ErasmusProject[]> {
    const response = await fetch("/data/erasmus-projects.json");

    if (!response.ok) {
        throw new Error("Nie udało się pobrać projektów Erasmus+");
    }

    const data = await response.json();

    return data.projects;
}

export async function loadErasmusMarkers(
    language = "pl"
): Promise<Marker[]> {
    const projects = await loadErasmusProjects();

    return projects.flatMap(project => {
        const translation = project.article.find(
            item => item.language === language
        ) ?? project.article[0];

        return project.locations.map(location => ({
            ...location,
            description: [
                project.title,
                translation?.content || project.participants
            ].filter(Boolean).join(" — ")
        }));
    });
}