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

  constructor(readonly width: number, readonly height: number, readonly solids: readonly Rect[], readonly radius: number, readonly cell = 8) {
    this.cols = Math.ceil(width / cell);
    this.rows = Math.ceil(height / cell);
    this.free = new Uint8Array(this.cols * this.rows);
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const p = this.center(c, r);
      this.free[r * this.cols + c] = solids.some((s) => circleIntersectsRect(p.x, p.y, radius, s)) ? 0 : 1;
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
    const gScore = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const open: number[] = [];   // binary heap of indices ordered by f
    const f = new Float32Array(N).fill(Infinity);
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
    // string pulling
    const out: Vec2[] = [];
    let from = start, i = 0;
    while (i < cells.length) {
      let j = cells.length - 1;
      while (j > i && !this.lineOfSight(from, cells[j]!)) j--;
      out.push(cells[j]!); from = cells[j]!; i = j + 1;
    }
    return out;
  }
}
