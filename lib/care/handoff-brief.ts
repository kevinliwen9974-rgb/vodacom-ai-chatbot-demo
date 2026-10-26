export type BriefTurn = {
  role: string;
  text: string;
};

export type AgentBriefing = {
  summary: string;
  requestedAction: string;
  topic: "sim" | "billing" | "coverage" | "device" | "topup" | "generic";
};

function detectTopic(issue: string, turns: BriefTurn[]): AgentBriefing["topic"] {
  const blob = `${issue} ${turns.map((t) => t.text).join(" ")}`.toLowerCase();
  if (
    /\b(sim|kyc|puk|stolen|lost (my )?(sim|phone)|replace (my )?sim|suspend)\b/.test(
      blob,
    )
  ) {
    return "sim";
  }
  if (/\b(bill|invoice|statement|lte 120|charges|payment due)\b/.test(blob)) {
    return "billing";
  }
  if (/\b(coverage|5g|fibre|fiber|check (my )?address)\b/.test(blob)) {
    return "coverage";
  }
  if (/\b(huawei|y74|device deal|handset|nova)\b/.test(blob)) {
    return "device";
  }
  if (/\b(bundle|top-?up|tiktok|whatsapp|airtime|data pack)\b/.test(blob)) {
    return "topup";
  }
  return "generic";
}

const ACTIONS: Record<AgentBriefing["topic"], string> = {
  sim: "Complete SIM self-care. Confirm identity and arrange replacement, suspension, or a store visit.",
  billing: "Walk through the latest invoice, explain charges, and help with payment or a plan change if asked.",
  coverage:
    "Finish the coverage check. If the assistant could not confirm, use Vodacom Coverage Map and advise on 5G, LTE, or Fibre.",
  device:
    "Continue the HUAWEI nova 15 Max contract conversation. Do not mix in data-bundle upsell.",
  topup: "Help the customer pick a once-off data bundle and complete top-up on the shop page.",
  generic: "Pick up from the last customer message and resolve the request.",
};

const TOPIC_LABEL: Record<AgentBriefing["topic"], string> = {
  sim: "SIM self-care",
  billing: "billing",
  coverage: "coverage check",
  device: "device upgrade",
  topup: "data top-up",
  generic: "general care",
};

export function buildAgentBriefing(input: {
  customerName: string;
  issue: string;
  turns: BriefTurn[];
}): AgentBriefing {
  const topic = detectTopic(input.issue, input.turns);
  const lastCustomer = [...input.turns]
    .reverse()
    .find((t) => t.role === "user" && t.text.trim());
  const latest = lastCustomer
    ? `Latest customer message: "${lastCustomer.text.trim().slice(0, 160)}".`
    : "No recent customer message on file.";
  const issueNote =
    input.issue &&
    !/^customer requested (online agent|human help)/i.test(input.issue)
      ? ` Noted issue: ${input.issue}.`
      : "";

  return {
    topic,
    summary: `${input.customerName} asked to speak to an online agent about ${TOPIC_LABEL[topic]}. ${latest}${issueNote}`,
    requestedAction: ACTIONS[topic],
  };
}
