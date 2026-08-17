# Introduction

Today, LLMs have made it easier than ever to generate and modify large volumes of application code. However, the challenge is no longer obtaining functional output. Rather, it is turning that output into software that is reliable, coherent, secure, maintainable, and safe to operate.

In today’s AI-centric software engineering industry, we must balance utilizing AI – which can generate and transform code far faster than any human engineer can type it – with higher-order real-world context and thinking. We need to turn the raw output of AI into something that performs under real-world pressure.

## What is PaperBinder, and why build it?

PaperBinder is a production-shaped micro-SaaS demo project. PaperBinder features easy tenant onboarding, tenant isolation, permissions honoring, and multi-user support per tenant, among other things.
The expected flow is that a guest may start a new demo, log in, then create binders, documents, and users, and then assign permissions to each as they wish.

PaperBinder was partly built as both an experiment and as a project to help me learn how to leverage LLMs at a deeper level when building full-stack web applications. I wanted to see if I could build a full-stack web app using AI from concept to public deployment.

## Building PaperBinder: The Process

When designing PaperBinder, I decided to take a highly structured approach. The first step in any good system design is to begin by defining the desired outcome. This is true no matter the system or process or whether it will be built by AI. Translating and communicating desired outcomes into hard, technical requirements is a necessary skill for software engineers either way.

For PaperBinder, this process involved thinking through which capabilities were required for a Minimum Viable Product (MVP) which would approximate a basic enterprise app. This is where I determined that tenant isolation, idempotency, and security were going to be paramount concerns in the app.

Once I had defined the desired outcome I next moved on to identifying the constraints. This included things like:

- Determining the ongoing time and money maintenance budget,
- Pruning what would have been mostly noise or performative theater, and
- Comparing the features I was considering against the MVP I had established.

From this point, I was then able to start architecting the system accordingly. This included tasks such as developing the data and entity layers, deciding which projects and technologies would be needed, and defining the extent of logging and security, among other things. For this project I decided to use PostgreSQL, ASP.NET Core on .NET 10, and React as the main technology stack. I chose this tech stack due to its versatility, proven track record, available support, and my familiarity with them from past projects.

I selected Vite rather than a full-stack React framework because PaperBinder did not require server-side rendering or framework-managed backend behavior. Vite was the smallest appropriate tool for the scope and kept the frontend architecture explicit. It is only being used for build-time tooling. The deployed app serves the compiled bundle from the ASP.NET Core host behind Caddy. The Vite dev server is reserved for local frontend debugging.

PaperBinder uses a Clean Architecture-style structure with the following projects: Domain, Application, Infrastructure, API, Worker, Web, and Migrations. The architecture is centered on the Domain and Application projects. Infrastructure provides concrete adapters for concerns such as persistence, while API and Worker serve as separate executable hosts. The React Web project is an external client of the API, and Migrations isolates database schema management from runtime persistence.

![Dependency diagram showing PaperBinder Domain and Application projects at the center, with Infrastructure, API, Worker, Web, and Migrations around them.](/presentation/dependency-architecture-diagram.svg)

^Figure 1. PaperBinder solution structure.^

I had initially considered using Command-Query Responsibility Segregation (CQRS) but ultimately decided against it as being too heavy-handed and overbuilt for this project. Instead, I went with a lightweight, in-process CQRS pattern where commands and queries are separated conceptually and their respective handlers live in the Application layer, but built it with the understanding that only a single relational database would be used and that I wouldn’t need distributed services and a separate read database.

After I was sufficiently satisfied with the initial direction of PaperBinder, I then moved on to agent documentation. I took the concept that I had developed and began feeding it into an AI assistant (in my case, ChatGPT) to have it start creating markdown files that could be placed in the project to help guide coding agents when they began writing code. Decisions were captured as Architecture Decision Records (ADRs), which later agents were required to load before touching related areas.

The documentation process took some time on my end, but it was time I was willing to invest because adequately describing the application to the agents is foundational to their understanding of the end goals and greatly influences how they go about writing code. After many passes and a lot of gap-filling, clarification, and token optimization, I eventually got it to the point where I felt comfortable having it develop the implementation plan for Version 1 (V1).

The implementation plan ended up consisting of 17 checkpoints designed to incrementally build the system from the ground up using the documentation as its source. The full [V1 execution plan](https://github.com/daniel-maratta/paper-binder/blob/main/docs/archive/v1/checkpoints/execution-plan.md) is available in the repository. The plan bootstrapped the app, set up the data layer, built out the central “trunk” of the system (reusable components), moved on to building the tenant concept, security shape, object models, the front-end (including the user flows), and then finally executed hardening and release preparation passes. Though some minor hiccups were encountered along the way, I was generally impressed with the agents’ progress.

After the execution plan was completed, it came time to deploy the app and ensure it could run in a production environment. This process ended up requiring me to perform a lot of hands-on work, especially when it came to setting up the cloud infrastructure. Part of the reason for this was because I wanted to understand what resources I was acquiring and why rather than hand it off to an agent. However, after some back-and-forth and trial and error, I was able to successfully deploy PaperBinder into production.

After releasing V1, I decided to do a release-candidate review process. This involved running some audits across the entire application using frontier-class AI models. The results were interesting and revealing. While the app was up and running well enough already, the audits I performed nonetheless caught some things that would have likely turned into future tickets in a production app. I’ll get into more detail on this later.

Ultimately, each release candidate was subjected to build and test validation, Docker-backed integration tests, browser-level end-to-end testing, documentation validation, security checks, and an independent review pass. Findings were converted into scoped remediation tasks and independently verified before release. This created a repeatable chain from implementation to review, remediation, verification, and release acceptance and helped improve code quality and confidence when shipping to production.

![Workflow diagram showing PaperBinder development moving from implementation through validation, audit, remediation, verification, and release acceptance.](/presentation/workflow-diagram.svg)

*^Figure 2. The process that governed most of PaperBinder's development.^*

## What PaperBinder Required

PaperBinder is somewhat unusual in its design because it needs to simultaneously act like a real enterprise app without accruing the bloat and maintenance overhead that many apps must contend with. Because of this, PaperBinder prioritizes tenant isolation, authentication, authorization, lifecycle cleanup, deployment, and reviewer-facing documentation as real system concerns while hedging against overbuilding.

PaperBinder uses ASP.NET Core Identity for auth and identity management on the back-end. It also uses a browser-based, same-organization deployment model and server-managed cookie authentication rather than exposing bearer tokens to the frontend to maintain its CSRF and cross-subdomain requirements. Tenancy is enforced via middleware and protected API handling, and tenant membership is checked against the requested tenant. Data access is consistently predicated by tenant ID and the Entity Framework (EF) model utilizes tenant-scoped foreign keys and composite keys where relationships cross the tenant boundary.

PaperBinder uses Dapper for the runtime data-access layer and EF Core as the schema and migration tool. What this means is that Dapper backs the runtime services for tenants, membership, leases, binders, documents, the user identity store, and other such items, while EF Core is responsible for modeling and keeping track of the PostgreSQL schema. The reason for this split is mostly for tenant isolation, since PaperBinder treats tenant isolation as a security boundary, meaning that runtime data access must be tenant-scoped by construction rather than utilizing a “fetch then filter” approach. This decision is documented in Architecture Decision Record [ADR-0007](https://github.com/daniel-maratta/paper-binder/blob/main/docs/90-adr/ADR-0007-persistence-stack-ef-core-migrations-dapper-runtime.md).

New tenants and users are provisioned with generated passwords using a back-end password generator to help facilitate faster demos. This is simply so that reviewers do not have to spend time with setup; but even so, the generated credentials are hashed via IPasswordHasher and passwords obey the existing security architecture, including all security boundaries and auth requirements.

I chose to do a minimal auth setup to reduce costs, but if PaperBinder were to become a full commercial app, I would transition to using an authentication provider instead so that PaperBinder wouldn’t be responsible for storing and protecting passwords itself.

On the topic of overbuilding, I chose to make demo tenants ephemeral. This had some interesting implications and benefits:

- Robust and comprehensive audit logging is no longer an implied requirement (though there is still basic logging present in the app)
- PaperBinder no longer needs to persist and maintain data on longer time scales
- It provides an opportunity to demonstrate not just tenant creation but also cleanup jobs and tenant deletion from a server standpoint

In other words, it helped to demonstrate the complete tenant lifecycle without the overhead of maintaining everything in between, other than live data, which persists with the tenant as long as the tenant exists, even if the user logs out.

As for the deployment infrastructure, PaperBinder uses Docker Compose, GitHub Container Registry (GHCR) images, Caddy, and DigitalOcean, just to name the major pieces. I decided not to use comprehensive logging or automated backups and restores since PaperBinder is a demo app with ephemeral tenants and I didn’t want to incur those ongoing maintenance costs. These features would be essential and expected in real commercial products, but are unnecessary for a demo app.

PaperBinder also has a very rich documentation layer for both AI agents and human reviewers. Anyone who is interested in further reviewing the application code should check it out at [my GitHub repository](https://github.com/daniel-maratta/paper-binder), starting with [the README.md file](https://github.com/daniel-maratta/paper-binder/blob/main/review/README.md) in the `/review` directory.

## Where AI Helped

When using LLMs in building applications, I have found that they can be largely beneficial. AI assistance can often produce a broader and more heavily verified implementation, resulting in net-higher-quality code in substantially less time than writing everything by hand. A key to this is learning how to communicate with LLMs and to know what pitfalls to avoid while also raising awareness around potential issues that might otherwise be missed.

### Five Major Categories of AI Work

There are at least 5 major categories of work I’ve found AI assistance falls into:

- Generation
- Exploration
- Transformation
- Verification
- Coordination

Each category has its particular focus and strength, and PaperBinder was built using LLMs in all these capacities throughout the development process.

#### Generation

Most people are familiar with the Generation category, which is straightforward. This is where an agent is given an objective and it attempts to generate a solution that accomplishes that task.

#### Exploration

Closely related to Generation is Exploration, which involves utilizing AI agents to evaluate and compare different potential solutions. Using AI for Exploration is valuable because it can help engineers vet ideas and can act as a sanity check before writing any code.

#### Transformation

Transformation is where AI is tasked with taking an existing solution and improving it in some way. Because it touches things like major refactors, documentation synchronization, test updates, and other brownfield work, it can be perceived as a risky category. However, as with many things AI-related, it has everything to do with setting up a framework that AI models can easily understand and use. When a codebase is allowed to be properly mapped out, LLMs can excel at “understanding” the codebase, data flows, security concerns, and identifying issues. The fundamental concept here is not just giving the agent license to do whatever it wants to do. Instead, a good approach is to have the agent scope out the work surface, identify major points of interest, and then make recommendations. At that point, a software engineer can then make informed decisions and instruct the agent accordingly. Keeping humans at the center of critical decision-making is essential to building better software with confidence.

#### Verification

Verification tasks include having an agent perform code reviews and audits. Many engineers are already familiar with code reviews – having an agent perform a code review is a type of Verification-category work.

However, audits can be particularly beneficial when building software applications. Audits can substantially reduce the risk of LLM hallucinations and derailments by examining the system across architectural boundaries rather than only within the immediate implementation context. Specifically, audits operate at a higher level than the code functions and files, where many LLM code reviews take place.

From my personal experience building PaperBinder, there are some rules of thumb when using agents to perform audits. For starters, an agent performing an audit should not be the same agent that is building the feature being requested. Further, reviews and audits performed with fresh context often produce more value as opposed to iterating inside the same agent context. Performing independent agent audits with fresh contexts and well-defined audit objectives was essential to gaining value from the process.

#### Coordination

Coordination tasks have to do with allowing different agents (whether human or AI) to work together and to understand what is happening at a deeper level than any one individual can comprehend in isolation. Utilizing multiple agents to perform tasks often provides more benefit than having a single agent perform that same task. Take a code review or audit and its remediation for example. When using probabilistic agents, “getting a second opinion” can save you a lot of headaches. For example, one particular agent may recommend refactoring a piece of middleware, but a second opinion from another agent or two (especially using other models) can result in helping an engineer understand why the first agent made the recommendation it did. From there the engineer can use the agents to cross-check each other’s recommendations and advice. The results from doing this are oftentimes better than any of the individual recommendations would be in isolation.

While working on PaperBinder, I collected independent recommendations from multiple models, exposed each recommendation to critique from the others, and then made the final decision based on the resulting points of agreement and disagreement on several occasions. To take the process a step further, I have taken to assigning “roles” to various agents and using them in parallel as a “team” for the purpose of building new features or remediating bugs. This has helped me develop better solutions on multiple occasions.

## Where AI Assistance Broke Down
Not everything was perfect when it came to using LLMs to build a production-shaped SaaS demo, however. At one point, a security audit found that there was a tracked local Data Protection key that had been committed to the repository. While it was only for the local environment, was not production-active, never part of the production or shared-test key rings, and had expired, it still violated PaperBinder’s public-repo safety rules and required remediation. The remediation actions included removing the tracked key from the GitHub tree, ensuring that any Data Protection key artifacts were ignored going forward by adding the key path to `.gitignore`, establishing new guardrails as a CI step that would fail the build if that class of file were ever to be tracked again, and documenting the incident.

Another issue that an independent code quality audit found was that the actual code shape, while quite functional and perfectly capable, is not always the most maintainable for a real production-shaped app. For the back-end that means that there is code surface that is overly ceremonious and has an “AI smell,” mostly because it repeats certain code and consolidates other code into single files where they would likely need to be split out for easier maintainability. The problems on the front-end are mostly similar, where some files are carrying larger-than-necessary responsibility for certain areas of the app.

Since that audit, I have taken action on remediating code shape issues in the back-end and front-end, including addressing backend hotspots and other unnecessarily complicated code surfaces. However, two notable areas remain: parts of the frontend still concentrate too much component logic and view state into monolithic files, while portions of the API retain more ceremony than the application's complexity warrants. For the time being, I have chosen not to force broad architectural refactoring into the current version as those changes are better suited to a later minor release where they can be scoped, reviewed, and verified independently. In the meantime, the known issues are documented as carry-forward items rather than hidden defects. The code shape is likely one of the first things I would remediate in a future release of PaperBinder.

![PaperBinder v1 public interface before the frontend redesign.](/presentation/before-redesign.png)
*^Figure 3. PaperBinder as it looked during v1.^*

Finally, I encountered unexpected difficulty when redesigning the front-end for the app. I initially tried allowing Codex to generate a site layout on its own. While it was functional and worked for V1, I soon decided to replace it with a more product-shaped UI. However, this process proved to be more work than I anticipated.

To start out, I came up with a new design that I greatly preferred over the original Codex attempt and employed Codex in transitioning the front-end from the original to the new look. However, it simply kept failing to match the concept art I had and kept trying to shove the new design into the old layout, even when I directly gave Codex exact images of the new layout and even a front-end mockup based on the images that matched the concept extremely closely.

As it turned out, the documentation that I had put in place for v1 was too entrenched, meaning that when coding agents tried to update the front-end look-and-feel, they kept running into v1 constraints that would shackle them to the old v1 layout.

What I eventually had to do to solve this problem was two-fold. First, I had to create a new code workspace and create a one-to-one conversion from image to code. Second, I then had to go into the documentation and update the v1 docs to explicitly say that v1 had been achieved and that we were now performing v1.1 work which included a front-end rewrite. After doing these two things, it mostly worked, though I had to perform a few more audits to get everything tightened up to the point where I was satisfied.

![PaperBinder public interface after the v1.1 frontend redesign.](/presentation/after-redesign.png)
*^Figure 4. PaperBinder after the successful front-end rewrite.^*

## Lessons Learned

Throughout this process, I learned several things about using LLMs to build apps. For one thing, I’ve determined that documentation is mandatory for agents to work efficiently and is key to shaping agent behavior. Keeping documentation up to date is also very important to having well-functioning agents. Stale documentation can be more dangerous than missing documentation because it gives incorrect constraints authority.

It has always been highly advised to write tests when shipping code. However, now that LLMs have entered the picture, tests are becoming even more essential from a code confidence standpoint than they already were. LLMs are probabilistic by nature, making shipping under-tested software much harder to justify. Probabilistic implementation needs deterministic acceptance criteria – shipping to production without tests while utilizing an LLM to perform the implementation work is not just risky but arguably irresponsible as well.

Context management is also highly important when building apps using LLMs. Poor context structuring can waste many dollars and hours, not to mention that it can significantly degrade agent quality. Context affects cost, attention, consistency, and model performance. Good task decomposition is therefore both a technical and economic discipline.

On the topic of reviews and audits, something that is important to realize is that they both serve different purposes and operate at different scales. Reviews are lower-level and closer to the task at hand whereas audits examine cross-cutting system properties and accumulated drift. Both are needed, useful, and should be utilized as a standard part of the app-building process.

When having humans review code generated by LLMs, an engineer should strive to keep Pull Requests (PRs) manageably small and focused. That doesn’t necessarily mean that every line of code requires its own PR, but it does mean that code changes should be kept to a level where it is tenable for a human reviewer to be able to get a grasp on what’s going on and not be overwhelmed. It’s more about keeping changes understandable than it is about arbitrary PR size. A software engineer should take care to be disciplined and keep items scoped as tightly as possible for review and auditing purposes. When using agentic AI, it also translates into better context management as well.

Finally, human judgment must be the foundational guiding force behind everything that the agents are tasked to do. Ultimately, it takes real people driving AI agents to make them work and when something goes wrong it always falls back onto the human decision maker that signed off on the decision – not the agent. The engineer is the one that should approve architecture, risk, and release decisions. Therefore, it is paramount that software engineers take the responsibility of ensuring that they are confident in and understand the code that they are shipping and putting out into production because if it breaks the responsibility will fall on them.

## Conclusion

All in all, I consider PaperBinder a success. It accomplished what I set out for it to do – it is a functional yet constrained, deployed, production-shaped SaaS-like application with real enforced security, tenant isolation, and auth considerations all implemented and honored. Multiple independent hiring-oriented agent reviews of the code base reached a solid conclusion: the repository bears the marks of agent implementation, but its architecture, security model, testing discipline, and release process were found to be credible engineering work (see [T-0045](https://github.com/daniel-maratta/paper-binder/blob/main/docs/05-taskboard/tasks/T-0045-v1-1-engineering-security-architecture-closeout.md) in the repo documentation). This is important because PaperBinder was never intended to hide that AI was used; on the contrary, it was intended to test whether I could use LLMs responsibly to direct the build and publicly demonstrate that such a project could be built safely using LLMs.

Of course, if I were to make PaperBinder a true commercial product, there are a few things that would need to be changed. First, I would complete the auth and user creation flows. Second, PaperBinder would need a true reporting backend that could tie into the existing OTel implementation. Third, I would enable database backups and put them on a schedule. Fourth, I would also reevaluate whether increased scale or reporting requirements justified a fuller CQRS architecture or separate read model. Beyond all that, I would investigate distributed hosting options and potentially database sharding if necessary.

PaperBinder is concrete evidence that modern web applications can be built in a responsible manner when software engineers leverage LLMs appropriately. In my view LLMs make software engineers more powerful rather than redundant as many may believe. But it takes a willingness on the part of the software engineer to embrace the fact that they aren’t purely just an engineer anymore – especially full-stack engineers. On the contrary, they must also now act as a product translator, system designer, reviewer, verifier, and operator. The implementation may be generated faster, but the engineer remains responsible for defining what should exist, determining whether it is correct, and deciding whether it is safe to ship to be fully effective in the software development industry today.
