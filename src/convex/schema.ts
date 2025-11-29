import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
      currentRole: v.optional(v.string()),
      targetRole: v.optional(v.string()),
      bio: v.optional(v.string()),
    }).index("email", ["email"]), // index for the email. do not remove or modify

    assessments: defineTable({
      userId: v.id("users"),
      answers: v.string(), // JSON stringified answers
      recommendedCareer: v.string(),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    roadmaps: defineTable({
      userId: v.id("users"),
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
      status: v.string(), // "active", "completed", "archived"
      skills: v.optional(v.array(v.string())),
    }).index("by_user", ["userId"]),

    goals: defineTable({
      userId: v.id("users"),
      title: v.string(),
      isCompleted: v.boolean(),
      deadline: v.optional(v.number()),
    }).index("by_user", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;