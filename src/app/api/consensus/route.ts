import { NextResponse } from "next/server";
import { EXAMPLE_SUBJECTS, findSample } from "@/lib/subjects";
import type { ConsensusResponse } from "@/lib/types";

/* POST /api/consensus  { subject: string }

   Version one answers from labelled sample data only. This route exists so
   the browser already talks to the server the way it will when AI analysis
   and the source connectors arrive: the client never sees a key, and the
   response shape does not change between the sample and the real thing. */

function readSubject(body: unknown): string {
  if (typeof body !== "object" || body === null) return "";
  const value = (body as { subject?: unknown }).subject;
  return typeof value === "string" ? value.trim().slice(0, 200) : "";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be JSON." }, { status: 400 });
  }

  const subject = readSubject(body);
  if (!subject) {
    return NextResponse.json({ error: "Enter a subject to search for." }, { status: 400 });
  }

  const sample = findSample(subject);
  const response: ConsensusResponse = sample
    ? { kind: "result", result: sample }
    : {
        kind: "no-live-search",
        subject,
        message:
          "Version one has no live connection to YouTube, X or Reddit yet, so there is nothing to sample for this subject. The example subjects below show how a finished answer will look.",
        examples: EXAMPLE_SUBJECTS,
      };

  return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } });
}
