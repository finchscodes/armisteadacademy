"use server";

import { getCurrentUser } from "@/lib/current-user";
import { markCharacterActive } from "@/lib/online-status";

export async function heartbeatAction() {
  const current = await getCurrentUser();
  if (!current?.activeCharacter) return;
  await markCharacterActive(current.activeCharacter.id);
}
