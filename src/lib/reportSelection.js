// Selection is scoped to the exact report filters, across all result pages.
export const reportScope = (userId, search, start, end) => JSON.stringify([userId, search, start, end]);

export function visibleSelection(selection, scope, requests) {
  if (selection.scope !== scope) return [];
  const selected = new Set(selection.ids);
  return requests.filter(request => selected.has(request.id)).map(request => request.id);
}

export function toggleReportSelection(ids, id) {
  return ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
}

export function applyDeletedRequests(requests, deletedIds) {
  const deleted = new Set(deletedIds);
  return requests.filter(request => !deleted.has(request.id));
}

export function applyReturnedPolicies(policies, updatedPolicies) {
  const updated = new Map(updatedPolicies.map(policy => [policy.id, policy]));
  return policies.map(policy => updated.get(policy.id) || policy);
}
