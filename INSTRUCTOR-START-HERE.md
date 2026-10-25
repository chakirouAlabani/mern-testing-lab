# Understand CI and CD by following one real application

This is an instructor learning lab for 420-530-LE, not a student lecture. Start with the application commands, then follow the same commands through GitHub Actions and GitLab CI/CD. Use the actual runs and failures as evidence. The lecture DOCX is a shorter teaching outline; it is not the operating manual for this repository.

## 1  Start with the application

The application is the existing MERN Notes app. React is the interface, Express handles HTTP requests, Node executes the backend, and MongoDB stores accounts and notes. Users sign up, receive a session cookie, and create private notes.

Without CI, a developer can already run tests and builds. CI makes a shared machine repeat that work for a source revision and report its result. The CI service does not invent the tests or decide what the application should do. Those decisions live in this repository.

Follow the chain:

```text
Source revision
   ├── backend job: install → wait for Mongo → typecheck → tests → build
   └── frontend job: install → typecheck → tests → build
                         ↓ both successful
                   package release candidate
                         ↓ separate decision
                  deploy → verify running app
```

Each arrow is a dependency or a sequence of commands. The two jobs may run at the same time if runners are available. A runner is a worker; a workflow or pipeline is the plan it follows.

## 2  Understand each application command

The files `ci/backend.sh` and `ci/frontend.sh` are ordinary shell scripts. Both platforms call these same scripts. You can run them without either platform.

| Command or setting | What it actually does | What it does not establish |
|---|---|---|
| `set -eu` | Stops the shell on a failing simple command or an unset variable. These scripts contain no pipelines that hide a command's exit code. | It does not decide whether a test is meaningful. |
| `cd backend` or `cd frontend` | Selects the package whose scripts and lockfile npm will use. | It does not affect a later, separate GitHub run step. |
| `npm ci` | Deletes/recreates that package's installed dependencies using the committed lockfile. A manifest/lock mismatch fails. | It does not mean continuous integration by itself; `ci` here names an npm installation command. |
| `--no-audit --no-fund` | Omits installation audit/funding output to keep this lesson focused. | It is not a vulnerability check. This lab has no security scan gate. |
| `node ../ci/wait-for-mongo.cjs` | Repeatedly connects and pings the isolated MongoDB service, with a bounded retry loop. | Starting a database container does not itself prove that it is ready. |
| `npm run typecheck` | Runs TypeScript without emitting output and returns failure on type errors. | It cannot prove that a correctly typed business rule is right. |
| `npm run test:ci` | Executes the package's test suite once and exits. | It does not create a persistent web deployment. |
| `npm run build` | Compiles backend TypeScript to `backend/dist` or bundles React into `frontend/build`. | It does not publish these files to a website. |

Read `package.json` whenever a command uses `npm run`. Names such as `test:ci` and `build` are project-defined names. The backend uses Jest with `--runInBand --ci`. The frontend uses Create React App's test command with `--watchAll=false --runInBand`. `runInBand` uses one test process, which simplifies shared database setup and classroom resource use.

The environment variable `CI=true` tells tools they are running unattended. Create React App also treats build warnings more strictly in CI. It is a tool behavior setting, not a command that creates a pipeline.

The backend build uses `tsconfig.build.json` to compile application code and include its session type declarations while excluding test files. The normal typecheck can still inspect test code. Otherwise a build that includes tests can change the output directory layout and leave `dist/server.js` missing.

## 3  Know exactly what the tests exercise

Backend: four suites, ten tests at the verified baseline. Unit tests check authentication decisions and the defined-value helper. A mock test checks how the notes controller responds to a simulated database failure. Integration tests use Supertest, real Express routes and middleware, real Mongoose models, and an isolated MongoDB database. They check sign-up/login, access denial, note CRUD, ownership restrictions, and logout.

Supertest calls the Express app in the test process. The tests do not need the normal public server listening on port 5000. An app factory lets each test construct the app with a short-lived in-memory session store; the normal server still supplies MongoStore. The database queries in integration tests remain real.

The test database is `mern_workshop_test`. Its integration test checks the database name before deleting records. `tests/env.cjs` supplies test-only session and port values and maps `TEST_MONGO_URI` to the environment name the application expects. These are disposable values, not production credentials.

Frontend: three suites, eight tests at the verified baseline. They cover the logged-out message, note-dialog interaction, and API-client behavior with controlled responses. They do not establish that a browser can reach a real production API. The separate deployment smoke test checks actual HTTP requests and database behavior, but is not a full browser automation suite.

Expected HTTP failures such as 401 and 404 can produce error logs while tests still pass. Judge the assertions, test summary, and exit code; a stack trace alone is not proof that the suite failed. Conversely, a green test suite only covers the selected behaviors.

## 4  Run it yourself locally

From the root of this lab, with Docker Desktop running in Linux container mode:

```powershell
docker compose -p week9-ci-study -f ci/local-checks.yaml run --rm backend
docker compose -p week9-ci-study -f ci/local-checks.yaml run --rm frontend
```

The first run downloads images or dependencies as necessary. The named module volumes keep Linux dependencies separate from Windows. Each invocation still runs `npm ci`; reuse of a volume does not skip installation. MongoDB has temporary storage and no published host port. Neither command starts the normal development app or touches a production database.

For a repeatable failure, change `frontend/src/components/NotesPageLoggedOutView.tsx` from `Please login to see your notes` to `Welcome to the notes app`. Run the frontend command again. The existing test requires the login instruction, so the test should fail and the script should stop before the production build. Restore the original text, then run again.

Do not “repair” this experiment by deleting the test or ignoring its exit code. The exercise intentionally violates an agreed behavior. Restoring that behavior makes the existing check pass again.

## 5  Follow GitHub Actions from the event to the worker

Open `.github/workflows/mern-ci.yml` beside this section.

1. `name` labels the workflow in Actions.
2. `on.push.branches` selects pushes to `main` and the dedicated instructor branch. Other feature branches are checked when they have a pull request targeting `main`.
3. `on.pull_request.branches` filters the target branch, not the source branch. GitHub normally checks a synthetic merge revision for this event, so the PR run's tested SHA can differ from the branch head.
4. `workflow_dispatch` defines a manual trigger. GitHub's normal manual-run interface requires the workflow to exist on the default branch. This branch-only lab relies on push and PR events initially.
5. `permissions.contents: read` restricts the workflow token's repository permissions. It does not give Node or npm application credentials.
6. `jobs.backend` and `jobs.frontend` are independent job identifiers. There is no implicit ordering based on which one appears first in the file.
7. `runs-on: ubuntu-latest` asks for a GitHub-hosted Ubuntu VM. Node 22 is selected explicitly instead of relying on whatever Node happens to be installed.
8. `timeout-minutes` bounds the job. It is not a test's own timeout.
9. `services.mongo.image: mongo:7` starts a fresh MongoDB container for the backend job. Its mapped port lets commands on the VM use `127.0.0.1:27017`. The wait script handles readiness before tests.
10. Job-level `env` is available to its steps and child processes. The frontend has no MongoDB service because its present tests do not use one.
11. Each `steps` entry runs in order. `uses` invokes reusable action code. `run` invokes a shell command. `with` supplies inputs to an action.
12. `actions/checkout` fetches the source revision into the workspace. `persist-credentials: false` avoids leaving its token configured for subsequent Git commands.
13. `actions/setup-node` puts the selected Node distribution on PATH. The action version and `node-version` are different versions: one selects the setup helper, the other selects the application's runtime.
14. `sh ci/frontend.sh` or `sh ci/backend.sh` runs the application checks. A nonzero script exit fails the step and job. Later normal steps in that job are skipped.
15. `upload-artifact` retains compiled output outside the temporary VM. `if-no-files-found: error` catches a missing output path.
16. `package.needs` waits for both check jobs to succeed. It does not copy their files.
17. The package job starts with a separate filesystem. Checkout gets scripts and manifests; `download-artifact` supplies the compiled output from the check jobs.
18. `BUILD_REVISION: ${{ github.sha }}` records the workflow's tested source revision. GitHub evaluates the expression before passing the value to the shell.
19. `ci/package.sh` assembles the candidate. A final upload retains it as `release-candidate`. This job does not deploy.

The example uses action v4 tags as a deliberately consistent teaching baseline. These are not claims about the newest versions. A tag is movable; a full reviewed commit SHA offers stronger pinning. Neither this file nor a green badge automatically prevents merges: required status checks must be configured in repository rules. The lab leaves the repository's existing merge policy alone.

Because this dedicated branch matches the push rule and also has a PR, one change can produce a push run and a PR run. That is deliberate here so you can compare the event types. In a normal teaching repository, remove the dedicated branch from the push filter after the experiment if you only want default-branch pushes and PR checks.

Official references: [workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [service-container networking](https://docs.github.com/en/actions/tutorials/use-containerized-services/use-docker-service-containers), [artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data).

## 6  Translate the same work into GitLab

Open `.gitlab-ci.yml`. The application and shell scripts are the same; the orchestration language changes.

| GitLab setting | What happens in this implementation |
|---|---|
| `workflow.rules` | Decides whether GitLab creates a pipeline. Rules are considered in order. MR pipelines are allowed; a push with open MRs is then suppressed to avoid a duplicate branch pipeline. Default-branch and instructor-branch pushes, plus manual web pipelines, are allowed. |
| `stages: [check, package]` | Defines the stage order. Both check jobs belong to `check`; packaging belongs to `package`. |
| `default.image` | Selects `node:22-bookworm` as the job container image for a compatible Docker runner. It is not equivalent to selecting the host VM with GitHub `runs-on`. |
| Job `timeout` | Bounds each check job to 15 minutes and packaging to 5 minutes, subject to runner/project limits. It does not replace a test's own timeout. |
| `variables` | Supplies environment values to commands. GitLab predefined variables identify the pipeline source and source revision. |
| `backend.services` | Adds a MongoDB service container with DNS alias `mongo`. The job container connects to `mongo:27017`, not to its own localhost. |
| `script` | Lists shell commands. Here it invokes the same tested script used on GitHub. |
| `artifacts.paths` | Retains job output, using paths relative to the checkout root. Artifacts are uploaded on success by default. |
| `expire_in` | Requests artifact retention. It does not keep the job container alive. |
| `needs` with `artifacts: true` | Declares upstream jobs and downloads their artifacts into the package job. |
| Job `rules` | Includes each job for permitted pipelines, with normal success-dependent execution. These rules do not replace the earlier pipeline-level workflow decision. |

GitLab Runner normally retrieves the repository before `script`; that is why there is no `actions/checkout` equivalent in this file. With a Docker executor, the runner prepares the job container and its services, then executes commands and uploads artifacts. A shell executor behaves differently and does not make `image` provision a container automatically.

If a check fails, packaging normally does not execute. `allow_failure: true` would change how a failure affects the pipeline; it is deliberately absent. With enough runner capacity the backend and frontend can overlap. A job staying pending often means no eligible runner is available; it is not the same as a failed test.

The local Docker checks verify these shared command sequences and container networking, but they are not a hosted GitLab run. GitLab CI Lint, workflow rules, runner eligibility, artifact transfers, and MR behavior must also be verified on the intended GitLab instance. Hosted results require a GitLab project and runner; no GitLab project was supplied for this initial exercise.

Official references: [first pipeline](https://docs.gitlab.com/ci/quick_start/), [workflow](https://docs.gitlab.com/ci/yaml/workflow/), [job rules](https://docs.gitlab.com/ci/jobs/job_rules/), [Docker executor](https://docs.gitlab.com/runner/executors/docker/), [artifacts](https://docs.gitlab.com/ci/jobs/job_artifacts/), [YAML reference](https://docs.gitlab.com/ci/yaml/).

## 7  Make the build and deployment distinction tangible

After successful checks, these files exist:

```text
backend/dist/       JavaScript for Node to execute
frontend/build/     Static HTML, JavaScript, CSS and assets
```

They are just files. Package them from the repository root:

```powershell
docker run --rm -v "${PWD}:/project" -w /project -e BUILD_REVISION=local-study node:22-bookworm sh ci/package.sh
```

`release/` now contains compiled code, backend dependency manifests, a tiny teaching runtime, a Dockerfile, and `REVISION`. It contains no `.env` or test database. The runtime serves React and proxies `/api/` to the compiled backend so both use one browser origin. The Docker image installs backend runtime dependencies; it does not rebuild React or TypeScript.

Actually deploy the candidate to a disposable local environment:

```powershell
docker compose -p week9-release-study -f ci/demo-deploy.yaml up -d --build
docker run --rm --network week9-release-study_default -v "${PWD}:/project:ro" -e DEMO_URL=http://app:3000 node:22-bookworm node /project/ci/smoke.cjs
```

The app is bound to local port 5099. The smoke check fetches the compiled React HTML, signs up a disposable account, retains the returned session cookie, creates a note, reads it back through the API, and deletes it. Real MongoDB is involved. This establishes that selected running behavior works after deployment. It does not replace a full browser journey, load testing, or production security review.

This demo database is temporary. Stopping its container discards its data. The fixed demo session secret is explicitly for this throwaway environment. Real hosting requires a protected secret, persistent storage, TLS, operational monitoring, and an actual release strategy. None is configured by merely adding the word `production` to YAML.

## 8  Place CI, delivery and deployment on this chain

**Continuous integration:** small changes are integrated frequently and checked. Our two platform files implement the automated checks and candidate packaging portion. Team integration habits and enforced merge rules are additional parts of the practice.

**Continuous delivery:** the release process keeps a passing candidate ready to release, while a person or business decision authorizes production. In this lab you can see that boundary by inspecting the candidate and then explicitly choosing to run the deployment command. A local manual deployment demonstrates the approval boundary; it is not evidence that a production delivery system exists.

**Continuous deployment:** an eligible passing change automatically invokes the real release command and verifies it, without routine human approval for each production release. Both platforms can do this; the release destination and permissions must exist first.

For GitHub, an extension usually adds a downstream job that downloads the exact candidate and runs a deployment script. An environment can require reviewer approval before that job proceeds. `environment: production` alone does not configure approval; reviewers/protection and credentials are separate settings, and availability depends on the repository/account.

For GitLab, an extension adds a deployment job. `when: manual` plus explicit `allow_failure: false` can make it a blocking release decision. Running it automatically on successful default-branch pipelines instead demonstrates the automatic path, once a real target is configured. `environment` names a deployment environment; it does not provision your server or deploy your app by itself.

Do not add an `echo "Deployed"` job and describe it as deployment. A meaningful deployment has a destination, candidate identity, access method, release command, post-deploy verification, and a recovery approach. A rollback often redeploys an earlier immutable artifact; database schema changes may need a separate plan. This lab verifies an isolated candidate deployment and does not claim a hosted production release.

## 9  Debug in the right order

1. No pipeline: inspect file location, event filters, workflow rules and CI enablement.
2. Pending job: inspect eligible runners, their status and capacity.
3. Checkout/setup failure: inspect permissions, action resolution or image access.
4. Install failure: inspect package/lock consistency, registry access and native dependency support.
5. Database failure: inspect hostname, readiness and the isolated URI.
6. Typecheck failure: inspect the compiler error and source line.
7. Test failure: read expected versus actual behavior and test name.
8. Build failure: inspect compilation/bundling output; passing tests do not guarantee a passing build.
9. Packaging failure: inspect upstream results, artifact names and paths. `needs` cannot conjure missing files.
10. Deployment/smoke failure: inspect runtime environment, credentials, service reachability and logs.

A retry repeats work for the same revision. A repair changes the cause, creates a new revision, and produces new evidence. Do not use a retry to hide a reproducible defect.

## 10  Rehearse before teaching

Before presenting the student lecture, be able to answer these without the glossary:

- Which file determines when the automation starts?
- Which command actually runs the tests, and where is that command defined?
- Where does the job execute, and why is MongoDB localhost on one platform but a service hostname in the container example?
- Why must each independent check job install its dependencies?
- Which test catches the deliberate login-message regression?
- Why does a failed frontend test stop packaging even if the backend passes?
- How do compiled files reach a different job?
- What files make up the candidate, and which exact source revision produced it?
- What action actually makes the application run for users?
- Where would a production approval happen, and what changes for automatic deployment?

Explain GitHub first using its verified run. Then use the GitLab file to translate familiar steps. Do not teach two orchestration languages before you can trace the shared commands through one of them.

When finished, stop only the two disposable environments created for this lesson:

```powershell
docker compose -p week9-ci-study -f ci/local-checks.yaml down
docker compose -p week9-release-study -f ci/demo-deploy.yaml down
```

Named dependency volumes remain available for another run. No general Docker cleanup is required.
