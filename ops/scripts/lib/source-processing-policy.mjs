import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

export const defaultSourceProcessingPolicyPath = "content/workflow/tasks/source-processing-policy.json";

const NON_PROCESSABLE_ACTIONS = new Set([
  "archive-only",
  "blocked",
  "duplicate",
  "skip",
]);

export function sourcePolicyKey(channelPath, videoId) {
  return `${channelPath}/${videoId}`;
}

export async function readSourceProcessingPolicy(repoRoot, policyPath = defaultSourceProcessingPolicyPath) {
  const resolved = path.resolve(repoRoot, policyPath);
  if (!existsSync(resolved)) {
    return {
      policy_path: path.relative(repoRoot, resolved),
      default_action: "process",
      sources: {},
    };
  }

  const policy = JSON.parse(await fs.readFile(resolved, "utf8"));
  return {
    policy_path: path.relative(repoRoot, resolved),
    default_action: policy.default_action ?? "process",
    ...policy,
    sources: policy.sources ?? {},
  };
}

export function getSourcePolicy(policy, channelPath, videoId) {
  const direct = policy.sources?.[sourcePolicyKey(channelPath, videoId)];
  if (direct) return { key: sourcePolicyKey(channelPath, videoId), ...direct };

  const fallback = policy.sources?.[videoId];
  if (fallback) return { key: videoId, ...fallback };

  return {
    key: sourcePolicyKey(channelPath, videoId),
    action: policy.default_action ?? "process",
    reason: null,
  };
}

export function normalizeSourcePolicy(policyEntry) {
  const action = String(policyEntry?.action ?? "process").toLowerCase();
  const processable = !NON_PROCESSABLE_ACTIONS.has(action);
  const normalized = {
    action,
    processing_status: processable ? "processable" : "not-processable",
    processable,
    counts_as_independent_source: policyEntry?.counts_as_independent_source ?? processable,
    reason: policyEntry?.reason ?? null,
    canonical_video_id: policyEntry?.canonical_video_id ?? null,
    canonical_source_slug: policyEntry?.canonical_source_slug ?? null,
    canonical_source_ref: policyEntry?.canonical_source_ref ?? null,
    notes: policyEntry?.notes ?? null,
    key: policyEntry?.key ?? null,
  };
  if (policyEntry?.processing_order !== undefined) {
    normalized.processing_order = policyEntry.processing_order;
  }
  return normalized;
}

export function describeSourcePolicy(normalized) {
  if (normalized.processable) return "source is processable";
  const canonical = normalized.canonical_source_slug
    ? `; canonical source is ${normalized.canonical_source_slug}`
    : "";
  const reason = normalized.reason ? `: ${normalized.reason}` : "";
  return `${normalized.action}${reason}${canonical}`;
}
