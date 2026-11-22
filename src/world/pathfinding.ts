import type { Rect } from '../core/specs';
import { circleIntersectsRect } from './collision';
import type { Vec2 } from '../core/projection';

/**
 * Walk grid + A* for tap/click-to-move. The grid marks cells where an actor of `radius` can stand.
 * Paths are smoothed by line-of-sight (string pulling) so movement looks natural, not grid-like.
 */
export class WalkGrid {
  readonly cols: number;
  readonly rows: number;
  private free: Uint8Array;
  private buf?: { gScore: Float32Array; came: Int32Array; closed: Uint8Array; f: Float32Array };

  constructor(readonly width: number, readonly height: number, readonly solids: readonly Rect[], readonly radius: number, readonly cell = 8) {
    this.cols = Math.ceil(width / cell);
    this.rows = Math.ceil(height / cell);
    this.free = new Uint8Array(this.cols * this.rows).fill(1);
    // Rasterise each solid into the cells whose centre is within `radius` of it (same result as testing every cell
    // against every solid, but O(covered area) — large outdoor regions have ~700k cells and hundreds of solids).
    for (const s of solids) {
      const c0 = Math.max(0, Math.floor((s.x - radius) / cell)), c1 = Math.min(this.cols - 1, Math.floor((s.x + s.w + radius) / cell));
      const r0 = Math.max(0, Math.floor((s.y - radius) / cell)), r1 = Math.min(this.rows - 1, Math.floor((s.y + s.h + radius) / cell));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const i = r * this.cols + c;
        if (!this.free[i]) continue;
        const p = this.center(c, r);
        if (circleIntersectsRect(p.x, p.y, radius, s)) this.free[i] = 0;
      }
    }
  }

  center(c: number, r: number): Vec2 { return { x: c * this.cell + this.cell / 2, y: r * this.cell + this.cell / 2 }; }
  cellOf(p: Vec2): [number, number] { return [Math.max(0, Math.min(this.cols - 1, Math.floor(p.x / this.cell))), Math.max(0, Math.min(this.rows - 1, Math.floor(p.y / this.cell)))]; }
  isFree(c: number, r: number): boolean { return c >= 0 && r >= 0 && c < this.cols && r < this.rows && this.free[r * this.cols + c] === 1; }
  standable(p: Vec2): boolean { return !this.solids.some((s) => circleIntersectsRect(p.x, p.y, this.radius, s)); }

  /** Nearest standable cell centre to `p` (ring search), or null if none within maxCm. */
  nearestFree(p: Vec2, maxCm = 200): Vec2 | null {
    const [c0, r0] = this.cellOf(p);
    const maxRing = Math.ceil(maxCm / this.cell);
    let best: Vec2 | null = null, bestD = Infinity;
    for (let ring = 0; ring <= maxRing; ring++) {
      for (let dr = -ring; dr <= ring; dr++) for (let dc = -ring; dc <= ring; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== ring || !this.isFree(c0 + dc, r0 + dr)) continue;
        const q = this.center(c0 + dc, r0 + dr), d = Math.hypot(q.x - p.x, q.y - p.y);
        if (d < bestD) { bestD = d; best = q; }
      }
      if (best) return best;
    }
    return null;
  }

  /** Straight walk possible? Samples the segment at sub-radius spacing. */
  lineOfSight(a: Vec2, b: Vec2): boolean {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(len / (this.radius / 2)));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      if (!this.standable({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })) return false;
    }
    return true;
  }

  /** A* (8-neighbour, no corner cutting). Returns smoothed waypoints from start (exclusive) to goal, or null. */
  findPath(start: Vec2, goal: Vec2): Vec2[] | null {
    const g0 = this.standable(goal) ? goal : this.nearestFree(goal);
    if (!g0) return null;
    if (this.lineOfSight(start, g0)) return [g0];
    const [sc, sr] = this.cellOf(start), [gc, gr] = this.cellOf(g0);
    const N = this.cols * this.rows, idx = (c: number, r: number) => r * this.cols + c;
    // search buffers are allocated once per grid and reset per search (no per-tap garbage on big maps)
    const buf = this.buf ??= { gScore: new Float32Array(N), came: new Int32Array(N), closed: new Uint8Array(N), f: new Float32Array(N) };
    const { gScore, came, closed, f } = buf;
    gScore.fill(Infinity); came.fill(-1); closed.fill(0); f.fill(Infinity);
    const open: number[] = [];   // binary heap of indices ordered by f
    const h = (c: number, r: number) => { const dx = Math.abs(c - gc), dy = Math.abs(r - gr); return (dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy)) * this.cell; };
    const push = (i: number) => { open.push(i); let k = open.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (f[open[p]!]! <= f[open[k]!]!) break; [open[p], open[k]] = [open[k]!, open[p]!]; k = p; } };
    const pop = () => { const top = open[0]!; const last = open.pop()!; if (open.length) { open[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < open.length && f[open[l]!]! < f[open[m]!]!) m = l; if (r < open.length && f[open[r]!]! < f[open[m]!]!) m = r; if (m === k) break; [open[m], open[k]] = [open[k]!, open[m]!]; k = m; } } return top; };
    const s = idx(sc, sr);
    gScore[s] = 0; f[s] = h(sc, sr); push(s);
    const goalI = idx(gc, gr);
    while (open.length) {
      const cur = pop();
      if (cur === goalI) break;
      if (closed[cur]) continue;
      closed[cur] = 1;
      const c = cur % this.cols, r = (cur - c) / this.cols;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nc = c + dc, nr = r + dr;
        if (!this.isFree(nc, nr) && !(nc === sc && nr === sr)) continue;
        if (dc && dr && (!this.isFree(c + dc, r) || !this.isFree(c, r + dr))) continue; // no corner cutting
        const ni = idx(nc, nr), cost = gScore[cur]! + (dc && dr ? Math.SQRT2 : 1) * this.cell;
        if (cost < gScore[ni]!) { gScore[ni] = cost; came[ni] = cur; f[ni] = cost + h(nc, nr); push(ni); }
      }
    }
    if (came[goalI] === -1 && goalI !== s) return null;
    const cells: Vec2[] = [];
    for (let i = goalI; i !== s && i !== -1; i = came[i]!) { const c = i % this.cols; cells.push(this.center(c, (i - c) / this.cols)); }
    cells.reverse();
    cells[cells.length - 1] = g0;
    // string pulling, linear: extend each straight leg while the walk grid (already inflated by the radius) stays
    // free along it; a cell lookup per sample instead of testing every solid (towns have long paths)
    const out: Vec2[] = [];
    let from = start, i = 0;
    while (i < cells.length) {
      let j = i;
      while (j + 1 < cells.length && this.gridSight(from, cells[j + 1]!)) j++;
      out.push(cells[j]!); from = cells[j]!; i = j + 1;
    }
    return out;
  }

  /** Line of sight on the grid: every sample (≤ half a cell apart) lies in a free cell. */
  gridSight(a: Vec2, b: Vec2): boolean {
    const len = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.max(1, Math.ceil(len / (this.cell / 2)));
    for (let i = 1; i < steps; i++) {
      const t = i / steps, c = Math.floor((a.x + (b.x - a.x) * t) / this.cell), r = Math.floor((a.y + (b.y - a.y) * t) / this.cell);
      if (!this.isFree(c, r)) return false;
    }
    return true;
  }
}
