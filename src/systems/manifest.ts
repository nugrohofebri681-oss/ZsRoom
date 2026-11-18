export type AssetStatus = 'requested' | 'greybox' | 'submitted' | 'approved' | 'retired';
export interface ManifestEntry {
  status: AssetStatus;
  spec: string;
  request?: string;
  version?: string;
  runtime?: Record<string, { path: string; sha256: string; density: number }>;
}
export interface AssetManifest { manifestVersion: number; assets: Record<string, ManifestEntry> }

/** Choose the runtime density variant for this device: HD on high-DPI or large screens, SD otherwise. */
export function pickDensityVariant(devicePixelRatio: number, viewportMax: number, available: string[]): string | null {
  if (available.length === 0) return null;
  const wantHd = devicePixelRatio * viewportMax >= 1600;
  if (wantHd && available.includes('hd')) return 'hd';
  if (available.includes('sd')) return 'sd';
  return available[0] ?? null;
}

export function textureKey(assetId: string): string { return `asset:${assetId}`; }
