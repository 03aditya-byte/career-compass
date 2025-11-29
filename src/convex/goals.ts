import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const addGoal = mutation({
  args: {
    title: v.string(),
    deadline: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.insert("goals", {
      userId,
      title: args.title,
      isCompleted: false,
      deadline: args.deadline,
    });
  },
});

export const toggleGoal = mutation({
  args: {
    goalId: v.id("goals"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== userId) throw new Error("Not found");

    await ctx.db.patch(args.goalId, { isCompleted: !goal.isCompleted });
  },
});

export const deleteGoal = mutation({
  args: {
    goalId: v.id("goals"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== userId) throw new Error("Not found");

    await ctx.db.delete(args.goalId);
  },
});

export const getGoals = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});
