import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectAdaptive, monthsBefore } from '../src/lib/connectors/adaptive.ts';
import { youtube } from '../src/lib/connectors/youtube.ts';

const to = new Date('2026-09-12T00:00:00Z');
const opinion = (id, source = 'youtube') => ({ id, source, kind:'comment', text:'Fictional test opinion' });
const batch = (items, expandable = ['youtube']) => ({ items, expandable, statuses:[{source:'youtube',availability:items.length?'partial':'unavailable',itemsAnalysed:items.length}] });

test('50 opinions stop after three months; one calendar window reaches analysis', async () => {
 let calls=0;
 const result=await collectAdaptive('test',['youtube'],to,async(sources,opts)=>{
  calls++; assert.equal(opts.from.toISOString(),'2026-06-12T00:00:00.000Z');
  return batch(Array.from({length:50},(_,i)=>opinion(String(i))));
 });
 assert.equal(calls,1); assert.equal(result.window.months,3);
});

test('an independent X expansion reaches the answer window even with abundant YouTube evidence', async () => {
 const result = await collectAdaptive('test', ['youtube', 'x'], to, async () => ({
  items: [...Array.from({length:50}, (_,i)=>opinion(String(i))), opinion('older-x', 'x')],
  expandable: ['youtube'],
  statuses: [
   {source:'youtube', availability:'ok', itemsAnalysed:50},
   {source:'x', availability:'partial', itemsAnalysed:1, window:{from:monthsBefore(to,36).toISOString(),to:to.toISOString(),months:36}},
  ],
 }));
 assert.equal(result.window.months,36);
 assert.equal(result.window.from,'2023-09-12T00:00:00.000Z');
 assert.equal(result.statuses.find(s=>s.source==='x').window.months,36);
});

test('sparse results expand, preserve previous opinions and deduplicate', async () => {
 const windows=[]; let firstMemo;
 const result=await collectAdaptive('test',['youtube'],to,async(sources,opts)=>{
  windows.push(opts.from.toISOString());
  firstMemo ??= opts.memo; assert.equal(firstMemo,opts.memo);
  if(windows.length===1)return batch(Array.from({length:10},(_,i)=>opinion(String(i))));
  assert.equal(opts.previousItems.length,10);
  return batch(Array.from({length:50},(_,i)=>opinion(String(i))));
 });
 assert.deepEqual(windows,['2026-06-12T00:00:00.000Z','2025-09-12T00:00:00.000Z']);
 assert.equal(result.items.length,50); assert.equal(result.window.months,12);
 assert.equal(result.statuses[0].itemsAnalysed,50);
});

test('empty coverage reaches three years and stops; X and access failures are not retried', async () => {
 const calls=[];
 const result=await collectAdaptive('test',['youtube','x','reddit'],to,async(sources,opts)=>{
  calls.push({sources,from:opts.from.toISOString()});
  const out=batch([]);
  if(calls.length===1)out.statuses.push({source:'x',availability:'unavailable',itemsAnalysed:0,note:'Payment required.'},{source:'reddit',availability:'unavailable',itemsAnalysed:0,note:'Not connected.'});
  return out;
 });
 assert.equal(calls.length,3);
 assert.deepEqual(calls[1].sources,['youtube']); assert.deepEqual(calls[2].sources,['youtube']);
 assert.equal(result.window.months,36); assert.equal(result.window.from,'2023-09-12T00:00:00.000Z');
 assert.equal(result.statuses.find(s=>s.source==='x').note,'Payment required.');
});

test('a later source failure retains evidence collected earlier', async () => {
 let calls=0;
 const result=await collectAdaptive('test',['youtube'],to,async()=>++calls===1?batch([opinion('kept')]):batch([],[]));
 assert.equal(result.items.length,1);assert.equal(result.statuses[0].availability,'partial');
});

test('calendar windows clamp leap days and month ends',()=>{
 assert.equal(monthsBefore(new Date('2024-02-29T10:30:00Z'),12).toISOString(),'2023-02-28T10:30:00.000Z');
 assert.equal(monthsBefore(new Date('2026-05-31T10:30:00Z'),3).toISOString(),'2026-02-28T10:30:00.000Z');
});

test('older videos retain recent comments and expansion reuses fetches with a 30-comment cap',async()=>{
 const original=globalThis.fetch;let calls=0;
 const comments=(date,prefix,n)=>({items:Array.from({length:n},(_,i)=>({snippet:{topLevelComment:{id:`${prefix}${i}`,snippet:{textOriginal:'Fictional opinion',publishedAt:date}}}}))});
 globalThis.fetch=async input=>{
  calls++;const url=new URL(input);
  if(url.pathname.endsWith('/search')){
   assert.equal(url.searchParams.has('publishedAfter'),false);
   return Response.json({items:[{id:{videoId:'old'},snippet:{title:'Fictional old video',publishedAt:'2018-01-01T00:00:00Z'}}]});
  }
  return Response.json(url.searchParams.get('order')==='time'?comments('2026-08-01T00:00:00Z','recent',5):comments('2025-11-01T00:00:00Z','old',30));
 };
 try{
  const memo=new Map();const options={subject:'test',to,from:monthsBefore(to,3),memo,signal:new AbortController().signal};
  const initial=await youtube.collect(options);
  assert.equal(initial.status.itemsAnalysed,5);assert.equal(calls,3);
  const expanded=await youtube.collect({...options,from:monthsBefore(to,12),previousItems:initial.items});
  assert.equal(calls,3);assert.equal(expanded.status.itemsAnalysed,30);
  for(const item of initial.items)assert.ok(expanded.items.some(next=>next.id===item.id));
 }finally{globalThis.fetch=original;}
});
