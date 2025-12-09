import { NextResponse } from 'next/server';
import { checkDueEndpoints } from '@/lib/healthCheckService';

export async function GET() {
  try {
    const results = await checkDueEndpoints();
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to perform due health checks' }, { status: 500 });
  }
}
