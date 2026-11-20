import test from 'node:test';
import assert from 'node:assert/strict';
import { computeMagazineBindingGeometry } from '../src/features/magazine/magazine-binding-geometry.ts';

test('Flat binding scales with measured portrait page size and has an exterior board', () => {
  for (const width of [270, 320, 410, 560]) {
    const box = computeMagazineBindingGeometry(
      { left: 100, top: 40, width, height: 580 },
      { left: 0, top: 0 }, 13,
    );
    assert.ok(box.width >= 38 && box.width <= 54);
    assert.ok(box.exterior > box.width / 2);
    assert.ok(box.left < 100 && box.left + box.width > 100);
    assert.equal(box.top, 38);
    assert.equal(box.height, 597);
  }
});

test('Stage offsets never distort the binding relative to the actual book', () => {
  const a = computeMagazineBindingGeometry(
    { left: 180, top: 120, width: 410, height: 580 },
    { left: 90, top: 70 }, 10,
  );
  const b = computeMagazineBindingGeometry(
    { left: 280, top: 230, width: 410, height: 580 },
    { left: 190, top: 180 }, 10,
  );
  assert.deepEqual(a, b);
});
