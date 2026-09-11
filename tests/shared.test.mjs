import assert from "node:assert/strict";
import test from "node:test";

import { getJson, HttpError, reasonFor } from "../src/lib/connectors/shared.ts";

test("a provider's structured 400 detail reaches the source status without request secrets", async () => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  let caught;

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        title: "Invalid Request",
        detail: "The start_time parameter is invalid.",
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  console.error = () => {};

  try {
    await getJson("https://api.x.com/2/tweets/search/recent", {
      headers: { Authorization: "Bearer must-never-appear" },
    });
  } catch (error) {
    caught = error;
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  }

  assert.ok(caught instanceof HttpError);
  assert.equal(caught.detail, "The start_time parameter is invalid.");
  assert.equal(reasonFor(caught, false), "The request was rejected: The start_time parameter is invalid.");
  assert.doesNotMatch(reasonFor(caught, false), /must-never-appear/);
});

test("billing errors keep their existing plain-English explanation", () => {
  const error = new HttpError(402, "402 from api.x.com", "Credits are required.");
  assert.equal(reasonFor(error, false), "Payment is required by this source. Check its API credits and billing settings.");
});
