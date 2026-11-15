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
  'wrangler.jsonc', 'public/manifest.webmanifest', 'public/sw.js',
  'public/icon-192.png', 'public/icon-512.png',
  'src/main.tsx', 'src/App.tsx', 'src/index.css',
  'src/EditorialStyles.tsx', 'src/editorial-styles.css',
  'src/FlipMagazine.tsx', 'src/flip-magazine.css'
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
if (fileSet.has('src/App.tsx')) {
  const app = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8');
  check('Clave de guardado preservada', app.includes('hn_quotes_visual_v1'),
    'Revisar la compatibilidad del almacenamiento de cotizaciones');
  const lines = app.split('\n').length;
  if (lines > 500) report.warnings.push('App.tsx concentra ' + lines + ' líneas; separar gradualmente');
}
if (fileSet.has('src/FlipMagazine.tsx')) {
  const flip = fs.readFileSync(path.join(ROOT, 'src/FlipMagazine.tsx'), 'utf8');
  check('Page Flip usa API loadFromHTML', flip.includes('.loadFromHTML('),
    'Revisar el método del lector 3D antes de publicar');
}
if (fileSet.has('wrangler.jsonc')) {
  const wrangler = fs.readFileSync(path.join(ROOT, 'wrangler.jsonc'), 'utf8');
  check('Worker de este proyecto', wrangler.includes('"havana-nice-quotes"'),
    'Revisar el destino del deploy; no intervenir en otros Workers');
}
console.log('HAVANA NICE · Auditoría de estructura (solo lectura)');
console.log('Archivos revisados:', report.files, '· Tamaño:', (report.sizeBytes / 1024).toFixed(1) + ' KiB');
for (const test of report.checks) console.log((test.ok ? '✓ ' : '✗ ') + test.description);
for (const warning of report.warnings) console.log('AVISO:', warning);
for (const issue of report.issues) console.error('ERROR:', issue);
console.log('Resultado:', report.issues.length ? report.issues.length + ' problema(s)' : 'estructura consistente');
if (report.issues.length) process.exitCode = 1;
