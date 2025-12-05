"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { authClient } from "~/server/better-auth/client";
import Button from "~/app/_components/ui/button/Button";

export default function BlogPage() {
  const { data: posts, isLoading } = api.blog.getAll.useQuery();
  const { data: session } = authClient.useSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white">Blog</h1>
          {session?.user && (
            <Link href="/blog/create">
              <Button variant="t3-purple">Create Post</Button>
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="h-6 w-3/4 rounded bg-white/20 mb-2"></div>
                <div className="h-4 w-1/2 rounded bg-white/10"></div>
              </div>
            ))}
          </div>
        ) : posts?.length ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <article className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:bg-white/10">
                  <h2 className="mb-2 text-xl font-semibold text-white">{post.title}</h2>
                  <p className="mb-4 text-purple-200 line-clamp-3">{post.content.substring(0, 200)}...</p>
                  <div className="flex items-center justify-between text-sm text-purple-300">
                    <span>By {post.author.name}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-md">
            <p className="text-purple-200">No blog posts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
