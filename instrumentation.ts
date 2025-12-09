export async function register() {
  // Only start the worker in the Node.js runtime
  if (process.env.NEXT_RUNTIME === 'edge') return;

  await import('./lib/backgroundHealthMonitor');
}
