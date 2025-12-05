export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
          <h1 className="mb-8 text-4xl font-bold text-white">About SkipSetup</h1>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-purple-100 leading-relaxed mb-6">
              SkipSetup is a production-ready fullstack foundation that helps developers build faster 
              with type-safe, zero-config scaffolding and AI-powered development tools.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mb-4">Features</h2>
            <ul className="text-purple-200 space-y-2 mb-6">
              <li>• Next.js 15 with App Router and React 19</li>
              <li>• Better Auth for authentication with email OTP</li>
              <li>• tRPC for type-safe APIs</li>
              <li>• Prisma ORM with PostgreSQL</li>
              <li>• Tailwind CSS with glassmorphism design</li>
              <li>• Email system with React Email templates</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-white mb-4">Get Started</h2>
            <p className="text-purple-100 leading-relaxed">
              This project was generated using the SkipSetup CLI with production-ready 
              configurations and best practices built in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
