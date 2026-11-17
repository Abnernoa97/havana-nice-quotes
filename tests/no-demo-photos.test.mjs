import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createQuoteDraft } from '../src/features/quotes/model.ts';


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

test('Todas las portadas reales usan únicamente su imagen guardada; nunca imágenes de prueba',()=>{
 const node=readFileSync(new URL('../src/features/templates/CarolinaPhotoNode.tsx',import.meta.url),'utf8');
 const editorial=readFileSync(new URL('../src/features/templates/EditorialTemplate.tsx',import.meta.url),'utf8');
 assert.match(node,/backgroundImage: url && !isVideo/);
 assert.match(editorial,/<CoverMediaNode item=\{item\} interaction=\{interaction\}/);
 assert.doesNotMatch(editorial,/unsplash|dummyimage|placeholder\.com/i);
});

test('El lector 3D sigue intacto y sus hojas no traen fotos de prueba', () => {
  const magazine = readFileSync(new URL('../src/features/magazine/FlipMagazine.tsx', import.meta.url), 'utf8');
  assert.match(magazine, /flippingTime: 1080/);
  assert.match(magazine, /maxShadowOpacity: 0\.72/);
  const editorial=readFileSync(new URL('../src/features/templates/EditorialTemplate.tsx',import.meta.url),'utf8');
  assert.match(magazine, /<EditorialCover item=\{item\}/);
  assert.match(magazine, /<EditorialCollage item=\{item\}/);
  assert.match(magazine, /<EditorialTerms item=\{item\}/);
  assert.match(editorial, /ExtraPhotos item=\{item\} page=\{0\}/);
  assert.doesNotMatch(magazine, /dummyimage|unsplash|placeholder\.com/i);
});
