export type Obligation = { id: string; title: string; dueAt: string | null; status: "draft" | "active" | "blocked" | "completed" | "dismissed"; priority: "low" | "normal" | "high" | "critical"; owner: string; costPaise?: number; confidence: number; explanation: string; source: string };
export type Dependency = { from: string; to: string; reason: string };

export function compilePlan(items: Obligation[], edges: Dependency[]) {
  const active = items.filter((item) => item.status !== "dismissed" && item.status !== "completed");
  const ids = new Set(active.map((item) => item.id));
  const incoming = new Map(active.map((item) => [item.id, 0]));
  const outgoing = new Map(active.map((item) => [item.id, [] as string[]]));
  for (const edge of edges) if (ids.has(edge.from) && ids.has(edge.to)) { incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1); outgoing.get(edge.from)?.push(edge.to); }
  const queue = active.filter((item) => incoming.get(item.id) === 0).sort(compareDue); const ordered: Obligation[] = [];
  while (queue.length) { const item = queue.shift()!; ordered.push(item); for (const next of outgoing.get(item.id) ?? []) { incoming.set(next, incoming.get(next)! - 1); if (incoming.get(next) === 0) queue.push(active.find((candidate) => candidate.id === next)!); } queue.sort(compareDue); }
  if (ordered.length !== active.length) throw new Error("Dependency cycle detected");
  return { ordered, available: ordered.filter((item) => predecessorsComplete(item.id, edges, items)), criticalIds: new Set(edges.filter((edge) => ids.has(edge.from) && ids.has(edge.to)).flatMap((edge) => [edge.from, edge.to])) };
}
function predecessorsComplete(id: string, edges: Dependency[], items: Obligation[]) { return edges.filter((edge) => edge.to === id).every((edge) => items.find((item) => item.id === edge.from)?.status === "completed"); }
function compareDue(a: Obligation, b: Obligation) { return (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999") || priorityRank(b.priority) - priorityRank(a.priority); }
function priorityRank(value: Obligation["priority"]) { return { low: 0, normal: 1, high: 2, critical: 3 }[value]; }

export function validateDependency(from: string, to: string, edges: Dependency[]) {
  if (from === to) return false; const adjacency = new Map<string, string[]>();
  for (const edge of [...edges, { from, to, reason: "candidate" }]) adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge.to]);
  const visiting = new Set<string>(); const visited = new Set<string>();
  const cycle = (id: string): boolean => { if (visiting.has(id)) return true; if (visited.has(id)) return false; visiting.add(id); for (const next of adjacency.get(id) ?? []) if (cycle(next)) return true; visiting.delete(id); visited.add(id); return false; };
  return ![...adjacency.keys()].some(cycle);
}

export function sanitiseDocumentText(input: string) { const printable = [...input].map((character) => { const code = character.charCodeAt(0); return code < 32 && code !== 9 && code !== 10 && code !== 13 ? " " : character; }).join(""); return printable.replace(/(?:ignore|override) (?:all |the )?(?:previous|system) instructions?/gi, "[untrusted instruction removed]").slice(0, 100_000); }

export function extractObligations(text: string, now = new Date()) {
  const safe = sanitiseDocumentText(text); const results: Array<Pick<Obligation, "title" | "dueAt" | "confidence" | "explanation" | "source">> = [];
  const datePattern = /(?:renew|submit|pay|complete|expires?|due)[^.!?\n]{0,100}?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4})/gi;
  for (const match of safe.matchAll(datePattern)) { const date = parseDate(match[1]); if (!date || date < new Date(now.getFullYear() - 1, 0, 1)) continue; const source = match[0].trim(); const verb = source.match(/renew|submit|pay|complete|expires?|due/i)?.[0] ?? "Review"; results.push({ title: `${verb[0].toUpperCase()}${verb.slice(1)} requirement`, dueAt: date.toISOString(), confidence: 82, explanation: "A dated action was found in the supplied source. Confirm it before activation.", source }); }
  return results.slice(0, 20);
}
function parseDate(value: string) { const normalized = value.replace(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/, "$2/$1/$3"); const date = new Date(normalized); return Number.isNaN(date.valueOf()) ? null : date; }
