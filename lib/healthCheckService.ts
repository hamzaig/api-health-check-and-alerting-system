import mongoose from 'mongoose';
import connectDB from './mongodb';
import Endpoint, { IEndpoint } from './models/Endpoint';
import Check from './models/Check';
import { sendEmail } from './email';

const ALERT_EMAIL = process.env.ALERT_EMAIL || 'hamzaig@yahoo.com';
export const MIN_CHECK_INTERVAL_MS = 10000;
const MAX_CHECK_HISTORY = 100;

const isHealthy = (status: number) => status >= 200 && status < 300;

async function pruneOldChecks(endpointId: mongoose.Types.ObjectId) {
  const oldChecks = await Check.find({ endpointId })
    .sort({ timestamp: -1 })
    .skip(MAX_CHECK_HISTORY)
    .select('_id');

  if (oldChecks.length > 0) {
    await Check.deleteMany({ _id: { $in: oldChecks.map((doc) => doc._id) } });
  }
}

async function sendFailureAlert(params: {
  endpointName: string;
  endpointUrl: string;
  status: number;
  responseTime: number;
  errorMessage: string | null;
}) {
  if (!ALERT_EMAIL) return;

  const { endpointName, endpointUrl, status, responseTime, errorMessage } = params;
  const subject = `Health check failed: ${endpointName}`;
  const text = `Endpoint "${endpointName}" (${endpointUrl}) is failing.

Status: ${status || 'No response'}
Response time: ${responseTime}ms
Error: ${errorMessage || 'None'}

Please investigate.`;

  try {
    await sendEmail({
      to: ALERT_EMAIL,
      subject,
      text,
    });
  } catch (error) {
    console.error('Failed to send alert email', error);
  }
}

export async function runHealthCheckForEndpoint(endpoint: IEndpoint) {
  const startTime = Date.now();
  let status = 0;
  let errorMessage: string | null = null;

  try {
    const response = await fetch(endpoint.url, {
      method: 'GET',
      signal: AbortSignal.timeout(30000),
    });
    status = response.status;
  } catch (error: any) {
    status = 0;
    errorMessage = error.message || 'Failed to reach endpoint';
  }

  const responseTime = Date.now() - startTime;

  const check = await Check.create({
    endpointId: endpoint._id,
    status,
    responseTime,
    errorMessage,
  });

  await pruneOldChecks(endpoint._id);

  if (!isHealthy(status)) {
    await sendFailureAlert({
      endpointName: endpoint.name,
      endpointUrl: endpoint.url,
      status,
      responseTime,
      errorMessage,
    });
  }

  return {
    check,
    status,
    responseTime,
    errorMessage,
  };
}

export async function checkEndpointById(endpointId: string) {
  await connectDB();
  const endpoint = await Endpoint.findById(endpointId);
  if (!endpoint) return null;

  const result = await runHealthCheckForEndpoint(endpoint);
  return {
    endpoint,
    ...result,
  };
}

export interface HealthCheckResult {
  endpointId: mongoose.Types.ObjectId;
  url: string;
  name: string;
  status: number;
  responseTime: number;
  errorMessage: string | null;
}

export async function checkAllEndpoints(): Promise<HealthCheckResult[]> {
  await connectDB();
  const endpoints = await Endpoint.find();

  const results = await Promise.all(
    endpoints.map(async (endpoint) => {
      const result = await runHealthCheckForEndpoint(endpoint);

      return {
        endpointId: endpoint._id,
        url: endpoint.url,
        name: endpoint.name,
        status: result.status,
        responseTime: result.responseTime,
        errorMessage: result.errorMessage,
      };
    })
  );

  return results;
}
