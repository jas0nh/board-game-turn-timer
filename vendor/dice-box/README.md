# Dice Box 1.1.4

Vendored distribution from https://unpkg.com/@3d-dice/dice-box@1.1.4/dist/.
Upstream license is included in LICENSE. Models and Ammo assets remain pinned
to the same upstream version in app.js.

Local change: world.onscreen.js, function Ei, positions the camera at
(0, 36.5, -21), looking at the table origin, with near/far planes 1/100.
This is approximately 30 degrees away from the vertical view. Physics and
face-result detection are unchanged. Keep this patch when upgrading upstream.
