# Dice Box 1.1.4

Vendored distribution from https://unpkg.com/@3d-dice/dice-box@1.1.4/dist/.
Upstream license is included in LICENSE. Models and Ammo assets remain pinned
to the same upstream version in app.js.

Local patches (keep when upgrading upstream):

- `world.onscreen.js`: real matte gray-green floor, dark low rails, fine grain
  and edge ticks. All tray meshes are non-pickable. Floor top is y=.5;
  rail inner faces are x=+/-(9.5*aspect/2-.5), z=+/-4.25, matching
  the embedded Ammo worker's `be` box construction (half-extents).
- Perspective camera: 38 degree vertical FOV, 25 degrees off vertical;
  corner-based fitting reserves 8% on each frame edge. `setView` also supports
  top view without changing bodies, results, or statistics.
- Softer lighting/shadows and reduced material highlights.
- Engine-owned DPR (capped at 2.5) and explicit settled-scene redraw.
- `dice-box.es.js`: public `setView`; one resize listener and immediate resize.
  Resize changes camera framing only, preserving the initial physical tray
  dimensions so settled dice cannot be stranded outside newly narrowed walls.
  Ammo parameters and face-result detection remain unchanged.
