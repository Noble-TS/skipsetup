import SiteHeader from "../_components/common/SiteHeader";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-orange-950/20 to-neutral-900">
      <SiteHeader />

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-5xl font-bold text-white">
          About <span className="text-orange-500">Kiroween</span>
        </h1>

        <div className="space-y-6 text-neutral-300">
          <p className="text-xl">
            Welcome to Kiroween, where the supernatural meets the digital realm.
          </p>

          <p>
            Founded in the depths of a haunted October night, Kiroween was born from a vision
            to bring the magic of Halloween to the world of SaaS. We believe that business
            tools don't have to be boring – they can be spooky, fun, and incredibly powerful.
          </p>

          <p>
            Our platform combines cutting-edge technology with a hauntingly good user experience,
            helping businesses of all sizes embrace their dark side while achieving their goals.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { icon: "🎃", title: "Spooky Design", desc: "Beautiful, haunting interfaces" },
              { icon: "⚡", title: "Lightning Fast", desc: "Performance that's scary good" },
              { icon: "🔒", title: "Secure", desc: "Your data is safe in our crypt" },
            ].map((feature, idx) => (
              <div key={idx} className="rounded-xl border border-neutral-700 bg-neutral-800/50 p-6 text-center">
                <div className="mb-4 text-5xl">{feature.icon}</div>
                <h3 className="mb-2 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-neutral-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
