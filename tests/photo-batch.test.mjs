import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_PHOTOS_PER_UPLOAD, processPhotoBatch } from '../src/features/photos/photo-batch.ts';

const files = count => Array.from({ length: count }, (_, i) => ({
  name: 'foto-' + (i + 1) + '.jpg', type: 'image/jpeg', size: 1024,
}));

test('Admite una o diez fotos por lote y conserva el orden', async () => {
  assert.equal(MAX_PHOTOS_PER_UPLOAD, 10);
  for (const count of [1,10]) {
    const progress = [];
    const result = await processPhotoBatch(files(count), async file => file.name,
      (done,total) => progress.push({done,total}));
    assert.equal(result.uploaded.length, count);
    assert.deepEqual(result.failures, []);
    assert.equal(progress.length, count);
    assert.deepEqual(progress.at(-1), { done: count, total: count });
    assert.equal(result.uploaded[0], 'foto-1.jpg');
  }
});

test('Rechaza once fotos antes de realizar cualquier subida a R2', async () => {
  let requested = 0;
  await assert.rejects(() => processPhotoBatch(files(11), async () => {
    requested += 1;
  }), /máximo 10 fotografías/);
  assert.equal(requested, 0);
});

test('Una fotografía fallida no cancela las otras del mismo lote', async () => {
  let processed = 0;
  const result = await processPhotoBatch(files(4), async file => {
    processed += 1;
    if (file.name === 'foto-2.jpg') throw new Error('Sin conexión.');
    return file.name;
  });
  assert.equal(processed, 4);
  assert.deepEqual(result.uploaded, ['foto-1.jpg','foto-3.jpg','foto-4.jpg']);
  assert.deepEqual(result.failures, [{ filename: 'foto-2.jpg', reason: 'Sin conexión.' }]);
});

test('Una selección vacía no inicia la subida', async () => {
  const out = await processPhotoBatch([], async () => { throw new Error('Not expected'); });
  assert.deepEqual(out, { uploaded: [], failures: [] });
});
