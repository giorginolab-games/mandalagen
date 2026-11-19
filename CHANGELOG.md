# Changelog

Mandala Color Generator uses semantic versioning, starting at 0.1.0.

## [0.2.1]

### Changed

- Moved browser JavaScript modules into `src/`.

## [0.2.0]

### Added

- Added three-armed pinwheels and repeating honeycomb and equilateral-triangle motifs. Both tilings have randomized-interior variants and 24 tile sizes anchored at the board center.

### Changed

- Radial motifs now select their own board-centered symmetry, and drawing has a separate symmetry selector with fewer equivalent axis choices.
- Generated patterns balance all six palette colors, including white.

## [0.1.0]

First versioned baseline, covering the Git history through `7db46a8`.

### Added

- Map uploaded, pasted, or dropped images onto the hexagonal pegboard using fixed palettes, alignment controls, and a live overlay. Choose no dithering, ordered dithering, or Floyd–Steinberg error diffusion.
- Generate repeatable geometric patterns from seeds, with symmetry, contrast, and white-accent controls.
- Paint and erase by mouse, pen, or touch with rotational or reflection symmetry. Undo and redo entire strokes, including all repeated cells, and undo a board clear.
- Keep the current design when switching between image mapping, pattern generation, and drawing.
- Print pegboard templates or save them as PDFs.

### Changed

- Split the app into browser ES modules and introduced a shared board model for geometry, color counts, and stroke history.

### Fixed

- Excluded decorative SVG elements from the editable peg cells so drawing symmetry uses the correct board center.
