# Physical Android performance test (Galaxy A05 class): low-cost procedure

**Goal:** real frame rates on the target phone. Headless or emulated numbers are a **proxy only** and are never reported as device results.
**Cost:** free. You need the phone, a laptop with this repository, and the same Wi-Fi network. No accounts, cloud devices or paid services.

## 1. Serve the production build on your network (laptop)
```bash
npm ci
```
```bash
npm run build
```
```bash
npx vite preview --host --port 4173
```
Vite prints a `Network:` address, for example `http://192.168.1.23:4173/`.

## 2. Run the benchmark (phone, Chrome)
1. Close other apps. Keep the phone at room temperature, plugged in or above 50 % battery.
2. Open **`http://<laptop-ip>:4173/?fresh&bench`**. Keep the screen on and don't touch it for about 2 minutes.
3. The game tours four scenes, then repeats the tour at render scale 1.5 and 1 (a 2× native screen gives 12 measured scenes):
   - bedroom, night
   - Batuphat street, night
   - west block, night
   - street, afternoon
4. A result card appears. Tap **Copy results**.

## 3. Record the result
- Paste the JSON into `docs/reviews/device/<yyyy-mm-dd>-<phone-model>.json` (or send it to Claude).
- It contains the browser user agent, GPU name, screen size and fps rows. It contains **no personal data**. Check it before committing anyway.
- **The fields that matter:**
  - `avgFps` and `p5Fps` (the "5 % low") per scene and render scale;
  - `worstMs` (the longest frame stall).
- **Targets:** comfortable is ≥ 30 fps average with a 5 % low ≥ 24; good is ≥ 45.

## 4. Optional: normal play test
- Open `http://<laptop-ip>:4173/?fresh` and play the route: bedroom → street → Indomaret → west block → Mixue.
- The **Display** row in the speaker panel shows the adaptive render scale ("Auto · 2×", "Auto · 1.5×", …). Auto mode steps down when frames stay below 40 fps.
- Note whether it stepped down, and whether the result still looks sharp enough.

## What the result decides
- **If the street at scale 2 is already ≥ 45 fps:** keep Auto as it is (it will rarely step down).
- **If the 1.5 step is needed for ≥ 30 fps:** consider starting outdoor maps at 1.5 on low-end GPUs (per-device memory already keeps the chosen scale).
- **If even scale 1 is below 30 fps:** profile the device with Chrome remote debugging before more art lands. The candidates:
  1. cached static exterior layers;
  2. fewer full-screen lighting passes.

## Proxy measurements so far (NOT device results)
These numbers come from headless software-rendered Chromium on an emulated Galaxy S9+ screen (800×360 CSS, DPR 2), night, median of 3 runs:

| Scene | Scale 2 | Scale 1.5 | Scale 1 |
|---|---|---|---|
| Street | 12.3 fps | 20.0 fps | 39.7 fps |
| Bedroom | 14.3 fps | 22.3 fps | 43.3 fps |

The proxy is fill-bound, which is why lower render scales gain so much. A real mobile GPU will give different absolute numbers.
