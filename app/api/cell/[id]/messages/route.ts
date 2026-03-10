import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getCellMessages, postCellMessage } from "@/lib/data/repository";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await getCellMessages(id, 100);
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching cell messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    await postCellMessage(id, user.id, content.trim());
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error posting cell message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}