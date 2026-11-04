# Luma Music 1.0 — Implementation and validation

## Scope and branching
Created 2026-11-04 on `feature/music-immersive-v1`, based on the tested `feature/groups-v1` branch. This is **not merged to main**. Existing `main/index.html` version 0.23 remains the user's current production rollback. The approved group's target picker and scenes library remain available.

## Existing music pipeline audit (verified in source)
- Microphone capture occurs on an explicit user tap, via `getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}})`, Web Audio Analyser FFT 2048 and local frame processing.
- The three FFT signal bands are 35–210 Hz, 250–3500 Hz and 3500–9000 Hz. The `Stimmenbereich` option is a frequency focus, **not** voice separation.
- Existing audio processing includes optional room-noise profile, digital dB sensitivity gate, smoothing, beat impulses and 7 preview colour/brightness frames.
- Existing Hue API v1 sender sends one sequential per-light PUT roughly every 120–250ms, or a group action roughly every 1000ms where supported. It avoids duplicate values, checks frame age, cancels stale music requests on stop, and aborts failed calls. **Therefore, the current Web REST path is not guaranteed to be subsecond for every lamp**. No claim of true entertainment latency is supported without native streaming and real Bridge measurements.
- Music transport and signal algorithms are preserved; their cadence has **not** been artificially increased.
- Device and room targeting continues to resolve through shared `LumaGroupsV1`.
- Original main Music UI had 3 long technical cards, status text, charts and settings, and music transport status. They cluttered the iPhone view and made everyday usage difficult.

## New feature branch implementation
- `index.html`: replaces old first Music card with ambient music hero, stable status areas, one existing start/stop flow and visualizer. Adds quick palette/mode/focus/preset panels. Keeps original advanced settings/audio meters/diagnostics behind expandable details.
- `music-immersive-v1.css`: visual tokens, fixed-height visualization, iPhone control sizes, safe reductions for motion, diagnostic panel.
- `music-immersive-v1.js`: moves original working controls into accessible quick panels; reads existing `window.lumaMusicState()` for a low-frequency 180ms animation (only when Music is visible). Creates no network requests, permission prompts or duplicate Hue state.
- `musicOutput` connection/diagnostic section remains available within the expert details; no bridge/connection credentials moved.
- `tests/music-immersive.test.cjs`: static HTML / JS regressions, presence of original mic/Hue functions and DOM test of non-network enhancer.
- CI workflow tests both music and inherited group module.

## Separate iPhone preview
Public path intended: `https://leonvalmeida-cyber.github.io/luma-control/music-preview/?v=1`.
- Created under `main:music-preview/` as a **separate static mock app**, without any Hue API calls.
- Preserves the visual group tree demo.
- Music page: opt-in real microphone analyser, animation mode, palette, bass/mid/high readouts, intensity & speed, frequency focus.
- Explicit permission action; no audio recording/upload, no Bridge data writes.
- Only browser microphone processing is measured. The preview does **not** test the Hue Bridge or prove 0.5-second total end-to-end responsiveness.

## Verification
- Music branch CI: Music 1.0 tests passed; inherited Groups v1 checks also passed on the draft PR head.
- Syntax and duplicate ID validation performed on preview HTML before GitHub upload.
- Preview files on GitHub verified. Public GitHub Pages accessibility and physical iPhone tests **not yet confirmed**.
- Real Hue Bridge Pro music latency, microphone capture on Safari with external music source, and hardware regression remain **not tested**.

## Next action
User should open the separate preview on iPhone and test two things: (1) quick mode and palette controls, and (2) real microphone responsiveness from an external speaker (no Hue commands). Confirm preference and report errors. After approval, do a safe physical Hue test on the feature branch before any production merge. Next engineering task: investigate native Hue Entertainment (DTLS/streaming) or safe targeted update batching for genuinely responsive multi-lamp music, with real measurements.
