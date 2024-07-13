import Vue from 'vue'
import {init, browserTracingIntegration, browserProfilingIntegration, replayIntegration} from "@sentry/vue";

const config : Parameters<typeof init>[0] = {
  Vue,
  release: process.env.VERSION,
  dsn: process.env.__MODE === 'production' && new URL(location.href).hostname !== 'localhost'
    ? process.env.SENTRY_PROJECT_PROD
    : process.env.SENTRY_PROJECT_DEV,
  integrations: [
    browserTracingIntegration(),
    browserProfilingIntegration(),
  ],
  tracePropagationTargets: ["localhost", process.env.FUNCTIONS_URL],
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
}

if(process.env.__MODE === 'production' && config.integrations instanceof Array) {
  config.integrations.push(replayIntegration())
} else {
  console.log(`### Sentry Replay will not be activated when __MODE is not production.`);
}

init(config);

console.log(`### Sentry is initialized.`);