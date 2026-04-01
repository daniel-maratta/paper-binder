import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { frontendEnvironment } from "./environment";

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
  const { apiBaseUrl, rootUrl, tenantBaseDomain } = frontendEnvironment;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fb923c,_#ffedd5_30%,_#f8fafc_70%)] text-slate-950">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-700">PaperBinder</p>
            <h1 className="mt-2 font-serif text-3xl md:text-5xl">Persistence, migrations, and runtime database plumbing are now wired.</h1>
          </div>
          <span className="rounded-full border border-slate-900/10 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-700">
            CP3
          </span>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[2rem] border border-slate-900/10 bg-white/85 p-8 shadow-[0_25px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
            <p className="max-w-2xl text-lg leading-8 text-slate-700">
              The frontend scaffold mirrors the PaperBinder constraints: a client-rendered React SPA, Vite
              tooling, Tailwind styling, and a light Radix primitive baseline. Root-host and tenant-host flows
              stay in one app, but feature routes remain intentionally minimal until later checkpoints.
            </p>
            <dl className="mt-8 grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-700 md:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-[0.22em] text-slate-500">Root Host</dt>
                <dd className="mt-2 break-all font-medium text-slate-950">{rootUrl}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.22em] text-slate-500">API Base</dt>
                <dd className="mt-2 break-all font-medium text-slate-950">{apiBaseUrl}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.22em] text-slate-500">Tenant Domain</dt>
                <dd className="mt-2 break-all font-medium text-slate-950">{tenantBaseDomain}</dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button>Provisioning Shell</Button>
              <Button>Root Host Placeholder</Button>
              <Button>Tenant Host Placeholder</Button>
            </div>
          </article>

          <aside className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-8 text-slate-50 shadow-[0_25px_70px_-40px_rgba(15,23,42,0.7)]">
            <p className="text-xs uppercase tracking-[0.28em] text-orange-200">Baseline</p>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-300">
              <li>Build-time environment validation keeps the root host, API base URL, and tenant base domain explicit in the frontend contract.</li>
              <li>Schema changes now run through a dedicated migrations executable and Docker Compose migration service.</li>
              <li>Health readiness now depends on a real database query instead of a TCP-only socket probe.</li>
              <li>Reviewer UI launches can serve this compiled SPA through the API host, while focused debugging still keeps the API and Vite surfaces separate.</li>
            </ul>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Next up</p>
              <p className="mt-2 text-sm text-slate-200">
                CP4 adds the HTTP contract baseline: ProblemDetails, version negotiation, correlation handling,
                and protocol-focused integration coverage.
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
