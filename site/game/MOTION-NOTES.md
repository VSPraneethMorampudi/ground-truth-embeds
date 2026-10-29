# Map Buddies motion

References reviewed on 27 October 2026. These informed the interaction choices; the implementation
is original and does not import their app code, models, textures, or animation packages.

| Reference | Useful idea | Used here |
| --- | --- | --- |
| [Three.js CSS3D periodic table](https://threejs.org/examples/css3d_periodictable.html) | Ease cards between clear arrangements. | Brief staggered picture-card entrances and continuous camera framing between adventures. Targets stay in stable, readable rows. |
| [Three.js drag controls](https://threejs.org/examples/misc_controls_drag.html) | Give immediate feedback when an object is picked up. | A lifted picture follows the pointer directly; its source dims and matching drop targets light up. The hit test has a 16px margin. |
| [Three.js character skinning and morphing](https://threejs.org/examples/webgl_animation_skinning_morph.html) | Blend base movement with short gestures and separate facial expression. | Bindu blends walking into a stop, eases between pointing and waving, glances toward the pointer and smiles wider after success. Bindu uses an original procedural rig rather than that example's skinned asset. |
| [Bruno Simon's portfolio](https://bruno-simon.com/) | Let actions visibly change a small, explorable world. | Completing a task adds school pins, trees, roads or rivers to the map. The game retains one simple picture task at a time. |
| [Noho interaction case study, Codrops](https://tympanus.net/codrops/2026/10/15/noho-redesign/) | Responsive objects, motion handoffs, and snapping to a finished state for reduced motion. | Small pointer-based card tilt; release-to-box and return-to-source animation; all optional motion respects reduced motion. |

Motion is kept short: approximately 280–400ms for entrances and travel, with a small star burst
after a successful drop. Game progress commits immediately, so animations never lock the next
action. Each flight owns its visual and cleans it up on completion or navigation. A missed drop
returns the picture and offers a retry; it never removes progress.

DOM buttons carry the tasks and remain usable by tap and keyboard. Native Three.js geometry
renders Bindu and the map. Web Animations handles the small UI transitions without a new dependency.
The original technical game and main story keep their existing behavior.
