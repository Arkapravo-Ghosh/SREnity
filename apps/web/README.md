This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Google Analytics / Tag Manager

The root layout mounts `src/components/site/Analytics.tsx` once for all routes. It uses Next.js's `@next/third-parties/google` components, which load Google scripts after hydration.

Set `NEXT_PUBLIC_GTM_ID=GTM-WQ7QXHXR` in `apps/web/.env.local` for local development and in the deployment environment before building. Restart the dev server after changing it; production needs a new build because `NEXT_PUBLIC_` variables are bundled at build time.

Configure and publish the GA4 Google tag inside that GTM container. Existing `track()` calls push named events and their parameters into GTM's `dataLayer`; configure matching Custom Event triggers and GA4 event tags in GTM to forward them. Enable GA4 Enhanced Measurement's browser-history page changes for client-side navigation pageviews.

`NEXT_PUBLIC_GA_ID` remains available for direct GA4 setup when GTM is unset. GTM takes priority when both are configured, preventing the app from also loading a separate direct GA4 tag. With neither set, Google tracking is disabled. Vercel Web Analytics remains enabled independently.

## Authenticated ServiceNow demo

`/demo` requires a user account managed by the sibling FastAPI `srenity-connector` service. Set `SRENITY_CONNECTOR_URL` and `SRENITY_SESSION_SECRET` from `.env.example`, provision an account with the connector CLI, and run `npm run dev -- --hostname 127.0.0.1 --port 3000`. Visit `/demo/login`.

Login sessions and provider connections are isolated per admin. The browser holds an opaque HttpOnly login session plus an encrypted selected connection reference. The Next.js server proxies requests to the connector under that user's identity; no ServiceNow credentials, PKCE verifier or deployment-wide admin key is stored here. Saved connections persist across sign-out. The server checks ownership before opening a selected connection and checks request origin on all mutations.

Configure an OAuth app separately on each target ServiceNow instance and add an admin-owned registration through the connector. Its callback must exactly match this deployment, e.g. `http://127.0.0.1:3000/api/servicenow/callback`. A client registered on one PDI does not automatically work on another. Full setup, PostgreSQL schema, key rotation, additional-provider workflow and tests are documented in the sibling `srenity-connector/README.md`.

`/demo/prometheus` manages multiple account-owned monitoring URLs (no authentication, bearer token, or Basic authentication), showing live targets/alerts and bounded PromQL queries. Private endpoints require the FastAPI operator's exact `PROMETHEUS_ALLOWED_ORIGINS` allowlist. The current NetSim URL is local to the connector host.

Connected ServiceNow demos display a native app card. **Install app** is offered only for an absent bridge app, using the connector's pinned official-SDK package and durable install tracker. An existing complete app shows **App installed**; upgrades and incomplete applications require admin review. See `srenity-connector/servicenow/README.md` for required instance permissions, package fallback and fresh-PDI qualification limits.

The disconnected/new-instance screen also exposes **Download package (.zip)** through an account-authenticated provider-level endpoint; no selected ServiceNow connection is required. **New instance OAuth settings** saves that instance's Client ID, optional secret and scope in the user's connector registration, then starts authorization using that exact registration. This does not create an OAuth application in ServiceNow. The package is a native SDK app ZIP, not an XML update set or OAuth bootstrap installer.
