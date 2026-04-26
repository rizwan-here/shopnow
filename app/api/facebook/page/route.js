import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requireSession } from '@/lib/auth-store';
import FacebookConnection from '@/models/FacebookConnection';

export async function GET() {
  const session = await requireSession();
  if (!session?.user?.id) {
    return NextResponse.json({ connected: false, pages: [] });
  }

  await connectToDatabase();
  const connection = await FacebookConnection.findOne({ ownerId: session.user.id });
  if (!connection) {
    return NextResponse.json({ connected: false, pages: [] });
  }

  return NextResponse.json({
    connected: true,
    pages: connection.pages.map((page) => ({ pageId: page.pageId, pageName: page.pageName })),
    selectedPageId: connection.selectedPageId,
    selectedPageName: connection.selectedPageName,
    connectedAt: connection.connectedAt
  });
}

export async function PATCH(request) {
  const session = await requireSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pageId } = await request.json();
  await connectToDatabase();
  const connection = await FacebookConnection.findOne({ ownerId: session.user.id });
  if (!connection) {
    return NextResponse.json({ error: 'No Facebook Page connection found' }, { status: 404 });
  }

  const selected = connection.pages.find((page) => page.pageId === pageId);
  if (!selected) {
    return NextResponse.json({ error: 'Selected page not found' }, { status: 404 });
  }

  connection.selectedPageId = selected.pageId;
  connection.selectedPageName = selected.pageName;
  await connection.save();

  return NextResponse.json({
    connected: true,
    pages: connection.pages.map((page) => ({ pageId: page.pageId, pageName: page.pageName })),
    selectedPageId: connection.selectedPageId,
    selectedPageName: connection.selectedPageName,
    connectedAt: connection.connectedAt
  });
}
