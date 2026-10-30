"use client";

import { useMemo } from "react";
import { MESSAGES } from "@/data/messages";
import { ME } from "@/data/people";
import { useDemo } from "@/lib/store";

/** 기본 대화 + 데모 중 보낸 메시지·자동 알림, 시간순 */
export function useChannelMessages() {
  const chat = useDemo((s) => s.chat);
  return useMemo(() => [...MESSAGES, ...chat].sort((a, b) => a.at.localeCompare(b.at)), [chat]);
}

/** 채널별 안 읽은 메시지 수 (내가 쓴 것 제외) */
export function useUnread() {
  const all = useChannelMessages();
  const lastRead = useDemo((s) => s.lastRead);
  return useMemo(() => {
    const out: Record<string, number> = {};
    for (const m of all) if (m.author !== ME && m.at > (lastRead[m.channel] ?? "")) out[m.channel] = (out[m.channel] ?? 0) + 1;
    return out;
  }, [all, lastRead]);
}
