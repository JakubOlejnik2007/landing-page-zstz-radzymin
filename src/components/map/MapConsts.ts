/* ------------------------------------------------------------------ */
/*  KOLORY I CIENIOWANIE – wszystko w jednym miejscu                   */
/* ------------------------------------------------------------------ */

import { CanvasTexture, CylinderGeometry, PlaneGeometry, SphereGeometry } from "three";
import type { Marker } from "../../types/map";
import { getMarkerPosition } from "./GeometryHelpers";

export const COLORS = {
    // scena – morze: jasna, turkusowa woda wokół mapy, ciemniejsza i głębsza ku brzegom
    // (gradient jest tłem CSS za przezroczystym canvasem)
    background:
        "radial-gradient(ellipse 75% 70% at 50% 46%, #C9F0F7 0%, #8FD3E8 32%, #4FA6D1 66%, #2B76AE 100%)",

    // paleta krajów (kolor kraju = countryPalette[index % długość])
    countryPalette: [
        "rgb(189, 229, 177)",
        "rgb(204, 224, 170)",
        "rgb(230, 213, 173)",
        "rgb(220, 236, 189)",
    ],

    // światła
    ambientLight: "#FFF4E0",
    mainLight: "#FFE9C7", // ciepłe słońce
    fillLight: "#6FB7E8", // chłodne światło odbite od wody
    hemiSky: "#E6F6FF",
    hemiGround: "#7FA37A",

    // łuki połączeń – czerwień
    arc: "#D9383A",

    // etykiety przy markerach
    labelBackground: "rgba(5, 20, 40, 0.92)",
    labelText: "white",

    // panel szczegółów
    panelBackground: "rgba(5, 20, 40, 0.95)",
    panelText: "white",
    panelClose: "white",

    // podpowiedź na dole
    hint: "#E8F6FC", // jasny tekst czytelny na ciemniejszej wodzie
} as const;

export const SHADING = {
    // o ile (0..1) zmniejszyć jasność HSL boków/bevela względem koloru kraju
    sideLightnessDrop: 0.25,
    // mnożnik nasycenia boków (1 = bez zmian, 0 = szarość) – daje oliwkowy ton
    sideSaturationScale: 0.4,
    // przesunięcie odcienia boków (0..1 = pełny obrót koła barw; ujemne = w stronę żółci)
    sideHueShift: -0.03,
    // przesunięcie jasności górnej ścianki (0 = dokładnie kolor kraju)
    topLightnessShift: 0,
} as const;

export const CAMERA = {
    fov: 25,
    position: [0, 21, 42.6] as [number, number, number],
    minDistance: 23,
    maxDistance: 60,
} as const;

/* ------------------------------------------------------------------ */
/*  STAŁE MAPY                                                         */
/* ------------------------------------------------------------------ */

export const MIN_LON = -25;
export const MAX_LON = 45;
export const MIN_LAT = 34;
export const MAX_LAT = 72;

export const MAP_SCALE_X = 0.52;
export const MAP_SCALE_Y = 0.82;

export const MARKER_HEIGHT = 1.15;
export const ARC_HEIGHT = 6;
export const ARC_SEGMENTS = 24;

export const HOME_MARKER: Marker = {
    name: "Radzymin",
    country: "Polska",
    coordinates: [21.184, 52.416],
    description: "Siedziba szkoły",
    color: "#F2B84B",
    primary: true,
};

/* ------------------------------------------------------------------ */
/*  GEOMETRIA MARKERÓW                                                  */
/* ------------------------------------------------------------------ */

export const homePosition = getMarkerPosition(
    HOME_MARKER.coordinates[0],
    HOME_MARKER.coordinates[1]
);

// współdzielone geometrie markerów
export const SPHERE_GEOMETRY = new SphereGeometry(0.32, 20, 20);
export const STEM_GEOMETRY = new CylinderGeometry(0.025, 0.025, 0.7, 6);
// miękki cień pod pinem (płaski dysk na powierzchni mapy)
export const SHADOW_GEOMETRY = new PlaneGeometry(0.9, 0.9);
// wysokość górnej ścianki mapy względem środka pinu (depth 0.25 + bevel 0.045)
export const SHADOW_Y = 0.295 - MARKER_HEIGHT + 0.012;

// radialna maska cienia (alphaMap czyta kanał zielony): biały środek -> czarny brzeg = pełna -> zerowa krycie
export const SHADOW_ALPHA_MAP = (() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.35, "#8c8c8c");
    g.addColorStop(0.7, "#2a2a2a");
    g.addColorStop(1, "#000000");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
})();