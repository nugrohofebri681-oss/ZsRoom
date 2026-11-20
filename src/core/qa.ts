/**
 * QA/test-only switches. They work in `vite` dev and in the `--mode qa` build that Playwright serves;
 * the production build (`npm run build`, MODE=production) ignores them, so players never get them.
 */
export interface BuildEnv { DEV?: boolean; MODE?: string }

export function isQaBuild(env: BuildEnv): boolean { return !!env.DEV || env.MODE === 'qa'; }

/** `?fast` triples walk speed for long automated route tests. Never skips doors or collision. */
export function walkSpeedMultiplier(search: string, env: BuildEnv): number {
  return isQaBuild(env) && new URLSearchParams(search).has('fast') ? 3 : 1;
}
