import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEvidence, reactionWeight, sourceUrl } from '../src/lib/analysis/evidence.ts';

const items = [
  { id:'video', source:'youtube', kind:'video', title:'Original video title', text:'Context and description', url:'https://www.youtube.com/watch?v=fixture' },
  { id:'a', parentId:'video', source:'youtube', kind:'comment', text:'I like it.\n  Especially the layout!', url:'https://www.youtube.com/watch?v=fixture&lc=a' },
  { id:'b', parentId:'video', source:'youtube', kind:'comment', text:'The layout feels good.', url:'https://www.youtube.com/watch?v=fixture&lc=b' },
  { id:'post', source:'x', kind:'post', text:'Connection failed again.', url:'https://x.com/i/status/fixture' },
];
const classifications = [{ref:1,sentiment:'positive'},{ref:2,sentiment:'positive'},{ref:3,sentiment:'negative'}];
test('grouping preserves the actual title, parent link, verbatim comments and individual sentiment', () => {
  const result=buildEvidence(items,classifications,[]);
  const [video]=result.threadsFor('youtube');
  assert.equal(video.title,'Original video title');
  assert.equal(video.url,items[0].url);
  assert.equal(video.comments[0].text,items[1].text);
  assert.deepEqual(video.comments.map(c=>c.sentiment),['positive','positive']);
  assert.equal(result.threadsFor('x')[0].comments[0].sentiment,'negative');
  assert.deepEqual(result.splits.youtube,{positive:2,neutral:0,negative:0});
  assert.deepEqual(result.split,{positive:2,neutral:0,negative:1});
  assert.deepEqual(result.relevant,{youtube:2,x:1,reddit:0});
});
test('reactions weigh in on a log scale, never below one, and a viral entry counts for a handful, not a crowd', () => {
  assert.equal(reactionWeight(undefined),1);
  assert.equal(reactionWeight(0),1);
  assert.equal(reactionWeight(-40),1);
  for(const [reactions,weight] of [[9,2],[999,4],[9999,5]]) assert.ok(Math.abs(reactionWeight(reactions)-weight)<1e-9,`${reactions} reactions weigh ${weight}`);
  const weighted=buildEvidence([{...items[3],id:'viral',engagement:100000},{...items[3],id:'q1',text:'One'},{...items[3],id:'q2',text:'Two'},{...items[3],id:'q3',text:'Three'}],
    [{ref:0,sentiment:'negative'},{ref:1,sentiment:'positive'},{ref:2,sentiment:'positive'},{ref:3,sentiment:'positive'}],[]);
  assert.ok(weighted.split.positive<weighted.split.negative);
  assert.ok(weighted.split.negative<weighted.split.positive*3);
  assert.equal(weighted.relevant.x,4);
});
test('recurring opinions require distinct relevant evidence, deduplicate references and exclude invented IDs', () => {
  const drafts=[{sentence:'The layout feels good.',sentiment:'positive',refs:[1,1,2,999,0]}, {sentence:'Unsupported claim.',sentiment:'negative',refs:[3]}, {sentence:'The layout feels good.',sentiment:'positive',refs:[1,2]}];
  const result=buildEvidence(items,[...classifications,{ref:999,sentiment:'negative'}],drafts);
  assert.equal(result.opinions.length,1);
  assert.deepEqual(result.opinions[0].evidenceIds,['youtube:video']);
  const duplicate=[...items,{...items[1],id:'copy'}];
  assert.equal(buildEvidence(duplicate,[...classifications,{ref:4,sentiment:'positive'}],[{sentence:'Copied.',sentiment:'positive',refs:[1,4]}]).opinions.length,0);
});
test('irrelevant and unclassified evidence never establishes a recurring opinion or an invented sentiment', () => {
  const result=buildEvidence(items,[{ref:1,sentiment:'irrelevant'}],[{sentence:'Unsupported.',sentiment:'positive',refs:[1,2]}]);
  assert.equal(result.opinions.length,0);
  assert.equal(result.threadsFor('youtube')[0].comments.length,1);
  assert.equal(result.threadsFor('youtube')[0].comments[0].sentiment,undefined);
});
test('source URL validation rejects script schemes, credentials, lookalike domains and cross-platform URLs', () => {
  for(const url of ['javascript:alert(1)','https://youtube.com.evil.test/video','https://user:password@youtube.com/watch','https://x.com/i/status/a','http://youtube.com/watch']) assert.equal(sourceUrl(url,'youtube'),undefined);
  assert.equal(sourceUrl('https://www.youtube.com/watch?v=a','youtube'),'https://www.youtube.com/watch?v=a');
  const altered=items.map(it=>it.id==='video'?{...it,url:'javascript:alert(1)'}:it);
  assert.equal(buildEvidence(altered,classifications,[]).threadsFor('youtube')[0].url,undefined);
});
test('parent references cannot mix platforms and all grouped posts remain available after the first five', () => {
  const sample=Array.from({length:8},(_,i)=>({id:`p${i}`,kind:'post',source:'x',text:`Different post ${i}`,parentId:'video',url:`https://x.com/i/status/${i}`}));
  const result=buildEvidence([items[0],...sample],sample.map((_,i)=>({ref:i+1,sentiment:'neutral'})),[],[8]);
  assert.equal(result.threadsFor('x').length,8);
  assert.equal(result.threadsFor('x')[0].title,'Different post 7');
});
