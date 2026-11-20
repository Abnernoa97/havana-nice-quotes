import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const editorRoot=fileURLToPath(new URL('../src/features/editor/',import.meta.url));
const files=(folder)=>readdirSync(folder,{withFileTypes:true}).flatMap(entry=>{
 const full=path.join(folder,entry.name);
 return entry.isDirectory()?files(full):/\.tsx?$/.test(entry.name)?[full]:[];
});
const modules=files(editorRoot);
const moduleSet=new Set(modules);
const source=module=>readFileSync(module,'utf8');
const localDeps=module=>[...source(module).matchAll(/\bfrom\s*['"](\.[^'"]+)['"]/g)]
 .map(match=>path.resolve(path.dirname(module),match[1]))
 .map(base=>[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')]
   .find(candidate=>moduleSet.has(candidate)))
 .filter(Boolean);

test('Editor modules have no circular internal imports, including type-only dependencies',()=>{
 const visiting=new Set(),visited=new Set();
 const visit=(mod,trace)=>{
   if(visiting.has(mod))assert.fail('Editor import cycle: '+[...trace,mod].map(p=>path.relative(editorRoot,p)).join(' -> '));
   if(visited.has(mod))return;
   visiting.add(mod);
   for(const next of localDeps(mod))visit(next,[...trace,mod]);
   visiting.delete(mod);visited.add(mod);
 };
 for(const mod of modules)visit(mod,[]);
 assert.ok(visited.size>=20,'Expected the modular editor to be scanned');
});

test('Canvas presentation modules own no quote state and never import the coordinator',()=>{
 for(const module of modules.filter(p=>p.includes(path.sep+'canvas'+path.sep+'components'+path.sep))){
   const text=source(module);
   assert.doesNotMatch(text,/\buse(State|Reducer|Ref|Effect)\s*\(/,path.basename(module));
   assert.doesNotMatch(text,/\bTemplateCanvasEditor\b|\buseQuoteStore\b|\bfetch\s*\(/,path.basename(module));
 }
});

test('Actions use one EditQuoteField contract and never copy field-signature unions',()=>{
 const shared=source(path.join(editorRoot,'shared','editor-types.ts'));
 assert.match(shared,/export type EditQuoteField = \(key: keyof Quote, value: Quote\[keyof Quote\]\) => void/);
 for(const module of modules.filter(p=>p!==path.join(editorRoot,'shared','editor-types.ts'))){
   assert.doesNotMatch(source(module),/\bedit\s*:\s*\(key\s*:\s*keyof Quote/,path.relative(editorRoot,module));
 }
});
