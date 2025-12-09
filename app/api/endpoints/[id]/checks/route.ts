import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Check from '@/lib/models/Check';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const { id } = await params;

    await connectDB();
    const checks = await Check.find({ endpointId: id })
      .sort({ timestamp: -1 })
      .limit(limit);

    return NextResponse.json(checks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch checks' }, { status: 500 });
  }
}
