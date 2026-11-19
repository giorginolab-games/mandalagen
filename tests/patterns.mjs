import { motifRegion, createMotifParameters } from '../motifs.js';
import assert from 'node:assert/strict';
import { RANDOM_MOTIFS, MOTIF_SYMMETRIES, LOCAL_TILINGS, RANDOM_SYMMETRIES } from '../constants.js';
import { buildFixedPalette } from '../color-engine.js';
import { getMetricsForNode, resolveRandomFill } from '../pattern-engine.js';
import { buildSymmetryOrbits } from '../symmetry-engine.js';

const palette = buildFixedPalette('purple').filter(c => c.hex !== '#ffffff');
const allowed = new Set(['#ffffff', ...palette.map(c => c.hex)]);
const samples = [0.8, 2.5, 3.2, 1.7].map(p => p / (2 * Math.PI));
let sampleIndex = 0;
const parameters = createMotifParameters(() => samples[sampleIndex++], 6);
const signatures = new Set();
for (const motif of Object.keys(MOTIF_SYMMETRIES)) {
  const colors = [];
  for (let i = 0; i < 30; i++) for (let j = 0; j < 24; j++) {
    const metrics = { radial: i / 30, theta: j / 24 * Math.PI / 6 };
    const region = motifRegion(motif, metrics, parameters);
    assert(Number.isFinite(region.band) && Number.isFinite(region.edge), motif);
    const fill = resolveRandomFill(metrics, motif, parameters, palette, 4);
    assert(allowed.has(fill), motif);
    assert.equal(fill, resolveRandomFill(metrics, motif, parameters, palette, 4));
    colors.push(fill);
    // Zero white accents must not introduce outlines in solid geometric families.
    if (['rings', 'flower', 'star', 'diamonds', 'mosaic'].includes(motif)) {
      assert.notEqual(resolveRandomFill(metrics, motif, parameters, palette, 0), '#ffffff');
    }
  }
  assert(new Set(colors).size >= 3, `${motif} lacks color structure`);
  signatures.add(colors.join(','));
}
assert.equal(signatures.size, Object.keys(MOTIF_SYMMETRIES).length, 'Motif families must differ');
const paths = [];
for (let q = -5; q <= 5; q++) for (let r = -5; r <= 5; r++) {
  if (Math.abs(q + r) > 5) continue;
  const x = q + r / 2, y = r * Math.sqrt(3) / 2;
  paths.push({ path: {}, x, y });
}
for (const symmetry of RANDOM_SYMMETRIES) {
  const orbits = buildSymmetryOrbits(paths, symmetry);
  for (const [path, orbit] of orbits) {
    assert(orbit.includes(path));
    for (const partner of orbit) assert.deepEqual(new Set(orbits.get(partner)), new Set(orbit), symmetry.label);
  }
  const metrics = getMetricsForNode({ x: 1, y: 2 }, { x: 0, y: 0 }, 5, symmetry);
  assert(Number.isFinite(metrics.theta));
}
console.log('PASS: distinct deterministic motif families, palette bounds, white-accent control, and all symmetry orbits');

import { generatePattern } from '../pattern-engine.js';
import { paths as templatePaths, measureNodes } from './helpers/template.mjs';
import { getColorableHexPaths } from '../svg-engine.js';
import { getBoardGeometry } from '../symmetry-engine.js';

const nodes = measureNodes(getColorableHexPaths({ querySelectorAll: () => templatePaths }));
for (const palette of ['purple', 'blue']) {

  const fills = new Map();
  const board = { nodes, ...getBoardGeometry(nodes), getOrbits: symmetry => buildSymmetryOrbits(nodes, symmetry),
    clearHistory() {}, setColor: (path, fill) => fills.set(path, fill) };
  for (const motif of RANDOM_MOTIFS) for (const contrast of LOCAL_TILINGS[motif] ? Array.from({ length: 24 }, (_, i) => i + 1) : [2, 9]) {
    generatePattern(board, { seed: 'balance', motif,
      contrast, tileSize: contrast, whiteness: 5, palette });
    const counts = new Map();
    for (const fill of fills.values()) {
      counts.set(fill, (counts.get(fill) || 0) + 1);
    }
    assert.deepEqual(new Set(counts.keys()), new Set(buildFixedPalette(palette).map(c => c.hex)));
    const target = [...counts.values()].reduce((a, b) => a + b) / counts.size;
    for (const count of counts.values()) assert(Math.abs(count - target) <= target * 0.3);
  }
}

// Coincident samples isolate the coloring within a single geometric tile.
for (const family of ['honeycomb', 'triangles']) {
  const nodes = Array.from({ length: 18 }, () => ({ x: 0, y: 0, path: {} }));
  const render = motif => {
    const fills = new Map();
    generatePattern({ nodes, center: { x: 0, y: 0 }, maxRadius: 1,
      clearHistory() {}, setColor: (path, fill) => fills.set(path, fill) },
    { seed: 'interior', motif, contrast: 5, whiteness: 0, palette: 'purple' });
    return nodes.map(node => fills.get(node.path));
  };
  assert.equal(new Set(render(family)).size, 1);
  const textured = render(`randomized ${family}`);
  assert(new Set(textured).size > 1);
  assert.deepEqual(textured, render(`randomized ${family}`));
}
