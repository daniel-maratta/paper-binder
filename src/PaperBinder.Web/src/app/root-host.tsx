import { Fragment } from "react";
import { NavLink, Outlet, Route } from "react-router-dom";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardMeta,
  CardTitle
} from "../components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import { cn } from "../lib/cn";
import type { RootHostContext } from "./host-context";
import { rootRouteDefinitions } from "./route-registry";

function RootShell({ hostContext }: { hostContext: RootHostContext }) {
  return (
    <div className="min-h-screen bg-[var(--pb-surface-gradient)] text-[var(--pb-color-text)]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6 lg:px-10">
        <header className="flex flex-col gap-4 rounded-[var(--pb-radius-lg)] border border-white/70 bg-white/85 px-6 py-5 shadow-[var(--pb-shadow-card)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--pb-color-text-subtle)]">
              PaperBinder
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Frontend foundation checkpoint</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pb-color-text-muted)]">
              Root-host browser flows stay intentionally static in CP12. This shell exists to lock route structure,
              shared primitives, and direct API client behavior before real onboarding wiring lands.
            </p>
          </div>
          <div className="rounded-[var(--pb-radius-md)] bg-[var(--pb-color-panel-muted)] px-4 py-3 text-sm text-[var(--pb-color-text-muted)]">
            <p className="font-semibold text-[var(--pb-color-text)]">
              {hostContext.debugAlias ? "Loopback root-host debug alias" : "Canonical root host"}
            </p>
            <p className="mt-1 break-all">{hostContext.currentOrigin}</p>
          </div>
        </header>

        <div className="mt-6 grid flex-1 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="rounded-[var(--pb-radius-lg)] border border-white/70 bg-white/80 p-4 shadow-[var(--pb-shadow-card)] backdrop-blur">
            <nav aria-label="Root host navigation" className="space-y-1">
              {rootRouteDefinitions.map((route) => (
                <NavLink
                  className={({ isActive }) =>
                    cn(
                      "block rounded-[var(--pb-radius-md)] px-4 py-3 text-sm transition",
                      isActive
                        ? "bg-[var(--pb-color-primary)] text-white"
                        : "text-[var(--pb-color-text-muted)] hover:bg-[var(--pb-color-panel-muted)] hover:text-[var(--pb-color-text)]"
                    )
                  }
                  end={route.path === "/"}
                  key={route.path}
                  to={route.path}
                >
                  <span className="block font-semibold">{route.label}</span>
                  <span className="mt-1 block text-xs opacity-80">{route.description}</span>
                </NavLink>
              ))}
            </nav>
          </aside>

          <main className="pb-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function RootWelcomePage({ hostContext }: { hostContext: RootHostContext }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Route skeleton and shared primitives are ready.</CardTitle>
          <CardDescription>
            The root host now has durable shell structure for the later provisioning and login flows without pulling
            any browser submission logic into CP12.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <dl className="space-y-4 md:col-span-2 md:grid md:grid-cols-3 md:gap-4 md:space-y-0">
            <CardMeta label="Root host" value={hostContext.environment.rootUrl} />
            <CardMeta label="API base" value={hostContext.environment.apiBaseUrl} />
            <CardMeta label="Tenant base" value={hostContext.environment.tenantBaseDomain} />
          </dl>
          <Alert variant="info">
            <AlertTitle>Checkpoint boundary</AlertTitle>
            <AlertBody>
              Provisioning and login submission stay deferred to CP13, but the forms now render on the canonical
              routes with the shared field and button primitives.
            </AlertBody>
          </Alert>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Provision flow placeholder</CardTitle>
            <CardDescription>
              The browser form structure is visible here so CP13 can wire challenge, submission, redirect, and
              ProblemDetails handling on top of one shared baseline.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <Field hint="Normalized server-side into the future tenant slug." label="Tenant name">
                <input disabled placeholder="Acme Demo" type="text" />
              </Field>
              <Field hint="Rendered as a structural shell placeholder only in CP12." label="Challenge">
                <input disabled placeholder="Challenge widget lands in CP13" type="text" />
              </Field>
              <div className="flex flex-wrap gap-3">
                <Button disabled type="button">
                  Provision new demo tenant
                </Button>
                <Button disabled type="button" variant="secondary">
                  Log in
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What CP12 does ship</CardTitle>
            <CardDescription>Foundation work that later browser checkpoints can reuse without churn.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-6 text-[var(--pb-color-text-muted)]">
              <li>Host-aware routing for root-host versus tenant-host contexts.</li>
              <li>One shared API client for headers, CSRF wiring, correlation ids, and ProblemDetails parsing.</li>
              <li>Accessible shared primitives for forms, tables, alerts, dialogs, banners, cards, buttons, and badges.</li>
              <li>Repo-native frontend component and utility tests through the Vite-native test runner.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RootLoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Login route placeholder</CardTitle>
        <CardDescription>
          This route exists now so the shared shell, field, and ProblemDetails surfaces are stable before CP13 wires
          live login behavior.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <Field hint="Cookie-auth remains the only v1 browser auth model." label="Email">
            <input disabled placeholder="owner@tenant.local" type="email" />
          </Field>
          <Field hint="Password entry is disabled until the CP13 submit path is live." label="Password">
            <input disabled placeholder="Generated password" type="password" />
          </Field>
          <Alert variant="warning">
            <AlertTitle>Submission intentionally disabled</AlertTitle>
            <AlertBody>
              Challenge verification, login throttling feedback, redirect handling, and user-facing failure states
              remain CP13 work.
            </AlertBody>
          </Alert>
        </form>
      </CardContent>
    </Card>
  );
}

function RootAboutPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>About the frontend foundation</CardTitle>
          <CardDescription>
            CP12 establishes the browser implementation baseline without widening product scope.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <CardMeta label="Architecture" value="Single React SPA, direct API calls, no BFF" />
          <CardMeta label="Bootstrap seam" value="GET /api/tenant/lease" />
          <CardMeta label="Test stack" value="Vitest + RTL + jsdom" />
        </CardContent>
        <CardFooter>
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="secondary">
                View scope notes
              </Button>
            </DialogTrigger>
            <DialogContent
              description="These notes are intentionally reviewer-facing and durable."
              title="Why CP12 stops at foundations"
            >
              <ul className="space-y-3 text-sm leading-6 text-[var(--pb-color-text-muted)]">
                <li>Provisioning and login submissions stay deferred so the CP13 flow remains one cohesive checkpoint.</li>
                <li>Tenant binders, documents, users, and lease actions stay placeholder-only to avoid pulling CP14 UI forward.</li>
                <li>E2E browser automation starts later; CP12 limits itself to component and utility coverage.</li>
              </ul>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Close notes
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
}

function RootNotFoundPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Route not available on the root host</CardTitle>
        <CardDescription>
          The SPA stays host-local. Unknown root-host routes remain on the root shell instead of redirecting into the
          tenant route space.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="warning">
          <AlertTitle>Known root routes</AlertTitle>
          <AlertBody>
            <code>/</code>, <code>/login</code>, and <code>/about</code> are the canonical root-host routes in CP12.
          </AlertBody>
        </Alert>
      </CardContent>
    </Card>
  );
}

export function RootHostRoutes({ hostContext }: { hostContext: RootHostContext }) {
  return (
    <Fragment>
      <Route element={<RootShell hostContext={hostContext} />}>
        <Route element={<RootWelcomePage hostContext={hostContext} />} path="/" />
        <Route element={<RootLoginPage />} path="/login" />
        <Route element={<RootAboutPage />} path="/about" />
        <Route element={<RootNotFoundPage />} path="*" />
      </Route>
    </Fragment>
  );
}
