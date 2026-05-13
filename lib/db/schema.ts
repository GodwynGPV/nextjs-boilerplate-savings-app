import { pgTable, text, serial, integer, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  initialBalance: numeric("initial_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  members: text("members").array().notNull().default(["Wil", "Wyn", "Bam"]),
  owner: text("owner"),
  quarterlyLimit: numeric("quarterly_limit", { precision: 12, scale: 2 }),
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
    owner: z.string().nullable().optional(),
    quarterlyLimit: z.union([z.string(), z.number()]).transform(String).nullable().optional(),
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

export const updateAccountSchema = z.object({
  name: z.string().min(1).transform(s => s.trim()).optional(),
  owner: z.string().nullable().optional(),
  quarterlyLimit: z.union([z.string(), z.number()]).transform(v => v === "" ? null : String(v)).nullable().optional(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;

export interface QuarterStats {
  year: number;
  quarter: number;
  deposited: number;
}

export interface AccountAnalytics {
  totalBalance: number;
  totalInterest: number;
  totalContributions: number;
  ownerTax: number;
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
  quarterly: {
    limit: number | null;
    current: {
      year: number;
      quarter: number;
      deposited: number;
      remaining: number | null;
    };
    history: QuarterStats[];
  };
}

export interface AccountWithAnalytics extends Account {
  analytics: AccountAnalytics;
}
