import { task } from "@trigger.dev/sdk";
import { createLeadTask as createClickUpTask, type Lead } from "./clickup.js";

export const createLeadTask = task({
  id: "crm-leads-create-clickup-task",
  run: async (payload: Lead) => {
    const result = await createClickUpTask(payload);
    console.log(`Created ClickUp task for "${payload.name}": ${result.url}`);
    return result;
  },
});
