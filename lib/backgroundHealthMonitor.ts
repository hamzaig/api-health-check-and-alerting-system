import { checkDueEndpoints } from './healthCheckService';

const CHECK_LOOKUP_INTERVAL_MS = 5000;

const workerState =
  global.__healthCheckWorker ||
  (global.__healthCheckWorker = {
    timer: null as NodeJS.Timeout | null,
    running: false,
    started: false,
  });

async function runDueChecks() {
  // Prevent overlapping ticks if a run takes longer than the interval
  if (workerState.running) return;
  workerState.running = true;

  try {
    await checkDueEndpoints();
  } catch (error) {
    console.error('Background health check worker failed', error);
  } finally {
    workerState.running = false;
  }
}

export function startBackgroundHealthMonitor() {
  if (workerState.started) return;

  workerState.started = true;

  // Kick off immediately, then poll on the schedule
  runDueChecks();
  workerState.timer = setInterval(runDueChecks, CHECK_LOOKUP_INTERVAL_MS);
}

// Start as soon as this module loads on the server
startBackgroundHealthMonitor();
