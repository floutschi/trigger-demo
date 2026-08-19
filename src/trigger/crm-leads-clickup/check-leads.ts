import { schedules } from "@trigger.dev/sdk";
import { searchGoogle, type SerpResult } from "./serpapi.js";
import { qualifyLeads } from "./qualify.js";
import { getExistingTaskNames } from "./clickup.js";
import { createLeadTask } from "./create-lead-task.js";
import { SEARCH_QUERIES } from "./config.js";

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export const checkLeads = schedules.task({
  id: "crm-leads-check",
  cron: "0 6 * * 1", // Monday 8am Europe/Vienna
  run: async () => {
    for (const key of ["SERPAPI_KEY", "GEMINI_API_KEY", "CLICKUP_API_TOKEN", "CLICKUP_LIST_ID"]) {
      if (!process.env[key]) throw new Error(`${key} is not set`);
    }

    const allResults: SerpResult[] = [];
    for (const query of SEARCH_QUERIES) {
      const results = await searchGoogle(query);
      allResults.push(...results);
    }
    console.log(`SerpApi returned ${allResults.length} raw results across ${SEARCH_QUERIES.length} queries`);

    const candidates = await qualifyLeads(allResults);
    console.log(`Gemini qualified ${candidates.length} candidate leads`);

    const existingNames = await getExistingTaskNames();
    const newLeads = candidates.filter((lead) => !existingNames.includes(lead.name.toLowerCase()));
    console.log(`${newLeads.length} of ${candidates.length} candidates are new (not already in ClickUp)`);

    const weekStamp = new Date().toISOString().slice(0, 10);
    for (const lead of newLeads) {
      await createLeadTask.trigger(lead, {
        idempotencyKey: `lead-${slug(lead.name)}-${weekStamp}`,
      });
    }

    return {
      rawResults: allResults.length,
      qualified: candidates.length,
      created: newLeads.length,
      skippedDuplicates: candidates.length - newLeads.length,
    };
  },
});
