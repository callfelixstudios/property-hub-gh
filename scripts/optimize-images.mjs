import sharp from 'sharp';
import { stat } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

const SPEC = [
  { name: 'hero-bg', width: 1920, maxBytes: 300 * 1024 },
  { name: 'property-1', width: 800, maxBytes: 200 * 1024 },
  { name: 'property-2', width: 800, maxBytes: 200 * 1024 },
  { name: 'property-3', width: 800, maxBytes: 200 * 1024 },
  { name: 'neighborhood-eastlegon', width: 800, maxBytes: 200 * 1024 },
  { name: 'neighborhood-cantonments', width: 800, maxBytes: 200 * 1024 },
  { name: 'neighborhood-labone', width: 800, maxBytes: 200 * 1024 },
];

async function optimize({ name, width, maxBytes }) {
  const input = path.join(PUBLIC_DIR, `${name}.png`);
  const output = path.join(PUBLIC_DIR, `${name}.webp`);
  const srcSizeKB = (await stat(input)).size / 1024;

  let quality = 80;
  let result;
  while (quality >= 50) {
    result = await sharp(input).resize({ width }).webp({ quality }).toFile(output);
    if (result.size <= maxBytes) break;
    quality -= 5;
  }

  const outSizeKB = result.size / 1024;
  const met = result.size <= maxBytes;
  const targetKB = (maxBytes / 1024).toFixed(0);
  console.log(
    `${name}: ${srcSizeKB.toFixed(1)} KB -> ${outSizeKB.toFixed(1)} KB @q${quality} ` +
      `${met ? 'OK' : 'OVER'} (target ${targetKB} KB)`
  );
  return { name, met };
}

const results = await Promise.all(SPEC.map(optimize));
const failed = results.filter((r) => !r.met);
if (failed.length) {
  console.log(`SUMMARY: ${failed.length} file(s) did not meet target: ${failed.map((f) => f.name).join(', ')}`);
} else {
  console.log('SUMMARY: all images met their size targets');
  process.exit(0);
}
process.exit(1);
