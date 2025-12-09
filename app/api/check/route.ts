import { NextRequest, NextResponse } from 'next/server';
import { checkAllEndpoints, checkEndpointById } from '@/lib/healthCheckService';

export async function POST(request: NextRequest) {
  try {
    const { endpointId } = await request.json();

    if (!endpointId) {
      return NextResponse.json({ error: 'Endpoint ID is required' }, { status: 400 });
    }

    const result = await checkEndpointById(endpointId);
    if (!result) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json(result.check);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to perform health check' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const results = await checkAllEndpoints();
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to perform health checks' }, { status: 500 });
  }
}
