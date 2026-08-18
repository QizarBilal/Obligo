import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  ...timestamps,
}, (t) => [uniqueIndex("users_email_uq").on(t.email)]);

export const households = sqliteTable("households", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  dataRegion: text("data_region").notNull().default("auto"),
  retentionDays: integer("retention_days").notNull().default(365),
  ...timestamps,
});

export const memberships = sqliteTable("memberships", {
  householdId: text("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["owner", "adult", "dependent", "caregiver", "trusted_contact"] }).notNull(),
  status: text("status", { enum: ["active", "invited", "suspended"] }).notNull().default("active"),
  createdAt: text("created_at").notNull(),
}, (t) => [primaryKey({ columns: [t.householdId, t.userId] }), index("memberships_user_idx").on(t.userId)]);

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(), householdId: text("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  uploadedBy: text("uploaded_by").notNull().references(() => users.id), title: text("title").notNull(),
  objectKey: text("object_key").notNull(), mimeType: text("mime_type").notNull(), sizeBytes: integer("size_bytes").notNull(),
  sha256: text("sha256").notNull(), status: text("status", { enum: ["quarantined", "processing", "ready", "rejected", "deleted"] }).notNull(),
  sourceType: text("source_type", { enum: ["upload", "message", "receipt", "manual"] }).notNull(),
  deletedAt: text("deleted_at"), ...timestamps,
}, (t) => [index("documents_household_idx").on(t.householdId), uniqueIndex("documents_object_key_uq").on(t.objectKey)]);

export const obligations = sqliteTable("obligations", {
  id: text("id").primaryKey(), householdId: text("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  documentId: text("document_id").references(() => documents.id, { onDelete: "set null" }), title: text("title").notNull(),
  description: text("description").notNull().default(""), dueAt: text("due_at"), status: text("status", { enum: ["draft", "active", "blocked", "completed", "dismissed"] }).notNull().default("draft"),
  priority: text("priority", { enum: ["low", "normal", "high", "critical"] }).notNull().default("normal"),
  ownerId: text("owner_id").references(() => users.id), estimatedCostPaise: integer("estimated_cost_paise"), confidence: integer("confidence").notNull().default(0),
  explanation: text("explanation").notNull().default(""), sourceLocator: text("source_locator"), completedAt: text("completed_at"), ...timestamps,
}, (t) => [index("obligations_household_due_idx").on(t.householdId, t.dueAt)]);

export const dependencies = sqliteTable("dependencies", {
  householdId: text("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  predecessorId: text("predecessor_id").notNull().references(() => obligations.id, { onDelete: "cascade" }),
  successorId: text("successor_id").notNull().references(() => obligations.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(), createdAt: text("created_at").notNull(),
}, (t) => [primaryKey({ columns: [t.predecessorId, t.successorId] }), index("dependencies_household_idx").on(t.householdId)]);

export const evidence = sqliteTable("evidence", {
  id: text("id").primaryKey(), householdId: text("household_id").notNull(), obligationId: text("obligation_id").notNull().references(() => obligations.id, { onDelete: "cascade" }),
  documentId: text("document_id").references(() => documents.id, { onDelete: "set null" }), quote: text("quote").notNull(), locator: text("locator").notNull(), createdAt: text("created_at").notNull(),
}, (t) => [index("evidence_obligation_idx").on(t.householdId, t.obligationId)]);

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(), householdId: text("household_id").notNull(), actorId: text("actor_id").notNull(), action: text("action").notNull(),
  targetType: text("target_type").notNull(), targetId: text("target_id").notNull(), metadataJson: text("metadata_json").notNull().default("{}"), createdAt: text("created_at").notNull(),
}, (t) => [index("audit_household_time_idx").on(t.householdId, t.createdAt)]);
