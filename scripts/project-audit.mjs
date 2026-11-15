#!/usr/bin/env node
/**
 * HAVANA NICE Quotes Studio — non-destructive structure audit.
 * No deployment, file writes, network calls, credentials or user data.
 * Run: npm run audit:structure
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignored = new Set(['.git', 'node_modules', 'dist', '.wrangler', '.vite', 'coverage']);
const required = [
  'index.html', 'package.json', 'tsconfig.json', 'vite.config.ts',
  'wrangler.jsonc', 'bun.lock', 'public/manifest.webmanifest', 'public/sw.js',
  'public/icon-192.png', 'public/icon-512.png',
  'src/main.tsx', 'src/app/App.tsx', 'src/shared/styles/index.css',
  'src/features/home/HomeScreen.tsx',
  'src/features/quotes/types.ts', 'src/features/quotes/demo-data.ts',
  'src/features/quotes/QuotesScreen.tsx',
  'src/features/quotes/useQuoteStore.ts',
  'src/features/auth/DeviceGate.tsx', 'src/features/auth/useDeviceAccess.ts',
  'src/features/auth/device-access.css', 'migrations/0002_passwordless_devices.sql',
  'src/features/photos/PhotoBank.tsx', 'src/features/photos/useMediaLibrary.ts',
  'worker/index.ts', 'migrations/0001_quotes.sql',
  'src/features/messages/MessagesScreen.tsx',
  'src/features/client/Proposal.tsx', 'src/features/client/ClientPage.tsx',
  'src/features/editor/QuoteEditorScreen.tsx',
  'src/features/editor/QuoteDesignPanel.tsx',
  'src/features/editor/QuoteDetailsPanel.tsx',
  'src/features/editor/QuotePricingPanel.tsx',
  'src/features/editor/styles/EditorialStyles.tsx',
  'src/features/editor/styles/editorial-styles.css',
  'src/features/magazine/FlipMagazine.tsx',
  'src/features/magazine/flip-magazine.css',
  'src/features/pwa/InstallGuide.tsx', 'src/features/pwa/useInstallPrompt.ts',
  'src/app/WorkspaceChrome.tsx'
];
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  if (ignored.has(entry.name)) return [];
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});
const all = walk(ROOT).map(file => path.relative(ROOT, file).replaceAll(path.sep, '/'));
const fileSet = new Set(all);
const report = { files: all.length, sizeBytes: 0, checks: [], warnings: [], issues: [] };
const check = (description, ok, detail = '') => {
  report.checks.push({ description, ok });
  if (!ok) report.issues.push(detail || description);
};
const existing = required.filter(p => fileSet.has(p));
check('Archivos principales presentes', existing.length === required.length,
  'Faltan: ' + required.filter(p => !fileSet.has(p)).join(', '));

for (const relative of all) {
  const absolute = path.join(ROOT, relative);
  report.sizeBytes += fs.statSync(absolute).size;
}
const resolveImport = (origin, specifier) => {
  const base = path.resolve(path.dirname(path.join(ROOT, origin)), specifier);
  return ['', '.ts', '.tsx', '.js', '.jsx', '.css', '.json',
    '/index.ts', '/index.tsx', '/index.js'].some(extension =>
      fs.existsSync(base + extension) && fs.statSync(base + extension).isFile());
};
for (const relative of all.filter(p => /\.(tsx?|jsx?)$/.test(p))) {
  const text = fs.readFileSync(path.join(ROOT, relative), 'utf8');
  if (text.includes('// @ts-nocheck')) report.warnings.push('TypeScript sin comprobación: ' + relative);
  // Static relative import/export paths; external package imports aren't local files.
  for (const match of text.matchAll(/\b(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"](\.[^'"]+)['"]/g)) {
    if (!resolveImport(relative, match[1]))
      report.issues.push('Importación no encontrada: ' + relative + ' → ' + match[1]);
  }
}
if (fileSet.has('public/manifest.webmanifest')) {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/manifest.webmanifest'), 'utf8'));
    for (const icon of manifest.icons || []) {
      const iconPath = 'public/' + String(icon.src).replace(/^\//, '');
      check('Ícono PWA ' + icon.src, fileSet.has(iconPath), 'No existe ' + iconPath);
    }
  } catch (error) { report.issues.push('Manifiesto PWA inválido: ' + error.message); }
}
if (fileSet.has('src/app/App.tsx')) {
  const app = fs.readFileSync(path.join(ROOT, 'src/app/App.tsx'), 'utf8');
  const storePath = 'src/features/quotes/useQuoteStore.ts';
  const storageCode = fileSet.has(storePath)
    ? fs.readFileSync(path.join(ROOT, storePath), 'utf8') : '';
  const wranglerCode = fileSet.has('wrangler.jsonc')
    ? fs.readFileSync(path.join(ROOT, 'wrangler.jsonc'), 'utf8') : '';
  const workerCode = fileSet.has('worker/index.ts')
    ? fs.readFileSync(path.join(ROOT, 'worker/index.ts'), 'utf8') : '';
  check('Nube privada D1 + R2; guardado local obsoleto eliminado',
    app.includes('useQuoteStore(enabled)') &&
    storageCode.includes("fetch('/api/quotes'") &&
    !storageCode.includes('localStorage') &&
    !fileSet.has('src/features/quotes/storage.ts') &&
    wranglerCode.includes('"havana-nice-quotes-sync"') &&
    wranglerCode.includes('"havana-nice-v2-media"') &&
    workerCode.includes('quotes-studio/photos/') &&
    workerCode.includes('/api/device/activate') &&
    !workerCode.includes('/api/auth/login') &&
    !fileSet.has('src/features/auth/CloudLogin.tsx'),
    'Revisar sincronización cloud, bindings de D1/R2 o código local obsoleto');
  const lines = app.split('\n').length;
  check('App.tsx por debajo de 500 líneas', lines <= 500,
    'App.tsx concentra ' + lines + ' líneas: revisar separación funcional');
}
if (fileSet.has('src/features/magazine/FlipMagazine.tsx')) {
  const flip = fs.readFileSync(path.join(ROOT, 'src/features/magazine/FlipMagazine.tsx'), 'utf8');
  check('Page Flip usa API loadFromHTML', flip.includes('.loadFromHTML('),
    'Revisar el método del lector 3D antes de publicar');
}
if (fileSet.has('wrangler.jsonc')) {
  const wrangler = fs.readFileSync(path.join(ROOT, 'wrangler.jsonc'), 'utf8');
  check('Worker de este proyecto', wrangler.includes('"havana-nice-quotes"'),
    'Revisar el destino del deploy; no intervenir en otros Workers');
}
// Contratos mínimos que protegen decisiones importantes de la demo.
const sourceFiles = all.filter(p => /\.(?:ts|tsx|js|jsx)$/.test(p) && p.startsWith('src/'));
// Detectar módulos nuevos que quedaron abandonados tras una refactorización.
// La ruta de entrada es src/main.tsx; los .d.ts ambientales se incluyen por TypeScript.
// Esto es una verificación conservadora: no elimina archivos automáticamente.
const appSources = all.filter(p =>
  p.startsWith('src/') && /\.(?:tsx?|jsx?|css)$/.test(p) && !p.endsWith('.d.ts'));
const appSourceSet = new Set(appSources);
const reachable = new Set();
const queue = ['src/main.tsx'];
while (queue.length) {
  const origin = queue.pop();
  if (!origin || reachable.has(origin) || !appSourceSet.has(origin)) continue;
  reachable.add(origin);
  const contents = fs.readFileSync(path.join(ROOT, origin), 'utf8');
  // Rutas entrecomilladas: cubre imports, exports y import() dinámico.
  for (const match of contents.matchAll(/['"]([.]{1,2}\/[^'"]+)['"]/g)) {
    const base = path.resolve(path.dirname(path.join(ROOT, origin)), match[1]);
    const candidates = ['', '.ts', '.tsx', '.js', '.jsx', '.css',
      '/index.ts', '/index.tsx', '/index.js'];
    const linked = candidates.map(ext =>
      path.relative(ROOT, base + ext).replaceAll(path.sep, '/'))
      .find(p => appSourceSet.has(p));
    if (linked && !reachable.has(linked)) queue.push(linked);
  }
}
const orphaned = appSources.filter(p => !reachable.has(p));
check('Sin módulos huérfanos en src/', orphaned.length === 0,
  'Módulos sin referencia desde src/main.tsx: ' + orphaned.join(', '));

const unchecked = sourceFiles.filter(p =>
  fs.readFileSync(path.join(ROOT, p), 'utf8').includes('@ts-nocheck'));
check('Sin TypeScript desactivado en src/', unchecked.length === 0,
  'Archivos con @ts-nocheck: ' + unchecked.join(', '));
const originals = ['src/App.tsx', 'src/FlipMagazine.tsx', 'src/EditorialStyles.tsx'];
check('Sin componentes antiguos en la raíz de src', originals.every(p => !fileSet.has(p)),
  'Rutas antiguas todavía activas: ' + originals.filter(p => fileSet.has(p)).join(', '));
const fmtCopies = sourceFiles.flatMap(p => {
  const text = fs.readFileSync(path.join(ROOT, p), 'utf8');
  return [...text.matchAll(/new Intl\.NumberFormat\(/g)].map(() => p);
});
check('Un solo formateador internacional de importes', fmtCopies.length === 1 &&
  fmtCopies[0] === 'src/shared/lib/formatters.ts',
  'Intl.NumberFormat aparece en: ' + fmtCopies.join(', '));
const magazinePath = 'src/features/magazine/FlipMagazine.tsx';
if (fileSet.has(magazinePath)) {
  const magazine = fs.readFileSync(path.join(ROOT, magazinePath), 'utf8');
  check('Parámetros del Page Flip aprobado preservados',
    ['flippingTime: 1080', 'maxShadowOpacity: 0.72', 'showCover: false',
      'usePortrait: true', "flip.loadFromHTML("].every(x => magazine.includes(x)),
    'Revisar pliegue 3D: cambió un parámetro protegido');
}

console.log('HAVANA NICE · Auditoría de estructura (solo lectura)');
console.log('Archivos revisados:', report.files, '· Tamaño:', (report.sizeBytes / 1024).toFixed(1) + ' KiB');
for (const test of report.checks) console.log((test.ok ? '✓ ' : '✗ ') + test.description);
for (const warning of report.warnings) console.log('AVISO:', warning);
for (const issue of report.issues) console.error('ERROR:', issue);
console.log('Resultado:', report.issues.length ? report.issues.length + ' problema(s)' : 'estructura consistente');
if (report.issues.length) process.exitCode = 1;
