export interface Lead {
  name: string;
  industry: string;
  location: string;
  whyFit: string;
  website: string;
  sourceLink: string;
}

function getAuth() {
  const token = process.env.CLICKUP_API_TOKEN;
  const listId = process.env.CLICKUP_LIST_ID;
  if (!token) throw new Error("CLICKUP_API_TOKEN is not set");
  if (!listId) throw new Error("CLICKUP_LIST_ID is not set");
  return { token, listId };
}

export async function getExistingTaskNames(): Promise<string[]> {
  const { token, listId } = getAuth();

  const url = new URL(`https://api.clickup.com/api/v2/list/${listId}/task`);
  url.searchParams.set("include_closed", "true");

  const response = await fetch(url.toString(), {
    headers: { Authorization: token },
  });
  if (!response.ok) {
    throw new Error(`ClickUp list-tasks request failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { tasks?: Array<{ name?: string }> };
  return (data.tasks ?? []).map((t) => (t.name ?? "").toLowerCase());
}

export async function createLeadTask(lead: Lead): Promise<{ id: string; url: string }> {
  const { token, listId } = getAuth();

  const description = [
    `**Industry:** ${lead.industry}`,
    `**Location:** ${lead.location}`,
    `**Why it fits:** ${lead.whyFit}`,
    lead.website ? `**Website:** ${lead.website}` : null,
    `**Source:** ${lead.sourceLink}`,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: lead.name,
      description,
      markdown_description: description,
    }),
  });

  if (!response.ok) {
    throw new Error(`ClickUp create-task request failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { id: string; url: string };
  return { id: data.id, url: data.url };
}
