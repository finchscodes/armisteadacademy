import { NextResponse } from "next/server";
import { getRecentChatMessages } from "@/actions/chat";

export async function GET() {
  const messages = await getRecentChatMessages(50);
  return NextResponse.json({ messages });
}
