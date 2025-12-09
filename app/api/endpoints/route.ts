import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Endpoint from '@/lib/models/Endpoint';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const endpoints = await Endpoint.find().sort({ createdAt: -1 });
    return NextResponse.json(endpoints);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch endpoints' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, name, checkInterval } = body;

    if (!url || !name) {
      return NextResponse.json({ error: 'URL and name are required' }, { status: 400 });
    }

    await connectDB();
    const endpoint = await Endpoint.create({
      url,
      name,
      checkInterval: checkInterval || 60000,
    });

    return NextResponse.json(endpoint, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create endpoint' }, { status: 500 });
  }
}
