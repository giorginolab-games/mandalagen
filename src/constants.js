export const MOTIF_SYMMETRIES = {
  flower: 'c6-mirror-vertex', star: 'c3-vertex', pinwheel: 'c3',
  ribbons: 'c2', diamonds: 'd2-0', petals: 'c3-side', mosaic: 'c6', rings: 'c6-mirror-vertex',
};
export const LOCAL_TILINGS = {
  honeycomb: 'Regular hexagons · sixfold tile centers',
  triangles: 'Equilateral triangles · threefold tile centers',
  'randomized honeycomb': 'Regular hexagons · randomized interiors',
  'randomized triangles': 'Equilateral triangles · randomized interiors',
};
export const RANDOM_MOTIFS = ['auto', ...Object.keys(MOTIF_SYMMETRIES), ...Object.keys(LOCAL_TILINGS)];
export const RANDOM_MOTIF_DESCRIPTIONS = {
  honeycomb: "Three hexagons meet at each vertex. Follow a row to see the colors repeat.",
  triangles: "Six triangles meet at each vertex. Each upward triangle shares its edges with three downward triangles.",
  'randomized honeycomb': "Each hexagon has a base color flecked with randomly placed accent cells. Compare with honeycomb at the same seed and tile size.",
  'randomized triangles': "Each triangle has a base color flecked with randomly placed accent cells. Compare with triangles at the same seed and tile size.",
  auto: "Picks one motif family from the seed.",
  pinwheel: "Three spiral arms turn in the same direction. A reflection reverses their handedness.",
  flower: "Scalloped rosette: nested flower contours around a colored center.",
  star: "Nested pointed stars with alternating tips and valleys.",
  ribbons: "Crossing diagonal bands with alternating over-and-under intersections.",
  diamonds: "Repeating rhombus tiles separated by fine white outlines.",
  petals: "Staggered crowns of pointed petals with open space between them.",
  mosaic: "Concentric courses of staggered colored tiles.",
  rings: "Concentric color bands with optional white separators.",
};
// Planar group notation: D_n has n rotations and n reflections (2n operations).
export const RANDOM_SYMMETRIES = [
  { value: "c6-mirror-vertex", label: "D₆ — hexagonal dihedral (6 mirrors)", order: 6, offset: 0, mirror: true },
  { value: "c6", label: "C₆ — sixfold rotational (60°)", order: 6, offset: 0, mirror: false },
  { value: "c3-vertex", label: "D₃ — triangular dihedral (axes 0°, 60°, 120°)", order: 3, offset: 0, mirror: true },
  { value: "c3-side", label: "D₃ — triangular dihedral (axes 30°, 90°, 150°)", order: 3, offset: Math.PI / 6, mirror: true },
  { value: "c3", label: "C₃ — threefold rotational (120°)", order: 3, offset: 0, mirror: false },
  { value: "d2-0", label: "D₂ — two perpendicular mirrors (0° and 90°)", order: 2, offset: 0, mirror: true },
  { value: "c2", label: "C₂ — twofold rotational (180°)", order: 2, offset: 0, mirror: false },
  ...[0, 30].map(degrees => ({ value: `mirror-${degrees}`, label: `Cₛ — bilateral reflection (axis ${degrees}°)`, order: 1, offset: degrees * Math.PI / 180, mirror: true })),
  { value: "none", label: "C₁ — identity (free drawing)", order: 1, offset: 0, mirror: false },
];
export const SYMMETRY_GUIDE = "Turn the board by 60° and a 0° mirror becomes a 60° mirror. The six mirror lines therefore form two families, represented by 0° and 30°. D₃ uses three mirrors from one family, D₂ uses a perpendicular pair, and D₆ uses all six.";
export const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
export const DITHER_STRENGTH = 48;
export const palettes = {
  purple: [
    { name: "azure blue", hex: "#1496dc" },
    { name: "royal purple", hex: "#6432aa" },
    { name: "white", hex: "#ffffff" },
    { name: "crimson red", hex: "#eb0000" },
    { name: "vermilion orange", hex: "#ff6e32" },
    { name: "golden yellow", hex: "#ffe100" },
  ],
  blue: [
    { name: "azure blue", hex: "#1496dc" },
    { name: "blue", hex: "#0000ff" },
    { name: "white", hex: "#ffffff" },
    { name: "crimson red", hex: "#eb0000" },
    { name: "vermilion orange", hex: "#ff6e32" },
    { name: "golden yellow", hex: "#ffe100" },
  ],
};
export const svgPath = "data/onepage_model.svg";
