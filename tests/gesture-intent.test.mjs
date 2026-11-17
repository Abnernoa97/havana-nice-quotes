import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyTwoFingerAction,shortestTurnDegrees,snapToOrigin} from '../src/features/templates/gesture-intent.ts';
const src=path=>readFileSync(new URL('../src/'+path,import.meta.url),'utf8');

test('Un pellizco pequeño amplía sin girar; cambios mínimos no hacen nada',()=>{
 assert.equal(classifyTwoFingerAction(150,152,3),'pending');
 assert.equal(classifyTwoFingerAction(150,157,9),'zoom');
 assert.equal(classifyTwoFingerAction(150,145,7),'zoom');
 assert.equal(classifyTwoFingerAction(150,160,26),'zoom');
 assert.equal(classifyTwoFingerAction(15,20,70),'pending');
});
test('Rotar requiere una torsión deliberada, no ruido de dedos',()=>{
 assert.equal(classifyTwoFingerAction(170,171,10),'pending');
 assert.equal(classifyTwoFingerAction(170,171,22),'pending');
 assert.equal(classifyTwoFingerAction(170,171,24),'rotate');
 assert.equal(classifyTwoFingerAction(170,168,-28),'rotate');
 assert.equal(classifyTwoFingerAction(170,182,40),'zoom');
 assert.ok(Math.abs(shortestTurnDegrees(179*Math.PI/180,-179*Math.PI/180)-2)<.001);
});
test('El centrado tiene anclaje estable y no mueve posiciones alejadas',()=>{
 assert.equal(snapToOrigin(.5),0);
 assert.equal(snapToOrigin(-.9),0);
 assert.equal(snapToOrigin(1.8),1.8);
 assert.equal(snapToOrigin(-12.5),-12.5);
});
test('Una sola acción por secuencia: un dedo mueve, dos amplían o giran',()=>{
 const gesture=src('features/templates/useCarolinaGesture.ts');
 assert.match(gesture,/twoFingerAction\.current='pending'/);
 assert.match(gesture,/classifyTwoFingerAction\(b\.distance,now\.distance,turn\)/);
 assert.match(gesture,/mode==='move'\?snapToOrigin/);
 assert.match(gesture,/mode==='zoom'\?b\.transform\.scale\*scale/);
 assert.match(gesture,/mode==='rotate'\?b\.transform\.rotation\+turn/);
 assert.match(gesture,/!pinchUsed\.current && movedDuringPress\.current/);
 assert.match(gesture,/baseline\.current=\{\.\.\.now,transform:/);
});
test('Tocar fuera de página confirma; deslizar o usar más de un dedo no confirma',()=>{
 const canvas=src('features/editor/canvas/TemplateCanvasEditor.tsx');
 assert.match(canvas,/document\.addEventListener\('pointerdown',down,true\)/);
 assert.match(canvas,/document\.addEventListener\('pointermove',move,true\)/);
 assert.match(canvas,/document\.addEventListener\('pointerup',up,true\)/);
 assert.match(canvas,/Math\.hypot\(event\.clientX-original\.x,event\.clientY-original\.y\)>9/);
 assert.match(canvas,/if\(candidate\)\{candidate=null;return;\}/);
 assert.match(canvas,/blockClickUntil\.current=Date\.now\(\)\+650/);
 assert.match(canvas,/clearSelection\(\)/);
});
test('Tipografías, color, tamaño, ancho y alto nunca se muestran simultáneamente',()=>{
 const dock=src('features/editor/texts/TextStyleDock.tsx');
 const canvas=src('features/editor/canvas/TemplateCanvasEditor.tsx');
 assert.match(dock,/\{!tab && <div className="hn-text-dock-switches"/);
 assert.match(dock,/\{tab && \(/);
 assert.match(dock,/aria-label="Volver a herramientas de texto"/);
 assert.match(dock,/onToolChange\(chosen\)/);
 assert.match(canvas,/onToolChange=\{tool=>/);
 assert.match(canvas,/setTransformingId\(null\);setTrashHovered\(false\)/);
 assert.match(canvas,/\{transformingId && !activeTextTool && \(/);
});
