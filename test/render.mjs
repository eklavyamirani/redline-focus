// Offline render of the AudioWorklet engine in Node: sanity checks + WAV output.
// Usage: node test/render.mjs [seconds] [--wav]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const grab = id => html.match(new RegExp(`<script id="${id}"[^>]*>([\\s\\S]*?)</script>`))[1];
const PRESETS = JSON.parse(grab('presets'));
const src = grab('worklet-src');

const SR = 48000;
let Proc;
class AudioWorkletProcessor { constructor() { this.port = { postMessage: m => (this.last = m), onmessage: null }; } }
new Function('AudioWorkletProcessor', 'registerProcessor', 'sampleRate', src)(
  AudioWorkletProcessor, (_, c) => (Proc = c), SR);

const secs = +process.argv[2] || 40;
const wav = process.argv.includes('--wav');
const scenes = ['idle', 'track'];

function writeWav(path, L, R) {
  const n = L.length, buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4);
  }
  writeFileSync(path, buf);
}

let failures = 0;
if (wav) mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
console.log('engine      scene    rms(dB) peak  rpm[min-max]   maxGear maxKmh shifts  cpu(x realtime)  longest@redline(s)');
for (const [id, P] of Object.entries(PRESETS)) {
  for (const scene of scenes) {
    const p = new Proc();
    const send = data => p.port.onmessage({ data });
    send({ type: 'preset', preset: P });
    send({ type: 'scene', scene });
    send({ type: 'params', crackle: 0.25, road: 0.2 });
    send({ type: 'start' });
    const blocks = Math.floor(secs * SR / 128), L = new Float32Array(blocks * 128), R = new Float32Array(blocks * 128);
    let sum = 0, peak = 0, rmin = 1e9, rmax = 0, gmax = 0, vmax = 0, bad = false, run = 0, longest = 0;
    const evs = new Set();
    const t0 = performance.now();
    for (let b = 0; b < blocks; b++) {
      const l = L.subarray(b * 128, b * 128 + 128), r = R.subarray(b * 128, b * 128 + 128);
      p.process([], [[l, r]]);
      if (b * 128 > SR * 1.5) { rmin = Math.min(rmin, p.rpm); rmax = Math.max(rmax, p.rpm); }
      gmax = Math.max(gmax, p.gear); vmax = Math.max(vmax, p.v * 3.6);
      run = p.rpm > P.redline ? run + 128 / SR : 0; longest = Math.max(longest, run);
      if (p.ev) evs.add(p.evId);
    }
    const cpu = (secs * 1000) / (performance.now() - t0);
    for (let i = 0; i < L.length; i++) {
      const x = L[i], y = R[i];
      if (!Number.isFinite(x) || !Number.isFinite(y)) { bad = true; break; }
      sum += x * x + y * y; peak = Math.max(peak, Math.abs(x), Math.abs(y));
    }
    const rms = 10 * Math.log10(sum / (2 * L.length) + 1e-12);
    // The driver should never sit on the limiter: brief bounces only.
    const stuck = longest > 2;
    const flag = bad ? '  NaN!' : peak > 1.5 ? '  HOT' : stuck ? '  STUCK AT LIMITER' : '';
    if (bad || stuck) failures++;
    console.log(`${id.padEnd(11)} ${scene.padEnd(8)} ${rms.toFixed(1).padStart(6)} ${peak.toFixed(2).padStart(5)}  ${String(Math.round(rmin)).padStart(5)}-${String(Math.round(rmax)).padEnd(6)}  ${String(gmax).padStart(6)} ${vmax.toFixed(0).padStart(6)} ${String(evs.size).padStart(6)} ${cpu.toFixed(0).padStart(8)} ${longest.toFixed(2).padStart(10)}${flag}`);
    if (wav) writeWav(new URL(`./out/${id}-${scene}.wav`, import.meta.url), L, R);
  }
}
process.exit(failures ? 1 : 0);
