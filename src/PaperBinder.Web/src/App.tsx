import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

function Button({ asChild = false, className = "", ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={[
        "inline-flex items-center justify-center rounded-full border border-white/20",
        "bg-slate-950/85 px-4 py-2 text-sm font-medium text-white transition",
        "hover:-translate-y-px hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950",
        className
      ].join(" ")}
      {...props}
    />
  );
}

function LandingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fb923c,_#ffedd5_30%,_#f8fafc_70%)] text-slate-950">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-700">PaperBinder</p>
            <h1 className="mt-2 font-serif text-3xl md:text-5xl">Workspace bootstrap is now wired.</h1>
          </div>
          <span className="rounded-full border border-slate-900/10 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-700">
            CP1
          </span>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[2rem] border border-slate-900/10 bg-white/85 p-8 shadow-[0_25px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
            <p className="max-w-2xl text-lg leading-8 text-slate-700">
              The frontend scaffold mirrors the PaperBinder constraints: a client-rendered React SPA, Vite
              tooling, Tailwind styling, and a light Radix primitive baseline. Root-host and tenant-host flows
              stay in one app, but feature routes remain intentionally minimal until later checkpoints.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button>Provisioning Shell</Button>
              <Button>Root Host Placeholder</Button>
              <Button>Tenant Host Placeholder</Button>
            </div>
          </article>

          <aside className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-8 text-slate-50 shadow-[0_25px_70px_-40px_rgba(15,23,42,0.7)]">
            <p className="text-xs uppercase tracking-[0.28em] text-orange-200">Baseline</p>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-300">
              <li>Local development keeps the API host and SPA dev server on distinct surfaces, with the backend host limited to a reviewer-facing live-state page.</li>
              <li>Separate worker, migrations, domain, application, infrastructure, and test projects.</li>
              <li>Root PowerShell scripts become the canonical restore, build, test, validate, and start surface.</li>
            </ul>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Next up</p>
              <p className="mt-2 text-sm text-slate-200">
                CP2 will wire typed configuration, local containers, and the concrete runtime topology.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function TenantWorkspace() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-50">
      <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-[0_20px_60px_-35px_rgba(251,146,60,0.75)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-orange-200">Tenant Host</p>
        <h2 className="mt-4 font-serif text-3xl">Feature routes land in later checkpoints.</h2>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          This placeholder keeps the route map honest without inventing binder, document, or lease behavior
          before the matching backend contracts exist.
        </p>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<TenantWorkspace />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
