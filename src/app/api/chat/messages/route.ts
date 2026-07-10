import { NextResponse } from "next/server";
import { getRecentChatMessages } from "@/actions/chat";
import { getOnlineCharacters } from "@/lib/online-status";

export async function GET() {
  const [messages, online] = await Promise.all([getRecentChatMessages(50), getOnlineCharacters()]);
  return NextResponse.json({ messages, online });
}
