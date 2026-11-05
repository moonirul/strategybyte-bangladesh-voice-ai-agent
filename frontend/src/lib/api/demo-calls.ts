import type { FinalCallData, TranscriptMessage } from "@/providers/voice/types";
import { apiRequest } from "./http";

/**
 * Public demo-call endpoints (no staff auth). The backend scopes these to the
 * demo clinic, forces call_mode="demo", and requires the per-call token it
 * issued on creation for every subsequent write.
 */

export interface DemoCallSession {
  callId: string;
  callToken: string;
}

export const demoCallsApi = {
  create: (body: { providerCallId: string; startedAt: string }) =>
    apiRequest<DemoCallSession>("/api/demo-calls", { method: "POST", body }),

  appendTurns: (s: DemoCallSession, turns: TranscriptMessage[]) =>
    apiRequest<{ accepted: number }>(`/api/demo-calls/${s.callId}/turns`, {
      method: "POST",
      headers: { "X-Demo-Call-Token": s.callToken },
      body: {
        turns: turns.map((t) => ({
          sequenceNumber: t.sequenceNumber,
          speaker: t.speaker,
          text: t.text,
          timestampMs: t.timestampMs,
        })),
      },
    }),

  finish: (s: DemoCallSession, data: FinalCallData) =>
    apiRequest<{ callId: string; outcome: string }>(`/api/demo-calls/${s.callId}/finish`, {
      method: "POST",
      headers: { "X-Demo-Call-Token": s.callToken },
      body: data,
      timeoutMs: 15_000,
    }),
};
