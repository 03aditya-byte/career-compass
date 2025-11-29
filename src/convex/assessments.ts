import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const submitAssessment = mutation({
  args: {
    answers: v.string(),
    recommendedCareer: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const assessmentId = await ctx.db.insert("assessments", {
      userId,
      answers: args.answers,
      recommendedCareer: args.recommendedCareer,
      createdAt: Date.now(),
    });

    // Update user's target role based on recommendation if not set
    const user = await ctx.db.get(userId);
    if (user && !user.targetRole) {
      await ctx.db.patch(userId, { targetRole: args.recommendedCareer });
    }

    return assessmentId;
  },
});

export const getUserAssessments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("assessments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});
