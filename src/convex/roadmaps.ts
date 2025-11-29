import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createRoadmap = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    steps: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.string(),
        isCompleted: v.boolean(),
      })
    ),
    skills: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Deactivate other active roadmaps for simplicity in this MVP
    const existing = await ctx.db
      .query("roadmaps")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    for (const roadmap of existing) {
      await ctx.db.patch(roadmap._id, { status: "archived" });
    }

    const roadmapId = await ctx.db.insert("roadmaps", {
      userId,
      title: args.title,
      description: args.description,
      steps: args.steps,
      status: "active",
      skills: args.skills ?? [],
    });

    return roadmapId;
  },
});

export const getActiveRoadmap = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const roadmap = await ctx.db
      .query("roadmaps")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    return roadmap;
  },
});

export const toggleStep = mutation({
  args: {
    roadmapId: v.id("roadmaps"),
    stepId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap || roadmap.userId !== userId) throw new Error("Not found");

    const newSteps = roadmap.steps.map((step) => {
      if (step.id === args.stepId) {
        return { ...step, isCompleted: !step.isCompleted };
      }
      return step;
    });

    await ctx.db.patch(args.roadmapId, { steps: newSteps });
  },
});
