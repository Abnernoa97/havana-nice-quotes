import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyTwoFingerAction,promoteZoomToRotation,shortestTurnDegrees,snapToOrigin,wrapRotation} from '../src/features/templates/gesture-intent.ts';
const src=path=>readFileSync(new URL('../src/'+path,import.meta.url),'utf8');
const canvasSource=()=>['TemplateCanvasEditor.tsx','components/CanvasPageToolbar.tsx','components/CanvasPageContent.tsx','interactions/createCanvasTextInteraction.ts','media/canvasPhotoUrl.ts','components/CanvasPagePager.tsx','hooks/useCanvasPageActions.ts','hooks/useCanvasTapConfirmation.ts'].map(p=>src('features/editor/canvas/'+p)).join('\n');

test('Un pellizco pequeño amplía sin girar; cambios mínimos no hacen nada',()=>{
 assert.equal(classifyTwoFingerAction(150,152,3),'pending');
 assert.equal(classifyTwoFingerAction(150,159,9),'zoom');
 assert.equal(classifyTwoFingerAction(150,140,7),'zoom');
 assert.equal(classifyTwoFingerAction(150,160,26),'rotate');
 assert.equal(classifyTwoFingerAction(15,20,70),'pending');
});
test('Rotar requiere una torsión deliberada, no ruido de dedos',()=>{
 assert.equal(classifyTwoFingerAction(170,171,10),'pending');
 assert.equal(classifyTwoFingerAction(170,171,22),'rotate');
 assert.equal(classifyTwoFingerAction(170,171,24),'rotate');
 assert.equal(classifyTwoFingerAction(170,168,-28),'rotate');
 assert.equal(classifyTwoFingerAction(170,182,40),'rotate');
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
 assert.match(gesture,/wrapRotation\(b\.transform\.rotation\+cumulativeTurn\.current\)/);
 assert.match(gesture,/!pinchUsed\.current && movedDuringPress\.current/);
 assert.match(gesture,/cumulativeTurn\.current\+=shortestTurnDegrees\(previous,now\.angle\)/);
 assert.match(gesture,/promoteZoomToRotation\(b\.distance,now\.distance,turn\)/);
 assert.match(gesture,/wrapRotation\(b\.transform\.rotation\+cumulativeTurn\.current\)/);
});
test('Tocar fuera de página confirma; deslizar o usar más de un dedo no confirma',()=>{
 const canvas=canvasSource();
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
 const canvas=canvasSource();
 assert.match(dock,/\{!tab && <div className="hn-text-dock-switches"/);
 assert.match(dock,/\{tab && \(/);
 assert.match(dock,/aria-label="Volver a herramientas de texto"/);
 assert.match(dock,/onToolChange\(chosen\)/);
 assert.match(canvas,/onToolChange=\{tool=>/);
 assert.match(canvas,/setTransformingId\(null\);setTrashHovered\(false\)/);
 assert.match(canvas,/\{transformingId && !activeTextTool && \(/);
});

test('Giro excesivo domina aun si varía la distancia entre los dedos',()=>{
 assert.equal(classifyTwoFingerAction(150,159,5),'zoom');
 assert.equal(classifyTwoFingerAction(150,180,30),'rotate');
 assert.equal(classifyTwoFingerAction(180,240,65),'rotate');
 assert.equal(classifyTwoFingerAction(150,160,-50),'rotate');
 assert.equal(classifyTwoFingerAction(150,151,13),'pending');
});
test('Un zoom reconocido puede pasar a giro, conservando el zoom anterior',()=>{
 assert.equal(promoteZoomToRotation(150,159,5),false);
 assert.equal(promoteZoomToRotation(150,170,17),false);
 assert.equal(promoteZoomToRotation(150,170,25),true);
 assert.equal(promoteZoomToRotation(150,200,5),false);
 assert.equal(promoteZoomToRotation(160,210,60),true);
});
test('Rotaciones largas y cruce ±180 continúan sin regresos repentinos',()=>{
 const deg=(x)=>x*Math.PI/180;
 const samples=[170,179,-178,-140,-90,0,80];
 let total=0;
 for(let i=1;i<samples.length;i++)
   total+=shortestTurnDegrees(deg(samples[i-1]),deg(samples[i]));
 assert.ok(Math.abs(total-270)<.001);
 assert.equal(wrapRotation(190),-170);
 assert.equal(wrapRotation(-190),170);
 assert.equal(wrapRotation(720),0);
});
