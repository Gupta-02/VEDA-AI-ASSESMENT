# Vercel deployment guide

This project is structured for a standard Vercel deployment with a Vite frontend and a TypeScript serverless API entrypoint.

## Repository structure

```text
api/[...path].ts       Vercel serverless API entrypoint
client/                React application and static public files
server/app.ts          Shared Express and tRPC API configuration
server/db.ts           Database persistence queries
server/routers.ts      Typed assessment API procedures
drizzle/               Database schema and migrations
vercel.json            Vercel build and output configuration
```

## Deploy from GitHub

1. Import the GitHub repository in Vercel.
2. Keep the detected framework as **Vite**.
3. Use `pnpm build` as the build command and `dist/public` as the output directory. These settings are also defined in `vercel.json`.
4. Add a `DATABASE_URL` environment variable for the production database if saved assessment history is required.
5. Deploy. The React application is served from the static build and `/api/*` is handled by `api/[...path].ts`.

## Production verification

After deployment, open the root URL, choose both temporary upload files, start mapping, select a question, save the teacher review, refresh the page, and reopen the record from **My Library**. A successful result confirms the frontend, API function, and database connection are working together.

> Without `DATABASE_URL`, the user interface still loads, but saving assessments or teacher reviews cannot succeed. Do not add database credentials to the repository; configure them only in the Vercel project environment settings.
