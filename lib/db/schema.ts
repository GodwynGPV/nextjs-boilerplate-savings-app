import { pgTable, text, serial, integer, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  initialBalance: numeric("initial_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  members: text("members").array().notNull().default(["Wil", "Wyn", "Bam"]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(),
  type: text("type", { enum: ["deposit", "interest"] }).notNull(),
  depositorName: text("depositor_name"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
}));

export const insertAccountSchema = createInsertSchema(accounts)
  .omit({ id: true, createdAt: true })
  .extend({
    initialBalance: z.union([z.string(), z.number()]).transform(String).optional().default("0"),
    members: z.array(z.string().min(1)).optional().default(["Wil", "Wyn", "Bam"]),
  });

export const insertTransactionSchema = createInsertSchema(transactions)
  .omit({ id: true, createdAt: true })
  .extend({
    amount: z.union([z.string(), z.number()]).transform(String),
    depositorName: z.string().nullable().optional(),
  });

export const updateTransactionSchema = z.object({
  type: z.enum(["deposit", "interest"]).optional(),
  depositorName: z.string().nullable().optional(),
  amount: z.union([z.string(), z.number()]).transform(String).optional(),
  date: z.string().optional(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;

export interface AccountAnalytics {
  totalBalance: number;
  totalInterest: number;
  totalContributions: number;
  contributors: {
    name: string;
    totalContributed: number;
    ownershipPercentage: number;
    allocatedInterest: number;
    totalValue: number;
  }[];
  growth: {
    monthOverMonth: number;
    yearOverYear: number;
  };
}

export interface AccountWithAnalytics extends Account {
  analytics: AccountAnalytics;
}
