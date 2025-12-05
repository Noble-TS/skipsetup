"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { authClient } from "~/server/better-auth/client";
import Button from "~/app/_components/ui/button/Button";
import Input from "~/app/_components/form/input/InputField";
import Label from "~/app/_components/form/label/Label";
import Checkbox from "~/app/_components/form/input/Checkbox";
import { ChevronLeft } from "lucide-react";

export default function CreateBlogPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    published: false,
  });

  const createPost = api.blog.create.useMutation({
    onSuccess: (data) => {
      router.push(`/blog/${data.slug}`);
    },
  });

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-md">
            <p className="text-purple-200 mb-4">Please sign in to create a blog post.</p>
            <Link href="/signin">
              <Button variant="t3-purple">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPost.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link href="/blog" className="mb-8 inline-flex items-center text-purple-200 hover:text-white">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Blog
        </Link>

        <div className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
          <h1 className="mb-8 text-3xl font-bold text-white">Create Blog Post</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-purple-100">Title</Label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter post title"
                required
                className="bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-[hsl(280,100%,70%)] focus:ring-[hsl(280,100%,70%)]/20"
              />
            </div>

            <div>
              <Label className="text-purple-100">Content</Label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your blog post content..."
                required
                rows={12}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30 focus:border-[hsl(280,100%,70%)] focus:ring-2 focus:ring-[hsl(280,100%,70%)]/20 transition-all duration-200 outline-none resize-vertical"
              />
            </div>

            <div className="flex items-center">
              <Checkbox
                checked={formData.published}
                onChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
                className="border-white/30 data-[state=checked]:bg-[hsl(280,100%,70%)]"
              />
              <span className="ml-2 text-sm text-purple-200">
                Publish immediately
              </span>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                variant="t3-purple"
                disabled={createPost.isPending}
                isLoading={createPost.isPending}
              >
                {formData.published ? "Publish Post" : "Save Draft"}
              </Button>
              <Link href="/blog">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
