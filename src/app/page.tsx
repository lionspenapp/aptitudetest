import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-gold/20 bg-canvas-light/80">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-serif text-2xl text-lapis-dark font-bold">
            InScribe
          </span>
          <div className="flex gap-4">
            <Link href="/login" className="text-lapis hover:text-gold transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary text-sm py-2 px-4">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="font-serif text-5xl md:text-6xl text-lapis-dark mb-4 max-w-3xl">
          The Academic Mastery OS
        </h1>
        <p className="text-lg text-slate-muted max-w-2xl mb-8">
          Automate the exact biophysical conditions required for long-term memory
          encoding. From zero-friction setup to comprehensive multi-day retrieval
          routines — InScribe inscribes knowledge that lasts.
        </p>

        <div className="flex gap-4 mb-16">
          <Link href="/signup" className="btn-primary text-lg">
            Start Studying
          </Link>
          <Link href="/login" className="btn-secondary text-lg">
            Sign In
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          {[
            {
              title: "Spaced Learning",
              desc: "Enforced 20-10-20-10-20 protocol with brain cooling breaks",
            },
            {
              title: "Retrieval Sandbox",
              desc: "Un-cued brain dumps with speech-to-text and Socratic scaffolds",
            },
            {
              title: "Exam Shield",
              desc: "Sleep lockout, morning warm-up, and working memory protection",
            },
          ].map((feature) => (
            <div key={feature.title} className="card text-left">
              <h3 className="font-serif text-lg text-lapis mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-muted">{feature.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-xs text-slate-muted max-w-lg">
          AI-generated study materials are for educational purposes. Always verify
          content against your official curriculum materials.
        </p>
      </main>
    </div>
  );
}
