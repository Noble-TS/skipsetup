import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const blogRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        published: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slug = input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      return ctx.db.blogPost.create({
        data: {
          title: input.title,
          content: input.content,
          slug,
          published: input.published,
          author: { connect: { id: ctx.session.user.id } },
        },
      });
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    });
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.blogPost.findUnique({
        where: { slug: input.slug },
        include: { author: { select: { name: true } } },
      });
    }),

  getMyPosts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.blogPost.findMany({
      where: { authorId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),
});
