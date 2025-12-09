import mongoose from 'mongoose';

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
  var __healthCheckWorker:
    | {
        timer: NodeJS.Timeout | null;
        running: boolean;
        started: boolean;
      }
    | undefined;
}

export {};
