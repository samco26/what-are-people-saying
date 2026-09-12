import { test } from "node:test";
import assert from "node:assert/strict";
import { starRating, rawStars } from "../src/lib/stars.ts";

test("the anchors pin approval to the public review thresholds", () => {
  assert.equal(rawStars(0), 1);
  assert.equal(rawStars(0.15), 1);
  assert.equal(rawStars(0.30), 2);
  assert.equal(rawStars(0.50), 3);
  assert.equal(rawStars(0.60), 3.5);
  assert.equal(rawStars(0.75), 4);
  assert.equal(rawStars(0.90), 4.5);
  assert.equal(rawStars(1), 5);
  assert.ok(rawStars(0.675) > 3.5 && rawStars(0.675) < 4);
});

test("neutral posts are excluded from approval and only pull toward 3 once they dominate", () => {
  const large = 400;
  const noNeutral = starRating({ positive: 0.6, neutral: 0, negative: 0.4 }, large);
  const someNeutral = starRating({ positive: 0.36, neutral: 0.4, negative: 0.24 }, large);
  assert.equal(noNeutral.approval, 0.6);
  assert.equal(someNeutral.approval, 0.6);
  assert.equal(noNeutral.stars, someNeutral.stars);
  const mostlyNeutral = starRating({ positive: 0.27, neutral: 0.7, negative: 0.03 }, large);
  assert.ok(mostlyNeutral.stars < starRating({ positive: 0.9, neutral: 0, negative: 0.1 }, large).stars);
  assert.ok(mostlyNeutral.stars > 3);
});

test("small samples sit nearer three, and volume alone never raises a rating", () => {
  const split = { positive: 0.9, neutral: 0.05, negative: 0.05 };
  const twelve = starRating(split, 12);
  const hundreds = starRating(split, 400);
  assert.ok(twelve.stars < hundreds.stars);
  assert.ok(twelve.stars > 3);
  const even = { positive: 0.5, neutral: 0, negative: 0.5 };
  assert.equal(starRating(even, 20).stars, 3);
  assert.equal(starRating(even, 4000).stars, 3);
});

test("a flop reads as a flop and an empty or all-neutral split is a plain 3", () => {
  assert.ok(starRating({ positive: 0.25, neutral: 0.4, negative: 0.35 }, 150).stars < 3);
  assert.deepEqual(starRating({ positive: 0, neutral: 0, negative: 0 }, 50), { stars: 3, approval: 0 });
  assert.deepEqual(starRating({ positive: 0, neutral: 1, negative: 0 }, 50), { stars: 3, approval: 0 });
  const worked = starRating({ positive: 0.71, neutral: 0.13, negative: 0.16 }, 210);
  assert.equal(Math.round(worked.approval * 100), 82);
  assert.equal(worked.stars, 4.2);
});
