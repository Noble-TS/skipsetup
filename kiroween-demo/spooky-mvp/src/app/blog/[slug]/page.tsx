"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { ChevronLeft } from "lucide-react";

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const { data: post, isLoading } = api.blog.getBySlug.useQuery({ slug });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 w-1/3 rounded bg-white/20 mb-4"></div>
            <div className="h-12 w-3/4 rounded bg-white/20 mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-white/10"></div>
              <div className="h-4 w-full rounded bg-white/10"></div>
              <div className="h-4 w-2/3 rounded bg-white/10"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-md">
            <p className="text-purple-200">Post not found.</p>
            <Link href="/blog" className="mt-4 inline-flex items-center text-[hsl(280,100%,70%)] hover:text-white">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link href="/blog" className="mb-8 inline-flex items-center text-purple-200 hover:text-white">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Blog
        </Link>
        
        <article className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
          <header className="mb-8">
            <h1 className="mb-4 text-4xl font-bold text-white">{post.title}</h1>
            <div className="flex items-center text-sm text-purple-300">
              <span>By {post.author.name}</span>
              <span className="mx-2">•</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </header>
          
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-purple-100 leading-relaxed">
              {post.content}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
