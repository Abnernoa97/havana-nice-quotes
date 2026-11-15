/** Browser and Android PWA Back navigation, independent of any visual components. */
export type AppSection = 'home' | 'quotes' | 'editor' | 'messages' | 'photos' | 'trash';
export type EditorTab = 'details' | 'styles' | 'design' | 'publish';
export type ReadingView = 'flip' | 'scroll';
export type AppView = {
  section: AppSection;
  active: string;
  tab: EditorTab;
  preview: boolean;
  previewMode: ReadingView;
  mobileMenu: boolean;
  installGuide: boolean;
  photoViewerId: string | null;
  photoSelecting: boolean;
};
type Entry = { depth: number; view: AppView };
type Stamped = Entry & { __havanaNiceHistory: 1 };
export type BrowserHistoryPort = {
  state: unknown;
  pushState(data: unknown, unused: string): void;
  replaceState(data: unknown, unused: string): void;
  back(): void;
};
const sections: AppSection[] = ['home', 'quotes', 'editor', 'messages', 'photos', 'trash'];
const tabs: EditorTab[] = ['details', 'styles', 'design', 'publish'];
const modes: ReadingView[] = ['flip', 'scroll'];

export function initialView(active: string): AppView {
  return {
    section: 'home', active, tab: 'details', preview: false,
    previewMode: 'flip', mobileMenu: false,
    installGuide: false,
    photoViewerId: null,
    photoSelecting: false,
  };
}
export function readNavigationEntry(state: unknown): Entry | null {
  if (!state || typeof state !== 'object') return null;
  const entry = state as Partial<Stamped>;
  if (entry.__havanaNiceHistory !== 1 ||
      !Number.isSafeInteger(entry.depth) || (entry.depth ?? -1) < 0 ||
      !entry.view || typeof entry.view !== 'object') return null;
  const view = entry.view as Omit<Partial<AppView>, 'tab'> & { tab?: EditorTab | 'pricing' };
  if (!sections.includes(view.section as AppSection) ||
      typeof view.active !== 'string' || !view.active.trim() ||
      !(tabs.includes(view.tab as EditorTab) || view.tab === 'pricing') ||
      !modes.includes(view.previewMode as ReadingView) ||
      typeof view.preview !== 'boolean' ||
      typeof view.mobileMenu !== 'boolean' ||
      typeof view.installGuide !== 'boolean' ||
      (view.photoViewerId !== null && typeof view.photoViewerId !== 'string') ||
      typeof view.photoSelecting !== 'boolean') return null;
  // Normalize old saved navigation states without carrying obsolete preview fields.
  return { depth: entry.depth!, view: {
    section: view.section as AppSection,
    active: view.active as string,
    tab: view.tab === 'pricing' ? 'details' : view.tab as EditorTab,
    preview: view.preview as boolean,
    previewMode: view.previewMode as ReadingView,
    mobileMenu: view.mobileMenu as boolean,
    installGuide: view.installGuide as boolean,
    photoViewerId: view.photoViewerId as string | null,
    photoSelecting: view.photoSelecting as boolean,
  } };
}
const stamp = (entry: Entry): Stamped => ({ __havanaNiceHistory: 1, ...entry });
const sameView = (a: AppView, b: AppView): boolean =>
  (Object.keys(a) as (keyof AppView)[]).every(key => a[key] === b[key]);

/** One history controller for every screen, drawer, tab and client view. */
export function createAppNavigator(
  browser: BrowserHistoryPort, initialActive: string, onChange: (view: AppView) => void
) {
  let current: Entry = readNavigationEntry(browser.state) ||
    { depth: 0, view: initialView(initialActive) };
  const initialize = () => {
    if (!readNavigationEntry(browser.state)) browser.replaceState(stamp(current), '');
  };
  const transition = (changes: Partial<AppView>, method: 'push' | 'replace' = 'push') => {
    const view: AppView = { ...current.view, ...changes };
    if (sameView(current.view, view)) return;
    const entry: Entry = { depth: current.depth + (method === 'push' ? 1 : 0), view };
    if (method === 'push') browser.pushState(stamp(entry), '');
    else browser.replaceState(stamp(entry), '');
    current = entry;
    onChange(view);
  };
  const onPopState = (state: unknown) => {
    const entry = readNavigationEntry(state);
    if (!entry) return;
    current = entry;
    onChange(entry.view);
  };
  const back = () => {
    if (current.depth > 0) {
      browser.back();
    } else if (!sameView(current.view, initialView(initialActive))) {
      transition(initialView(initialActive), 'replace');
    } else {
      // Leave the app only at its root, respecting the device and browser.
      browser.back();
    }
  };
  return {
    initialize, transition, onPopState, back,
    getView: () => current.view, getDepth: () => current.depth,
  };
}
