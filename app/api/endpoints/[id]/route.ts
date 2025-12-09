import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Endpoint from '@/lib/models/Endpoint';
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

    const { id } = await params;
    await connectDB();
    const endpoint = await Endpoint.findById(id);

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json(endpoint);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch endpoint' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, name, checkInterval } = body;
    const { id } = await params;

    await connectDB();
    const endpoint = await Endpoint.findByIdAndUpdate(
      id,
      { url, name, checkInterval },
      { new: true, runValidators: true }
    );

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json(endpoint);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update endpoint' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const endpoint = await Endpoint.findByIdAndDelete(id);

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    // Delete all checks for this endpoint
    await Check.deleteMany({ endpointId: id });

    return NextResponse.json({ message: 'Endpoint deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete endpoint' }, { status: 500 });
  }
}
