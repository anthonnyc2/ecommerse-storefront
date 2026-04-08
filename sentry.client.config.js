/* eslint-env browser */
import * as Sentry from "@sentry/astro";

const initSentry = () => {
  Sentry.init({
    dsn: "https://e2395c4f17dd40fc8167a990736377e5@o1090554.ingest.us.sentry.io/4511181097664512",
    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/astro/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Enable logs to be sent to Sentry
    enableLogs: true,
    // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysSessionSampleRate: 0.1,
    // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
    replaysOnErrorSampleRate: 1.0,
  });
};

if (
  typeof globalThis !== "undefined" &&
  typeof globalThis.window !== "undefined"
) {
  if ("requestIdleCallback" in globalThis.window) {
    globalThis.window.requestIdleCallback(() => initSentry());
  } else {
    globalThis.window.addEventListener("load", () => {
      globalThis.setTimeout(initSentry, 1000);
    });
  }
}
