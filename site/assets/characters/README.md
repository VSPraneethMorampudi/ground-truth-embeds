# GIS office team

The six independently modelled, skinned humans are adapted from Microsoft
Rocketbox, pinned at commit `0943055db6ec570bcef9f2c8b41c9e5467c808f9`.
Source: https://github.com/microsoft/Microsoft-Rocketbox
The upstream MIT notice is preserved in `LICENSE-rocketbox.txt`.

| Analyst | Source model | Shipped asset |
| --- | --- | --- |
| Aarav | Male_Adult_08 | aarav.glb |
| Meera | Female_Adult_05 | meera.glb |
| Kabir | Male_Adult_10 | kabir.glb |
| Ananya | Female_Adult_07 | ananya.glb |
| Isha | Female_Adult_14 | isha.glb |
| Rohan | Male_Adult_07 | rohan.glb |

These are fictional Indian office characters. Their distinct Indian face maps
are in `faces/`, with the exact built-in Image Gen prompts and provenance.
The meshes have different faces, hair, proportions and textured clothing.
The original cloth and skin normal maps remain in the GLBs. Seven facial
blendshapes support blinking, smiles and brows; the complete finger rig remains.

Rebuild from the repository root with existing Playwright and sharp installs:

1. `node site/tools/fetch-office-humans.cjs`
2. `node site/tools/build-office-humans.cjs`
3. `node site/tools/optimize-humans.cjs --office`
4. `node site/tools/prepare-indian-faces.cjs` (uses saved generated PNGs)

Downloaded sources and build originals stay in `output/`. The website serves
only the six optimized GLBs, six JPEG faces and a small palette manifest.

`pipeline/human-motion.js` solves shoulder/elbow reach, aligns palms, articulates
fingers against real key heights, and couples the right wrist to the mouse.
Key depressions and the GIS screen cursor use the same motion signals.
No external avatar service is required at runtime.
