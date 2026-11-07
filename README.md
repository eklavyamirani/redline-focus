# Redline Focus

Procedurally synthesized engine sounds for focus work: a twin-turbo V6, an inline-4 superbike,
a Huracán-style V10 and an AMG C43-style V6 biturbo, with a virtual driver that laps a track
(quickshifts at redline, rev-matched downshifts, limiter bounces, overrun crackle) or idles in the
garage. Nothing is a recording or a loop.

Live at https://github.ekkylab.uk/redline-focus/

## Run

Open `index.html` in a browser (Chrome, Safari, Firefox). No build, no server, no dependencies.

## Record

Press **Record** (or <kbd>R</kbd>) to capture the session; stopping the engine or the session timer
also ends the recording. You get a download link for an `.m4a` (AAC), or `.webm` (Opus) in browsers
without AAC recording. Recordings are taken before the volume slider, so they come out at full level.

## How the sound works

All synthesis happens in an AudioWorklet, so it keeps playing smoothly in a background tab.

- **Firing order → character.** Each cylinder fires at its real crank angle. The V10 fires evenly
  every 72° (144° per bank), which gives its shriek; the V6s fire every 120°.
- **Exhaust.** Pulses run through per-cylinder header delays into a pipe waveguide per bank
  (V engines are panned left/right), then muffler resonances and saturation. Higher throttle
  load means sharper pulses and more rasp.
- **Physics.** Engine inertia, gearing, drag, clutch slip and a rev limiter drive the RPM. Shifts are
  clutch upshifts, quickshifter/DCT cuts, or blipped rev-matched downshifts.
- **Extras.** Overrun pops (per-engine `shiftPop` controls crackle during gear changes), turbo whistle and blow-off, straight-cut gear whine, intake roar, road and wind noise.

Engines are JSON presets in `index.html` (`<script id="presets">`). Add or tweak them there.

## Test

```sh
node test/render.mjs 40          # render every engine × scene offline, check for NaN/clipping
node test/render.mjs 40 --wav    # also write WAVs to test/out/
```
