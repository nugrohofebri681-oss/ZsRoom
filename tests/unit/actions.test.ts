import { describe, expect, it } from 'vitest';
import { applyAction, nextPhase, OUTFITS } from '../../src/interaction/actions';
import { migrate, SAVE_VERSION } from '../../src/systems/save';

describe('interaction actions', () => {
  it('rest advances the time of day; resting at night starts a new morning', () => {
    let r = applyAction({ type: 'rest' }, { phase: 'evening', day: 1 }, 'Rest');
    expect(r.vars.phase).toBe('night');
    expect(r.fade).toBe(true);
    r = applyAction({ type: 'rest' }, r.vars, 'Rest');
    expect(r.vars.phase).toBe('morning');
    expect(r.vars.day).toBe(2);
    expect(nextPhase('afternoon')).toBe('evening');
  });
  it('outfit cycles through every outfit and wraps', () => {
    let vars = { outfit: 'default' } as Record<string, string | number | boolean>;
    const seen = new Set<string>();
    for (let i = 0; i < OUTFITS.length; i++) { vars = applyAction({ type: 'outfit' }, vars, 'x').vars; seen.add(String(vars.outfit)); }
    expect(seen.size).toBe(OUTFITS.length);
    expect(vars.outfit).toBe('default');
  });
  it('toggleVar flips a persistent variable with its message', () => {
    const a = { type: 'toggleVar', var: 'curtainsClosed', messages: { true: 'Closed', false: 'Open' } } as const;
    const r1 = applyAction(a, {}, 'Curtains');
    expect(r1.vars.curtainsClosed).toBe(true);
    expect(r1.toast).toBe('Closed');
    expect(applyAction(a, r1.vars, 'Curtains').vars.curtainsClosed).toBe(false);
  });
  it('message, sit and light actions are described, not performed', () => {
    expect(applyAction({ type: 'message', lines: ['a', 'b'] }, {}, 'x').dialogue).toEqual(['a', 'b']);
    expect(applyAction({ type: 'sit', seat: { x: 0, y: -20 }, heightCm: 45, facing: 'N' }, {}, 'x').sit?.heightCm).toBe(45);
    expect(applyAction({ type: 'toggleLight' }, {}, 'x').toggleLight).toBe(true);
    expect(applyAction(undefined, {}, 'Look').toast).toBe('Look');
  });
  it('v1 saves migrate to v2 with default world variables', () => {
    const v1 = { version: 1, savedAt: 'x', roomId: 'zila_bedroom', player: { characterId: 'char_zila', x: 1, y: 2, facing: 'N', outfit: 'blue' }, flags: {} };
    const m = migrate(v1)!;
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.vars).toMatchObject({ phase: 'evening', outfit: 'blue' });
  });
});
