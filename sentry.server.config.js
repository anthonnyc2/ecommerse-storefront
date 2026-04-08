import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "https://e2395c4f17dd40fc8167a990736377e5@o1090554.ingest.us.sentry.io/4511181097664512",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/astro/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});
