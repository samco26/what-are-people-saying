import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEvidence, sourceUrl } from '../src/lib/analysis/evidence.ts';

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
  assert.equal(result.threadsFor('youtube').length,0);
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

test('conflicting labels, copied text and opposite-sentiment support are excluded', () => {
  const result = buildEvidence([...items, {...items[1], id:'copy'}], [...classifications, {ref:4,sentiment:'positive'}], [{sentence:'Everyone hates the layout.',sentiment:'negative',refs:[1,2]}]);
  assert.equal(result.opinions.length,0);
  assert.deepEqual(result.counts,{positive:2,neutral:0,negative:1});
  assert.equal(result.acceptedRefs.length,3);
  const conflict = buildEvidence(items,[...classifications,{ref:1,sentiment:'negative'}],[]);
  assert.equal(conflict.threadsFor('youtube')[0].comments.length,1);
});
test('opinion references retain exact comments and preferred quotes are actually shown first', () => {
  const result = buildEvidence(items,classifications,[{sentence:'The layout feels good.',sentiment:'positive',refs:[1,2]}],[2]);
  assert.deepEqual(result.opinions[0].evidenceCommentIds,['youtube:a','youtube:b']);
  assert.equal(result.threadsFor('youtube')[0].comments[0].id,'b');
});


test('source excerpts are selected from accepted theme support without AI preferred references', () => {
  const result=buildEvidence(items,classifications,[{sentence:'The layout is liked.',sentiment:'positive',refs:[2,1]}]);
  assert.deepEqual(result.threadsFor('youtube')[0].comments.map(c=>c.id),['b','a']);
  assert.deepEqual(result.counts,{positive:2,neutral:0,negative:1});
});
