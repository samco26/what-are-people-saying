import { test } from "node:test";
import assert from "node:assert/strict";
import { starRating, rawStars } from "../src/lib/stars.ts";
import { sentimentVerdict } from "../src/lib/sentiment.ts";

test("stars are a transparent linear sentiment scale with no sample-size inflation", () => {
  assert.equal(rawStars(0),1); assert.equal(rawStars(0.5),3); assert.equal(rawStars(1),5);
  const split = {positive:6,neutral:2,negative:2};
  assert.equal(starRating(split,10).stars,3.8);
  assert.deepEqual(starRating(split,10),starRating(split,1000));
});
test("no opinions or only neutral assessments do not invent a review rating", () => {
  for (const split of [{positive:0,neutral:0,negative:0},{positive:0,neutral:10,negative:0},{positive:NaN,neutral:0,negative:Infinity}]) assert.equal(starRating(split,10),undefined);
  assert.equal(starRating({positive:1,neutral:0,negative:0},0),undefined);
});
test("mixed assessments weigh at the midpoint; stars and verdict share the same balance", () => {
  const cases = [ [{positive:8,neutral:1,negative:1},'positive',4.4], [{positive:1,neutral:8,negative:1},'mixed',3], [{positive:1,neutral:1,negative:8},'negative',1.6] ];
  for (const [split, verdict, stars] of cases) {
    assert.equal(sentimentVerdict(split),verdict); assert.equal(starRating(split,10).stars,stars);
  }
});
