import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Endpoint from '@/lib/models/Endpoint';
import Check from '@/lib/models/Check';
import { sendEmail } from '@/lib/email';
import mongoose from 'mongoose';

const ALERT_EMAIL = process.env.ALERT_EMAIL || 'hamzaig@yahoo.com';

const isHealthy = (status: number) => status >= 200 && status < 300;
const MAX_CHECK_HISTORY = 100;

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

export async function POST(request: NextRequest) {
  try {
    const { endpointId } = await request.json();

    if (!endpointId) {
      return NextResponse.json({ error: 'Endpoint ID is required' }, { status: 400 });
    }

    await connectDB();
    const endpoint = await Endpoint.findById(endpointId);

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    const startTime = Date.now();
    let status = 0;
    let errorMessage = null;

    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        signal: AbortSignal.timeout(30000), // 30 second timeout
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

    return NextResponse.json(check);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to perform health check' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const endpoints = await Endpoint.find();

    const results = await Promise.all(
      endpoints.map(async (endpoint) => {
        const startTime = Date.now();
        let status = 0;
        let errorMessage = null;

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

        await Check.create({
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
          endpointId: endpoint._id,
          url: endpoint.url,
          name: endpoint.name,
          status,
          responseTime,
          errorMessage,
        };
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to perform health checks' }, { status: 500 });
  }
}
