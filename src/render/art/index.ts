// Builds every sprite: licensed atlas first (see ASSETS.md), then original procedural art for the rest.
import { images, texts } from '../../assets/loader';
import { addImageFrames } from '../pixel';
import { buildBlockArt } from './blocks';
import { buildStructureArt } from './structures';
import { buildUnitArt } from './units';

export const LICENSED = new Set<string>();

export function buildAllArt() {
  const img = images.get('sprites/licensed');
  const json = texts.get('sprites/licensed-atlas');
  if (img && json) {
    const meta = JSON.parse(json) as Record<string, { r: [number, number, number, number][]; ax: number; ay: number }>;
    for (const [key, m] of Object.entries(meta)) { addImageFrames(key, img, m.r, m.ax, m.ay); LICENSED.add(key); }
  }
  buildUnitArt();
  buildStructureArt();
  buildBlockArt();
}
