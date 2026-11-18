import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('The final chat page locks page gestures, keeps a back arrow and uses exactly one interactive composer',()=>{
 const flip=source('src/features/magazine/FlipMagazine.tsx');
 const carolina=source('src/features/templates/CarolinaTemplate.tsx');
 const styles=source('src/features/magazine/flip-magazine.css');
 assert.match(flip,/const finalChat=page===total-1&&chatPage/);
 assert.match(flip,/hn-magazine-chat-lock/);
 assert.match(flip,/changePage\('prev'\)/);
 assert.match(flip,/chatPage&&!finalChat/);
 assert.match(flip,/<CarolinaBlankPage item=\{item\} page=\{selectedPage\} staticChat\/>/);
 assert.match(carolina,/pageKind\(item\.designLayout,page\)==='chat'&&!staticChat/);
 assert.match(styles,/\.hn-magazine-chat-lock/);
});
test('iPhone and Android audio share a common responsive player and compatible upload path',()=>{
 const panel=source('src/features/quotes/QuoteChatPanel.tsx');
 const inbox=source('src/features/messages/MessagesScreen.tsx');
 const audio=source('src/features/quotes/voice-audio.ts');
 const server=source('worker/quote-chat.ts');
 assert.match(panel,/compatibleVoice\(blob\)/);
 assert.match(inbox,/compatibleVoice\(blob\)/);
 assert.match(audio,/audio\/mp4/);
 assert.match(audio,/audio\/wav/);
 assert.match(audio,/decodeAudioData/);
 assert.match(panel,/<VoiceNotePlayer/);
 assert.match(inbox,/<VoiceNotePlayer/);
 assert.match(server,/'Accept-Ranges':'bytes'/);
 assert.match(server,/compatibleAction/);
});
test('Open and handoff counts are distinguished from WhatsApp receipt, and sent tab is last',()=>{
 const controller=source('worker/share-analytics.ts');
 const link=source('src/features/quotes/QuoteShareDialog.tsx');
 const app=source('src/app/App.tsx');
 const model=source('src/features/quotes/model.ts');
 const client=source('src/features/client/PublicQuotePage.tsx');
 const list=source('src/features/quotes/QuotesScreen.tsx');
 assert.match(controller,/INSERT OR IGNORE INTO quote_share_visits/);
 assert.match(controller,/INSERT OR IGNORE INTO quote_share_events/);
 assert.match(link,/handoff\('whatsapp'\)/);
 assert.match(link,/handoff\('copy'\)/);
 assert.match(client,/visitId/);
 assert.match(app,/shareCounts=\{shareCounts\}/);
 assert.match(list,/dispositivos/);
 assert.match(model,/QUOTE_FILTERS=\['Todas','Borrador','Listo para enviar','Enviadas'\]/);
});
test('The visible video gets eager preload, and blocked autoplay shows a manual play action',()=>{
 const flip=source('src/features/magazine/FlipMagazine.tsx');
 assert.match(flip,/media\.preload='auto'/);
 assert.match(flip,/media\.playsInline=true/);
 assert.match(flip,/media\.play\(\)/);
 assert.match(flip,/Play video/);
});
