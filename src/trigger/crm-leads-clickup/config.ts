// Editable ICP snapshot. Source of truth is the Notion page "Positioning & USP":
// https://app.notion.com/p/35bad654e80e815aa367e728cac71fc2
// Update this text by hand whenever that page changes — it's sent to Gemini as
// the qualification criteria in qualify.ts.
export const ICP_TEXT = `
Primary — The Overwhelmed Solo Operator
Who: Coaches, consultants, creative freelancers, therapists, photographers, architects,
independent advisors, kleine Gastronomiebetriebe (Cafés, kleine Restaurants, Frühstückspensionen)
Size: 1-3 people
Geography: DACH region — Tyrol, Bavaria, Vorarlberg, Salzburg, broader Austria and Southern Germany; remote-first
Budget: EUR 500-2,000 per project
Pain: Everything lives in notebooks, email, and Excel. No overview. No system.

Secondary — The Small Team Without IT
Who: Small agencies, family offices, local service businesses, Hotels und größere
Gastronomiebetriebe mit mehreren Abteilungen, small NGOs
Size: 3-15 people
Geography: DACH region, remote-capable
Budget: EUR 1,500-5,000 per project + potential retainer
Pain: Tools that don't talk to each other, manual reports, no central data, unclear responsibilities

OUT OF SCOPE — never include: enterprises, large agencies, tech companies, startups with dev teams.
`.trim();

// General web search queries (deliberately not `site:` directory queries —
// those tend to return category listing pages instead of individual businesses).
// Kept short to stay well under SerpApi's free-tier ~100 searches/month.
export const SEARCH_QUERIES = [
  "Coach Beratung Selbständig Tirol Neueröffnung",
  "Fotograf Fotostudio Tirol Website",
  "Therapeut Praxis neu eröffnet Tirol",
  "Architekturbüro klein Tirol Team",
  "Café Restaurant Tirol neu eröffnet inhabergeführt",
  "kleines Hotel Gasthof familiengeführt Tirol",
];

// Cheap pre-filter before spending Gemini quota: skip obvious non-leads outright.
// Out-of-scope business types, plus content pages (courses, articles, associations)
// that keyword search on business terms tends to also surface.
export const EXCLUDE_KEYWORDS = [
  "gmbh & co kg", "konzern", "holding", "franchise", "filiale", "kette",
  "ag ", " ag,", "enterprise", "startup", "venture capital",
  "ausbildung", "kurs ", "seminar", "workshop", "webinar",
  "verband", "dachverband", "innung", "kammer",
  "wifi.at", "gewerbeanmeldung",
];

// Directory/listing-page patterns to skip (category browse pages, not individual businesses).
export const LISTING_PAGE_PATTERNS: RegExp[] = [
  /seite\s+\d+\s*\/\s*\d+/i, // "Seite 1/19"
  /\/gelbe-seiten\/[^/]+\/[^/]+\/?$/i, // herold.at category index
  /\/branchenbuch\//i,
  /welocally\.at\/.*\/category\//i,
  /standort-tirol\.at\/cluster\//i,
];

export const MAX_LEADS_PER_RUN = 10;
export const MIN_LEADS_PER_RUN = 5;
