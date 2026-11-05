import type { BookingStatus, CallMode, CallOutcome, Speaker, VoiceProviderId } from "@/types/domain";

/**
 * Provider-independent voice contract.
 *
 * The call UI and the backend recorder only depend on these types. A Vapi,
 * LiveKit, or Pipecat adapter implements `VoiceProvider` and maps its own SDK
 * events to `VoiceEvent`; nothing above this layer changes.
 */

export type VoiceCallStatus = "idle" | "connecting" | "active" | "ending" | "ended" | "error";

export interface TranscriptMessage {
  /** Monotonic per call, starting at 0. Used as an idempotency key downstream. */
  sequenceNumber: number;
  speaker: Speaker;
  text: string;
  /** Milliseconds since call start. */
  timestampMs: number;
  /** Interim (partial) STT results are emitted with isFinal=false. Only final turns are persisted. */
  isFinal: boolean;
}

export interface FinalCallExtraction {
  intent: "appointment" | "faq" | "callback" | "unknown";
  reasonForVisit: string | null;
  patientName: string | null;
  patientNameConfirmed: boolean;
  phoneRaw: string | null;
  phoneE164: string | null;
  phoneConfirmed: boolean;
  preferredDateText: string | null;
  preferredDoctor: string | null;
  /** Demo/AI providers can only ever produce "requested" — never "confirmed". */
  bookingStatus: Extract<BookingStatus, "none" | "requested">;
  requiresHumanFollowup: boolean;
  followupReason: string | null;
}

export interface FinalCallData {
  provider: VoiceProviderId;
  callMode: CallMode;
  providerCallId: string;
  startedAt: string;
  endedAt: string;
  outcome: CallOutcome;
  extraction: FinalCallExtraction;
}

export interface VoiceProviderError {
  code: string;
  message: string;
  retryable: boolean;
}

export type VoiceEvent =
  | { type: "call.initiated"; providerCallId: string; provider: VoiceProviderId; callMode: CallMode; at: string }
  | { type: "connection.changed"; status: VoiceCallStatus }
  | { type: "transcript.message"; message: TranscriptMessage }
  | { type: "speaker.changed"; speaker: Speaker | null }
  | { type: "call.ended"; reason: "caller_ended" | "assistant_ended" | "error"; at: string }
  | { type: "provider.error"; error: VoiceProviderError }
  | { type: "call.final_data"; data: FinalCallData };

export type VoiceEventListener = (event: VoiceEvent) => void;

export interface VoiceProvider {
  readonly id: VoiceProviderId;
  readonly callMode: CallMode;
  /** Human-readable label shown in the call UI, e.g. "Simulated demo". */
  readonly label: string;
  startCall(): Promise<void>;
  endCall(): Promise<void>;
  setMuted(muted: boolean): void;
  getStatus(): VoiceCallStatus;
  subscribeToEvents(listener: VoiceEventListener): () => void;
}

/**
 * Optional capability for providers without a microphone path (the demo).
 * The UI shows a text composer + suggested replies only when present.
 */
export interface TextInputCapable {
  sendCallerText(text: string): void;
  getSuggestedReplies(): string[];
}

export function supportsTextInput(p: VoiceProvider): p is VoiceProvider & TextInputCapable {
  return typeof (p as Partial<TextInputCapable>).sendCallerText === "function";
}

/** Small reusable event hub so adapters don't each re-implement listener bookkeeping. */
export class VoiceEventEmitter {
  private listeners = new Set<VoiceEventListener>();

  subscribe(listener: VoiceEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: VoiceEvent): void {
    for (const l of this.listeners) {
      try {
        l(event);
      } catch (err) {
        // A faulty listener must not break the call or other listeners.
        console.error("[voice] listener error", err);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
