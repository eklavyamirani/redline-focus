# Redline Focus

Procedurally synthesized engine sounds for focus work: V6, V8 (cross-plane and flat-plane),
and inline-4 superbike engines, with a virtual driver that rev-matches downshifts,
quickshifts, bounces off the limiter, and crackles on overrun. Nothing is a recording or a loop.

## Run

Open `index.html` in a browser (Chrome, Safari, Firefox). No build, no server, no dependencies.

## How the sound works

All synthesis happens in an AudioWorklet, so it keeps playing smoothly in a background tab.

- **Firing order → character.** Each cylinder fires at its real crank angle. A cross-plane V8's
  per-bank uneven firing gives the burble; a flat-plane V8's even per-bank firing screams;
  a crossplane inline-4 (270-180-90-180) growls.
- **Exhaust.** Pulses run through per-cylinder header delays into a pipe waveguide per bank
  (V engines are panned left/right), then muffler resonances and saturation. Higher throttle
  load means sharper pulses and more rasp.
- **Physics.** Engine inertia, gearing, drag, clutch slip and a rev limiter drive the RPM. Shifts are
  clutch upshifts, quickshifter/DCT cuts, or blipped rev-matched downshifts.
- **Extras.** Overrun pops, turbo whistle and blow-off, straight-cut gear whine, intake roar, road and wind noise.

Engines are JSON presets in `index.html` (`<script id="presets">`). Add or tweak them there.

## Test

```sh
node test/render.mjs 40          # render every engine × scene offline, check for NaN/clipping
node test/render.mjs 40 --wav    # also write WAVs to test/out/
```
