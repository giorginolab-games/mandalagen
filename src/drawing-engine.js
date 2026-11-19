import { RANDOM_SYMMETRIES, SYMMETRY_GUIDE } from './constants.js';
import { getSymmetryConfig } from './symmetry-engine.js';
import { buildFixedPalette } from './color-engine.js';

// One history entry per gesture, regardless of how many hexagons it crosses.
export function createDrawingControls({ svgLayer, getBoard, state, onChange, paletteOptions }) {
  const panel = document.createElement('div');
  panel.className = 'tab-panel';
  panel.id = 'drawTabPanel';
  panel.hidden = true;
  panel.innerHTML = `
    <label class="control"><span>Symmetry</span>
      <select id="drawSymmetry">${RANDOM_SYMMETRIES.map(s => `<option value="${s.value}" ${s.value === RANDOM_SYMMETRIES[0].value ? 'selected' : ''}>${s.label}</option>`).join('')}</select>
    </label>
    <section class="draw-help" aria-labelledby="drawHelpHeading">
      <h2 id="drawHelpHeading">Drawing and symmetry help</h2>
      <p>Pick a swatch and click or drag to paint. The white swatch erases.</p>
      <p>Each stroke repeats around the board center. Axes are measured clockwise from horizontal. Cₙ gives n rotations and Dₙ adds n reflections.</p>
      <p>${SYMMETRY_GUIDE}</p>
    </section>
    <div class="buttons draw-actions">
      <button type="button" id="drawUndo">Undo</button>
      <button type="button" id="drawRedo">Redo</button>
      <button type="button" id="drawClear">Clear board</button>
    </div>
    <label class="control"><span>Palette</span>
      <select id="drawPaletteSelect">${paletteOptions}</select>
    </label>
    <div class="buttons" id="drawColors" role="group" aria-label="Drawing colors"></div>`;
  const symmetrySelect = panel.querySelector('#drawSymmetry');
  symmetrySelect.addEventListener('change', () => {
    finishStroke();
    state.set({ symmetry: symmetrySelect.value });
  });
  let color = '#ffffff';
  let strokeBoard = null;
  let pointerId = null;
  let lastPoint = null;
  let strokeSymmetry = null;
  const undoButton = panel.querySelector('#drawUndo');
  const redoButton = panel.querySelector('#drawRedo');
  function updateButtons() {
    undoButton.disabled = !getBoard()?.canUndo;
    redoButton.disabled = !getBoard()?.canRedo;
  }
  const swatches = panel.querySelector('#drawColors');
  function renderPalette(mode) {
    const palette = buildFixedPalette(mode);
    if (!palette.some(entry => entry.hex === color)) color = '#ffffff';
    swatches.replaceChildren(...palette.map(entry => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', entry.hex === '#ffffff' ? 'Erase (white)' : entry.name);
      button.style.setProperty('--swatch-color', entry.hex);
      button.setAttribute('aria-pressed', String(entry.hex === color));
      button.addEventListener('click', () => {
        finishStroke();
        color = entry.hex;
        for (const swatch of swatches.children) swatch.setAttribute('aria-pressed', String(swatch === button));
      });
      return button;
    }));
  }
  function paintTo(event) {
    const point = { x: event.clientX, y: event.clientY };
    const start = lastPoint || point;
    const steps = Math.max(1, Math.ceil(Math.hypot(point.x - start.x, point.y - start.y) / 2));
    for (let i = 1; i <= steps; i++) {
      const path = document.elementFromPoint(start.x + (point.x - start.x) * i / steps, start.y + (point.y - start.y) * i / steps);
      strokeBoard.paint(path, color, strokeSymmetry);
    }
    lastPoint = point;
  }
  function finishStroke() {
    if (!strokeBoard) return;
    strokeBoard.finishStroke();
    strokeBoard = null;
    onChange();
    lastPoint = null;
    const id = pointerId;
    pointerId = null;
    if (id !== null && svgLayer.hasPointerCapture(id)) svgLayer.releasePointerCapture(id);
    updateButtons();
  }
  svgLayer.addEventListener('pointerdown', event => {
    if (state.value.activeTab !== 'draw' || !getBoard() || event.button !== 0 || strokeBoard) return;
    event.preventDefault();
    strokeBoard = getBoard();
    strokeSymmetry = getSymmetryConfig(state.value.symmetry);
    strokeBoard.beginStroke();
    pointerId = event.pointerId;
    svgLayer.setPointerCapture(pointerId);
    paintTo(event);
  });
  svgLayer.addEventListener('pointermove', event => {
    if (!strokeBoard || event.pointerId !== pointerId) return;
    for (const sample of event.getCoalescedEvents?.() || [event]) paintTo(sample);
    paintTo(event);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    svgLayer.addEventListener(type, event => {
      if (event.pointerId === pointerId) finishStroke();
    });
  }
  for (const [button, action] of [[undoButton, 'undo'], [redoButton, 'redo'], [panel.querySelector('#drawClear'), 'clear']]) {
    button.addEventListener('click', () => {
      finishStroke();
      getBoard()?.[action]();
      updateButtons();
      onChange();
    });
  }
  state.subscribe((value, previous) => {
    if (value.symmetry !== previous.symmetry || value.activeTab !== previous.activeTab || value.palette !== previous.palette) finishStroke();
    if (!swatches.childElementCount || value.palette !== previous.palette) renderPalette(value.palette);
    symmetrySelect.value = value.symmetry;
  });
  updateButtons();
  return { panel, finishStroke, updateButtons, clearHistory() {
    finishStroke();
    getBoard()?.clearHistory();
    updateButtons();
  } };
}
