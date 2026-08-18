export type Role = "owner" | "adult" | "dependent" | "caregiver" | "trusted_contact";
export type Action = "vault:read" | "vault:write" | "obligation:read" | "obligation:write" | "member:manage" | "export";
const permissions: Record<Role, Set<Action>> = {
  owner: new Set(["vault:read","vault:write","obligation:read","obligation:write","member:manage","export"]),
  adult: new Set(["vault:read","vault:write","obligation:read","obligation:write","export"]),
  dependent: new Set(["obligation:read","obligation:write"]), caregiver: new Set(["obligation:read","obligation:write"]), trusted_contact: new Set(["obligation:read"]),
};
export function may(role: Role, action: Action) { return permissions[role].has(action); }
export function assertHouseholdScope(requested: string, membership: string) { if (!requested || requested !== membership) throw new Error("Household boundary violation"); return requested; }
export function safeAuditMetadata(value: Record<string, unknown>) { const blocked = /content|password|token|secret|document|quote/i; return Object.fromEntries(Object.entries(value).filter(([key]) => !blocked.test(key)).map(([key,item]) => [key, typeof item === "string" ? item.slice(0,200) : item])); }
export function securityHeaders() { return { "Cache-Control":"no-store", "Content-Security-Policy":"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'", "Referrer-Policy":"no-referrer", "X-Content-Type-Options":"nosniff", "Permissions-Policy":"camera=(), microphone=(), geolocation=()" }; }
