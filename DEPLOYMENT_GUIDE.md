# SquarePicks LLC - Deployment Guide (Internal Use)

**Purpose:** To document the standard procedures for deploying updates to the SquarePicks application (frontend and backend) to various environments (Development, Staging, Production).

**Last Updated:** 4/10/2025

---

## 1. Prerequisites

*   Access to [Specify: e.g., GitHub/GitLab/Bitbucket Repository]
*   Access to [Specify: e.g., Vercel/AWS/GCP Console]
*   Required CLI tools installed ([Specify: e.g., `git`, `node`, `npm`/`yarn`, `vercel` cli, `aws` cli])
*   Environment variables configured locally for testing (see `.env.example`).
*   Understanding of Git branching strategy ([Specify: e.g., Gitflow, GitHub Flow]).

---

## 2. Environments

*   **Development (`dev`):** Used for active development and feature branches. Typically deployed automatically from feature branches or manually for testing.
*   **Staging (`staging`):** Pre-production environment mirroring production as closely as possible. Used for final testing, QA, and user acceptance testing (UAT). Deployed from the `main`/`develop` branch after features are merged.
*   **Production (`prod`):** Live environment accessible to users. Deployed from a stable `main` or specific release branch after staging verification.

---

## 3. Branching Strategy Overview

*   **Feature Branches:** Create branches off `develop` (or `main`) for new features/bugfixes (e.g., `feature/add-new-board-type`, `fix/login-bug`).
*   **Pull Requests (PRs):** Submit PRs from feature branches to `develop` (or `main`). Requires [Specify: e.g., code review approval, automated tests passing].
*   **Merging:** Merge approved PRs into `develop` (or `main`).
*   **Release Branch (Optional):** Create `release/vX.Y.Z` branches from `develop` for preparing production releases.
*   **Production Merge:** Merge release branch (or `develop`) into `main` and tag the release (e.g., `git tag v1.0.0`).

---

## 4. Deployment Steps

**(Note:** Customize these steps heavily based on your specific hosting and CI/CD setup.)

**A. Frontend Deployment (Example: Vercel)**

*   **Development:** Usually automatic via Vercel's Git integration for feature branches (preview deployments).
*   **Staging:** Automatic deployment triggered upon merging PRs into the `develop`/`main` branch (connected to a Staging project in Vercel).
*   **Production:**
    1.  Ensure the `main` branch (or release branch) is stable and tested on Staging.
    2.  Merge the release branch into `main` (if applicable).
    3.  Tag the release commit: `git tag vX.Y.Z` & `git push origin vX.Y.Z`.
    4.  Automatic deployment triggered upon pushing to the `main` branch (connected to the Production project in Vercel).
    5.  **Manual Promotion (Alternative):** Promote a specific Staging deployment to Production via the Vercel dashboard if auto-deploy from `main` is disabled.
*   **Verification:** Check Vercel deployment logs. Perform smoke tests on the deployed environment.

**B. Backend Deployment (Example: Serverless Framework on AWS Lambda)**

*   **Prerequisites:** AWS credentials configured for the Serverless Framework.
*   **Development/Staging:**
    1.  Checkout the relevant branch (`develop` for Staging).
    2.  Run deployment command: `sls deploy --stage [dev|staging]`
*   **Production:**
    1.  Checkout the stable `main` branch or tagged release commit.
    2.  Run deployment command: `sls deploy --stage prod`
*   **Verification:** Check CloudWatch logs for errors. Test API endpoints.

**C. Database Migrations (Example: Prisma Migrate)**

*   **Development:** Apply migrations directly: `npx prisma migrate dev`
*   **Staging/Production:**
    1.  Generate migration SQL (locally or in CI): `npx prisma migrate diff --from-empty --to-schema-datamodel <SCHEMA_PATH> --script > migration.sql` (Review the SQL carefully!)
    2.  **OR** `npx prisma migrate deploy` (Applies pending migrations directly - ensure app is offline or handles this gracefully).
    3.  Apply migration to the target database (manually via SQL client or using the `deploy` command).
    4.  **Important:** Coordinate database migrations with backend/frontend deployments to ensure compatibility. Often run *before* deploying new code that depends on schema changes.

---

## 5. Rollback Procedures

*   **Frontend (Vercel):** Instantly rollback to a previous deployment via the Vercel dashboard.
*   **Backend (Serverless Framework):**
    *   Redeploy the previous stable version: `sls deploy --stage [stage] -v <PREVIOUS_VERSION_TIMESTAMP>` (Requires knowing the timestamp).
    *   **OR** Checkout the previous stable commit/tag and run `sls deploy --stage [stage]`.
*   **Database:** Rollbacks often require restoring from a backup or applying a counter-migration script. More complex and potentially data-lossy. Design schemas for backward compatibility where possible.
*   **Decision:** Rollback decisions should be made by the Incident Commander or Technical Lead based on the severity of the issue found post-deployment.

---

## 6. Post-Deployment Checklist

*   [ ] Verify application accessibility and core functionality in the target environment.
*   [ ] Check monitoring dashboards (Sentry, Datadog, CloudWatch) for new errors or performance regressions.
*   [ ] Monitor user feedback channels for any reported issues.
*   [ ] Announce successful deployment completion in [Specify Channel: e.g., #deployments Slack channel].

---

**Contact:** For deployment issues or questions, contact [Name/Role, e.g., DevOps Lead, Technical Lead]. 