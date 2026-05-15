# ascii-3d

Research notebook for the pure-DOM ASCII 3D renderer that ships as
`website/src/components/RadiantHero.astro` on the home page.

Each `*.html` file is one self-contained iteration in the design exploration.
Open any file directly in a browser — no build, no dependencies. They are
standalone snapshots of decisions made along the way, kept here so the
trajectory can be inspected later. They are **not** deployed.

## Trajectory

The exploration traverses three axes:

1. **What is the visual** (Foundation Prime Radiant → DOM character substrate
   with rotating icosahedron crystallising from its glyphs)
2. **How is it rendered** (CSS bokeh → glyph constellations → Braille
   character grid → DOM/CSS-only sprite-strip with pre-baked rotation
   frames and zero JS per-frame animation)
3. **How responsive is it** (no resize handling → display:none during resize
   → freeze in place; font-size locked to JS-set px to avoid reshape;
   chunked async bake; drag-to-rotate interactivity)

## Highlights

- **`a.html` – `b.html`**: cursor lens + bokeh / constellation directions.
  Discarded — terminal aesthetic instead of Foundation.
- **`c.html` – `m.html`**: building the rotating icosahedron with depth-sorted
  metallic wires. Iterations on stroke colour, thickness, atmosphere.
- **`n.html`**: per-cell DOM grid with multi-civilizational symbols + radiant
  rasterised on the same grid. Conceptually beautiful, 240 MB / 110 fps.
- **`o.html` – `p.html`**: collapse 3000 spans to two `<pre>` elements via
  CSS `content: var(...)`. 190 MB / 60 fps capped.
- **`r.html` – `s.html`**: pre-bake 60 rotation frames into one tall `<pre>`,
  step through with CSS `transform: translateY` + `steps(60)`. Zero JS
  animation, 270 MB GPU layer texture.
- **`x.html`**: fix the line-height-drift bug ("climb then jump") by
  measuring the rendered substrate as the source of truth.
- **`ag.html`**: kill resize freeze by replacing `font-size: clamp(...vw...)`
  with a JS-set px variable.
- **`ah.html`**: freeze in place during resize, no more disappear/reappear.
- **`ai.html` – `aj.html`**: pointer-driven drag rotation with live single-
  frame rasterisation. Rebake at new resting angle on release.

The shipping component (`RadiantHero.astro`) is `aj.html` cleaned up into a
single scoped Astro component.

## Why DOM and not canvas

Every off-the-shelf ASCII renderer (Three.js `AsciiEffect`, Codrops Efecto,
ascii3d, Drei `AsciiRenderer`, …) routes pixels through a canvas first and
then samples brightness into characters. This renderer projects vertices
directly to a character buffer and writes that buffer to a `<pre>` element.
Substrate text lives in CSS `content` variables, not in the DOM, so search
engines and scrapers see empty `<pre>` tags. The substrate's own characters
light up at the radiant positions — the lens emerges from the symbols of
history, not from a separate overlay layer.
