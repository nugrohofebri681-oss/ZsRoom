import { describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { FLOORS } from '../../src/world/floor';
import { compileRegion } from '../../src/world/region';
import { getCharacterSpec } from '../../src/core/specs';
import { auditRegion, auditReport } from '../../src/world/geometryAudit';

/**
 * Town geometry audit (P6.1): no building on a path, no fence across a path, every spawn standable, every door and
 * interaction reachable, ground overlaps resolved by a deterministic material rank. `AUDIT_OUT=<file>` also writes
 * the full report (npm run audit:geometry).
 */
describe('geometry audit: batuphat_town', () => {
  const def = FLOORS.get('batuphat_town')!;
  const findings = auditRegion(def, compileRegion(def), getCharacterSpec('char_zila').collision.radiusCm);
  if (process.env.AUDIT_OUT) writeFileSync(process.env.AUDIT_OUT, auditReport(findings, 'batuphat_town'));
  it('has no FAIL findings', () => {
    expect(findings.filter((f) => f.severity === 'FAIL').map((f) => `${f.check}: ${f.detail}`)).toEqual([]);
  });
});
