import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createQuoteDraft } from '../src/features/quotes/model.ts';
import { coverBackground } from '../src/shared/lib/coverBackground.ts';

const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url));
const files = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const path = join(dir, entry.name);
  return entry.isDirectory() ? files(path) : [path];
});

test('Producción no contiene fotos de stock ni semillas de ejemplo', () => {
  assert.equal(existsSync(new URL('../src/features/quotes/demo-data.ts', import.meta.url)), false);
  for (const file of files(sourceRoot).filter(p => /\.(tsx?|css)$/.test(p))) {
    const source = readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /images\.unsplash\.com|source\.unsplash\.com/, file);
  }
  assert.equal(createQuoteDraft('hn-draft').cover, '');
});

test('Las portadas vacías no provocan peticiones de imágenes y las reales sí aparecen', () => {
  const gradient = 'linear-gradient(180deg,#123,#456)';
  assert.equal(coverBackground('', gradient), gradient);
  assert.equal(coverBackground('/api/media/example-photo', gradient),
    gradient + ', url("/api/media/example-photo")');
  assert.equal(coverBackground('', gradient).includes('url('), false);
});

test('El lector 3D sigue intacto y sus hojas no traen fotos de prueba', () => {
  const magazine = readFileSync(new URL('../src/features/magazine/FlipMagazine.tsx', import.meta.url), 'utf8');
  assert.match(magazine, /flippingTime: 1080/);
  assert.match(magazine, /maxShadowOpacity: 0\.72/);
  assert.match(magazine, /coverBackground\(item\.cover/);
  for (const classname of ['hn-editorial-picture', 'hn-vision-picture', 'hn-end-photo']) {
    assert.ok(magazine.includes('className="' + classname + '" aria-hidden="true"'));
  }
});
