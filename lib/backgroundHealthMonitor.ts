import connectDB from './mongodb';
import Endpoint from './models/Endpoint';
import Check from './models/Check';
import { MIN_CHECK_INTERVAL_MS, runHealthCheckForEndpoint } from './healthCheckService';

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
    await connectDB();
    const endpoints = await Endpoint.find();
    const now = Date.now();

    for (const endpoint of endpoints) {
      const intervalMs = Math.max(endpoint.checkInterval || 60000, MIN_CHECK_INTERVAL_MS);

      const latestCheck = await Check.findOne({ endpointId: endpoint._id })
        .sort({ timestamp: -1 })
        .select('timestamp');

      const lastCheckedAt = latestCheck?.timestamp?.getTime() || 0;
      const isDue = now - lastCheckedAt >= intervalMs;

      if (!isDue) continue;

      await runHealthCheckForEndpoint(endpoint);
    }
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
