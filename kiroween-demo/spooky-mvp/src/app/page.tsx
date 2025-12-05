import Link from "next/link";
import { redirect } from "next/navigation";
import { LatestPost } from "~/app/_components/post";
import { getSession } from "~/server/better-auth/server";
import { HydrateClient, api } from "~/trpc/server";
import { auth } from "~/server/better-auth/config";
import { headers } from "next/headers";
export default async function Home() {
  const session = await getSession();
  if (session) void api.post.getLatest.prefetch();
  const hello = await api.post.hello({ text: "from tRPC" });

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Welcome to <span className="text-[hsl(280,100%,70%)]">T3</span> App
          </h1>

          <p className="text-2xl text-white">
            {hello ? hello.greeting : "Loading tRPC query..."}
          </p>

          {!session ? (
            <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl bg-white/10 p-8 shadow-lg backdrop-blur-md">
              <Link
                href="/signin"
                className="w-full rounded-xl bg-white/20 py-3 text-center font-semibold shadow-md transition hover:bg-white/30"
              >
                Sign In
              </Link>

              <div className="h-px w-full bg-white/20" />

              <div className="text-center text-lg text-purple-200">
                <span>New here? </span>
                <Link
                  href="/signup"
                  className="font-semibold underline transition hover:text-white"
                >
                  Create an account
                </Link>
              </div>

              {/* Forgot Password */}
              <div className="text-center text-purple-200">
                <Link
                  href="/forgot-password"
                  className="text-sm underline transition hover:text-white"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xl">Logged in as {session.user?.email}</p>

              <form>
                <button
                  className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
                  formAction={async () => {
                    "use server";
                    await auth.api.signOut({
                      headers: await headers(),
                    });
                    redirect("/");
                  }}
                >
                  Sign Out
                </button>
              </form>

              <LatestPost />
            </>
          )}
        </div>
      </main>
    </HydrateClient>
  );
}
