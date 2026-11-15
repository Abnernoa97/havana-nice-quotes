import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppNavigator, initialView, readNavigationEntry } from '../src/app/native-navigation.ts';

function fixture() {
  const entries = [null];
  let cursor = 0;
  let navigator;
  let rootBack = 0;
  const browser = {
    get state() { return entries[cursor]; },
    pushState(entry) { entries.splice(cursor + 1); entries.push(entry); cursor = entries.length - 1; },
    replaceState(entry) { entries[cursor] = entry; },
    back() {
      if (cursor) { cursor -= 1; navigator.onPopState(entries[cursor]); }
      else rootBack += 1;
    },
  };
  navigator = createAppNavigator(browser, 'hn1', () => {});
  navigator.initialize();
  return { navigator, browser, entries, get rootBack() { return rootBack; } };
}

test('Android Back at Inicio leaves navigation to the browser without trapping the user', () => {
  const f = fixture();
  assert.deepEqual(f.navigator.getView(), initialView('hn1'));
  f.navigator.back();
  assert.equal(f.rootBack, 1);
  assert.equal(f.entries.length, 1);
});

test('Native Back restores prior home, quotes, editor and messages screens', () => {
  const f = fixture();
  f.navigator.transition({ section: 'quotes' });
  f.navigator.transition({ section: 'editor', active: 'hn2' });
  f.navigator.transition({ section: 'messages' });
  f.navigator.back();
  assert.equal(f.navigator.getView().section, 'editor');
  assert.equal(f.navigator.getView().active, 'hn2');
  f.navigator.back();
  assert.equal(f.navigator.getView().section, 'quotes');
  f.navigator.back();
  assert.equal(f.navigator.getView().section, 'home');
});

test('Editor tabs restore in the reverse order without modifying quote data', () => {
  const f = fixture();
  f.navigator.transition({ section: 'editor', tab: 'details' });
  f.navigator.transition({ tab: 'styles' });
  f.navigator.transition({ tab: 'design' });
  f.navigator.transition({ tab: 'pricing' });
  f.navigator.back();
  assert.equal(f.navigator.getView().tab, 'design');
  f.navigator.back();
  assert.equal(f.navigator.getView().tab, 'styles');
  f.navigator.back();
  assert.equal(f.navigator.getView().tab, 'details');
});

test('Drawer selection replaces the open drawer so Back never reopens it', () => {
  const f = fixture();
  f.navigator.transition({ mobileMenu: true });
  f.navigator.transition({ mobileMenu: false, section: 'quotes' }, 'replace');
  f.navigator.back();
  assert.equal(f.navigator.getView().section, 'home');
  assert.equal(f.navigator.getView().mobileMenu, false);
});

test('Native Back dismisses mobile drawer, install guide and client preview', () => {
  const f = fixture();
  f.navigator.transition({ mobileMenu: true });
  f.navigator.back();
  assert.equal(f.navigator.getView().mobileMenu, false);
  f.navigator.transition({ installGuide: true });
  f.navigator.back();
  assert.equal(f.navigator.getView().installGuide, false);
  f.navigator.transition({ section: 'editor' });
  f.navigator.transition({ preview: true, previewMode: 'flip' });
  f.navigator.transition({ previewMode: 'scroll' }, 'replace');
  f.navigator.back();
  assert.equal(f.navigator.getView().preview, false);
  assert.equal(f.navigator.getView().section, 'editor');
});

test('Native Back restores prior active conversation and device preview mode', () => {
  const f = fixture();
  f.navigator.transition({ section: 'messages' });
  f.navigator.transition({ active: 'hn2' });
  f.navigator.transition({ active: 'hn3' });
  f.navigator.back();
  assert.equal(f.navigator.getView().active, 'hn2');
  f.navigator.transition({ section: 'editor' });
  f.navigator.transition({ mobilePreview: true });
  f.navigator.back();
  assert.equal(f.navigator.getView().mobilePreview, false);
});

test('Revisiting the same screen does not create redundant history entries', () => {
  const f = fixture();
  f.navigator.transition({ section: 'home' });
  f.navigator.transition({ tab: 'styles' });
  assert.equal(f.entries.length, 1);
  f.navigator.transition({ section: 'quotes' });
  f.navigator.transition({ section: 'quotes' });
  assert.equal(f.entries.length, 2);
});

test('Refresh restores the active view and invalid state is rejected', () => {
  const f = fixture();
  f.navigator.transition({ section: 'editor', active: 'hn2', tab: 'pricing' });
  const restored = createAppNavigator(f.browser, 'hn1', () => {});
  assert.equal(restored.getView().active, 'hn2');
  assert.equal(restored.getView().tab, 'pricing');
  assert.equal(readNavigationEntry({ __havanaNiceHistory: 1, depth: -1 }), null);
  assert.equal(readNavigationEntry({ __havanaNiceHistory: 1, depth: 1, view: {} }), null);
});

test('History records contain route IDs, not private quote content', () => {
  const f = fixture();
  f.navigator.transition({ section: 'editor', active: 'hn2' });
  const entry = readNavigationEntry(f.browser.state);
  assert.equal(entry?.view.active, 'hn2');
  assert.deepEqual(Object.keys(entry.view).sort(), Object.keys(initialView('hn1')).sort());
});


test('Native Back closes the full-screen photo viewer before leaving Fotos', () => {
  const f = fixture();
  f.navigator.transition({ section: 'photos' });
  f.navigator.transition({ photoViewerId: 'photo-one' });
  f.navigator.transition({ photoViewerId: 'photo-two' }, 'replace');
  f.navigator.back();
  assert.equal(f.navigator.getView().section, 'photos');
  assert.equal(f.navigator.getView().photoViewerId, null);
  f.navigator.back();
  assert.equal(f.navigator.getView().section, 'home');
});

test('Native Back exits long-press photo selection without leaving Fotos', () => {
  const f = fixture();
  f.navigator.transition({ section: 'photos' });
  f.navigator.transition({ photoSelecting: true });
  assert.equal(f.navigator.getView().photoSelecting, true);
  f.navigator.back();
  assert.equal(f.navigator.getView().photoSelecting, false);
  assert.equal(f.navigator.getView().section, 'photos');
});
