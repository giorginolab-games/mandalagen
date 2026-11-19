import { getSymmetryConfig, getSymmetryCoordinates } from './symmetry-engine.js';
import { motifRegion, createMotifParameters } from './motifs.js';
import { RANDOM_MOTIFS, MOTIF_SYMMETRIES, LOCAL_TILINGS } from './constants.js';
import { hashString, mulberry32, mod, clamp01 } from './utils.js';
import { buildFixedPalette } from './color-engine.js';

export function getMetricsForNode(node, center, maxRadius, symmetry) {
  const dx = node.x - center.x, dy = node.y - center.y;
  const radial = clamp01(Math.hypot(dx, dy) / maxRadius);
  const coords = getSymmetryCoordinates(Math.atan2(dy, dx), symmetry);
  return { radial, theta: coords.angleNorm * 2 * Math.PI / symmetry.order };
}

export function resolveRandomFill(metrics, motifKind, parameters, colorPalette, whiteness) {
  if (!colorPalette.length) return '#ffffff';
  const region = motifRegion(motifKind, metrics, parameters);
  const outlineWidth = whiteness * 0.014;
  if (region.blank || (whiteness > 0 && region.edge < outlineWidth && metrics.radial > 0.1)) return '#ffffff';
  const count = Math.min(colorPalette.length, parameters.colorCount);
  const offset = Math.floor(parameters.paletteVariation * colorPalette.length);
  const index = mod(region.band, count);
  return colorPalette[(offset + index) % colorPalette.length].hex;
}

export function resolveMotif(motif, seed) {
  if (MOTIF_SYMMETRIES[motif] || LOCAL_TILINGS[motif]) return motif;
  const rng = mulberry32(hashString(String(seed))());
  return RANDOM_MOTIFS[1 + Math.floor(rng() * (RANDOM_MOTIFS.length - 1))];
}

// Both tilings use a triangular lattice. Its Voronoi cells are hexagons;
// splitting each lattice rhombus along its short diagonal gives two triangles.
function localTileGroups(board, family, size, rng, colors, randomized) {
  const spacing = board.maxRadius * (family === 'triangles' ? 0.14 : 0.09) * (1 + size / 8);
  const colorOffset = Math.floor(rng() * colors.length);
  const tiles = new Map();
  for (const { x, y, path } of board.nodes) {
    const v = (y - board.center.y) * 2 / (Math.sqrt(3) * spacing);
    const u = (x - board.center.x) / spacing - v / 2;
    let q, r, half = 0;
    if (family === 'triangles') {
      q = Math.floor(u);
      r = Math.floor(v);
      half = Number(u - q + v - r >= 1);
    } else {
      q = Math.round(u);
      r = Math.round(v);
      const t = Math.round(-u - v);
      const dq = Math.abs(q - u), dr = Math.abs(r - v), dt = Math.abs(t + u + v);
      if (dq > dr && dq > dt) q = -r - t;
      else if (dr > dt) r = -q - t;
    }
    const key = `${q},${r},${half}`;
    if (!tiles.has(key)) {
      const band = mod(colorOffset + q + 2 * r + 3 * half, colors.length);
      tiles.set(key, { fill: colors[band], paths: [], radius: Math.hypot(q, r) });
    }
    tiles.get(key).paths.push(path);
  }
  if (!randomized) return [...tiles.values()];

  // A common ground color keeps the tile legible. Shuffle its cells so
  // the contrasting flecks occupy different positions in each tile.
  const groups = [];
  for (const tile of tiles.values()) {
    const paths = tile.paths;
    const accents = Math.min(paths.length - 1, Math.ceil(paths.length / 3));
    const base = colors.indexOf(tile.fill);
    for (let i = 0; i < accents; i++) {
      const j = i + Math.floor(rng() * (paths.length - i));
      [paths[i], paths[j]] = [paths[j], paths[i]];
      const accent = (base + 1 + Math.floor(rng() * (colors.length - 1))) % colors.length;
      groups.push({ fill: colors[accent], paths: [paths[i]], radius: tile.radius });
    }
    groups.push({ ...tile, paths: paths.slice(accents) });
  }
  return groups;
}

export function generatePattern(board, settings) {
  const { seed, motif, palette, contrast, whiteness } = settings;
  const motifKind = resolveMotif(motif, seed);
  const local = LOCAL_TILINGS[motifKind];
  const tileFamily = motifKind.replace(/^randomized /, '');
  const variant = local ? `${seed}|${tileFamily}` : `${seed}|${motifKind}|${palette}|${contrast}|${whiteness}`;
  const rng = mulberry32(hashString(variant)());
  const colorPalette = buildFixedPalette(palette);
  const colors = colorPalette.map(entry => entry.hex);
  const groups = local
    ? localTileGroups(board, tileFamily, settings.tileSize ?? contrast, rng, colors, tileFamily !== motifKind)
    : radialGroups(board, motifKind, contrast, whiteness, rng, colorPalette);
  balanceColors(groups, colors);
  board.clearHistory();
  for (const { paths, fill } of groups) {
    for (const path of paths) board.setColor(path, fill);
  }
  return motifKind;
}

function radialGroups(board, motifKind, contrast, whiteness, rng, colorPalette) {
  const symmetry = getSymmetryConfig(MOTIF_SYMMETRIES[motifKind]);
  const parameters = createMotifParameters(rng, contrast);
  // Subdivide each mosaic sector into three tiles with distinct colors.
  parameters.repeats = motifKind === 'mosaic' ? 3 * symmetry.order : symmetry.order;
  parameters.colorCount = colorPalette.length;
  const orbits = board.getOrbits(symmetry);
  const painted = new Set();
  const groups = [];
  for (const node of board.nodes) {
    if (painted.has(node.path)) continue;
    const metrics = getMetricsForNode(node, board.center, board.maxRadius, symmetry);
    const fill = resolveRandomFill(metrics, motifKind, parameters, colorPalette, whiteness);
    const paths = orbits.get(node.path);
    groups.push({ paths, fill, radius: metrics.radial });
    for (const path of paths) painted.add(path);
  }
  return groups;
}

// Count every cell, including white, while keeping symmetry orbits intact.
function balanceColors(groups, colors) {

  const counts = new Map(colors.map(color => [color, 0]));
  for (const { fill, paths } of groups) counts.set(fill, counts.get(fill) + paths.length);
  const target = groups.reduce((sum, group) => sum + group.paths.length, 0) / colors.length;
  if ([...counts.values()].every(count => Math.abs(count - target) <= 0.3 * target)) return;

  // Keep neighboring radial bands together when shifting a color boundary.
  groups.sort((a, b) => colors.indexOf(a.fill) - colors.indexOf(b.fill) || a.radius - b.radius);
  let assigned = 0;
  for (const group of groups) {
    const midpoint = assigned + group.paths.length / 2;
    group.fill = colors[Math.min(colors.length - 1, Math.floor(midpoint / target))];
    assigned += group.paths.length;
  }
}
