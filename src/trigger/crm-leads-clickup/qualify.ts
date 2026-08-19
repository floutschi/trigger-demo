import type { SerpResult } from "./serpapi.js";
import type { Lead } from "./clickup.js";
import { ICP_TEXT, MAX_LEADS_PER_RUN, EXCLUDE_KEYWORDS, LISTING_PAGE_PATTERNS } from "./config.js";

function isListingPage(result: SerpResult): boolean {
  return LISTING_PAGE_PATTERNS.some((pattern) => pattern.test(result.link) || pattern.test(result.title));
}

function isObviouslyOutOfScope(result: SerpResult): boolean {
  const lower = `${result.title} ${result.snippet}`.toLowerCase();
  return EXCLUDE_KEYWORDS.some((kw) => lower.includes(kw));
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fenced ? fenced[1] : text).trim();
}

// Cheap deterministic pre-filter (free, no quota) followed by a Gemini pass
// (free tier) that does the actual semantic judgment: is this really a
// business matching the ICP, not a course/article/association/directory page?
export async function qualifyLeads(results: SerpResult[]): Promise<Lead[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const candidates = results.filter((r) => !isListingPage(r) && !isObviouslyOutOfScope(r));
  if (candidates.length === 0) return [];

  const resultsBlock = candidates
    .map((r, i) => `${i + 1}. ${r.title}\n${r.link}\n${r.snippet}`)
    .join("\n\n");

  const prompt = `You are screening raw Google search results to find qualified sales leads for a CRM/customer-journey consulting business.

TARGET PROFILE (only include businesses plausibly matching this):
${ICP_TEXT}

SEARCH RESULTS:
${resultsBlock}

Pick at most ${MAX_LEADS_PER_RUN} results that represent an actual individual business (not a directory/aggregator page, not a training course or "Ausbildung", not a blog article, not an industry association, not a listing/category page). Skip anything that isn't clearly a real, currently operating business matching the target profile. Do not invent details not present or reasonably inferable from the title/snippet.

Respond with ONLY a JSON array, no other text, each item shaped exactly like:
{"name": string, "industry": string, "location": string, "whyFit": string, "website": string, "sourceLink": string}

If nothing qualifies, respond with an empty array: []`;

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API request failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";

  const parsed = JSON.parse(extractJson(text)) as Lead[];
  return parsed;
}
