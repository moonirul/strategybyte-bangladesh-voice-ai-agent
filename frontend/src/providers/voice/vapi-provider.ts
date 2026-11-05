import Vapi from "@vapi-ai/web";
import { env, isVapiConfigured } from "@/lib/env";
import type { VoiceProviderId } from "@/types/domain";

import {
  VoiceEventEmitter,
  type VoiceCallStatus,
  type VoiceEventListener,
  type VoiceProvider,
} from "./types";

type VapiMessage = {
  type?: string;
  role?: string;
  transcript?: string;
  transcriptType?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function createCallId(): string {
  return `vapi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class VapiVoiceProvider implements VoiceProvider {
  readonly id: VoiceProviderId = "vapi";
  readonly callMode = "live" as const;
  readonly label = "Live voice (Vapi)";

  private events = new VoiceEventEmitter();
  private vapi: Vapi | null = null;
  private status: VoiceCallStatus = "idle";

  private sequenceNumber = 0;
  private startedAtMs = 0;
  private startedAt = "";
  private providerCallId = "";
  private endRequestedByUser = false;
  private initiatedEmitted = false;
  private endedEmitted = false;

  getStatus(): VoiceCallStatus {
    return this.status;
  }

  subscribeToEvents(listener: VoiceEventListener) {
    return this.events.subscribe(listener);
  }

  private setStatus(status: VoiceCallStatus) {
    this.status = status;
    this.events.emit({
      type: "connection.changed",
      status,
    });
  }

  private emitInitiated() {
    if (this.initiatedEmitted) return;

    this.initiatedEmitted = true;

    this.events.emit({
      type: "call.initiated",
      providerCallId: this.providerCallId,
      provider: "vapi",
      callMode: "live",
      at: this.startedAt,
    });
  }

  private emitEnded(reason: "caller_ended" | "assistant_ended" | "error") {
    if (this.endedEmitted) return;

    this.endedEmitted = true;

    this.events.emit({
      type: "call.ended",
      reason,
      at: new Date().toISOString(),
    });
  }

  private createClient(): Vapi {
    if (!isVapiConfigured) {
      throw new Error(
        "Vapi configuration missing. Set NEXT_PUBLIC_VAPI_PUBLIC_KEY and NEXT_PUBLIC_VAPI_ASSISTANT_ID.",
      );
    }

    if (!this.vapi) {
      this.vapi = new Vapi(env.vapiPublicKey);
      this.attachEvents(this.vapi);
    }

    return this.vapi;
  }

  private attachEvents(client: Vapi) {
    client.on("call-start", () => {
      this.startedAtMs = Date.now();
      this.startedAt = new Date().toISOString();

      this.setStatus("active");
    });

    client.on("call-end", () => {
      const reason = this.endRequestedByUser
        ? "caller_ended"
        : "assistant_ended";

      this.setStatus("ended");
      this.events.emit({
        type: "speaker.changed",
        speaker: null,
      });

      this.emitEnded(reason);
    });

    client.on("speech-start", () => {
      this.events.emit({
        type: "speaker.changed",
        speaker: "assistant",
      });
    });

    client.on("speech-end", () => {
      this.events.emit({
        type: "speaker.changed",
        speaker: null,
      });
    });

    client.on("message", (rawMessage) => {
      if (!isRecord(rawMessage)) return;

      const message = rawMessage as VapiMessage;

      if (message.type !== "transcript") return;
      if (typeof message.transcript !== "string") return;

      const speaker =
        message.role === "assistant"
          ? "assistant"
          : message.role === "user"
            ? "caller"
            : null;

      if (!speaker) return;

      this.sequenceNumber += 1;

      this.events.emit({
        type: "transcript.message",
        message: {
          sequenceNumber: this.sequenceNumber,
          speaker,
          text: message.transcript,
          timestampMs: Math.max(0, Date.now() - this.startedAtMs),
          isFinal: message.transcriptType === "final",
        },
      });
    });

    client.on("error", (error) => {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "An unexpected Vapi error occurred.";

      this.setStatus("error");

      this.events.emit({
        type: "provider.error",
        error: {
          code: "vapi_error",
          message,
          retryable: true,
        },
      });

      this.emitEnded("error");
    });
  }

  async startCall(): Promise<void> {
    if (this.status === "active" || this.status === "connecting") {
      return;
    }

    this.sequenceNumber = 0;
    this.startedAtMs = Date.now();
    this.startedAt = new Date().toISOString();
    this.providerCallId = "";
    this.endRequestedByUser = false;
    this.initiatedEmitted = false;
    this.endedEmitted = false;

    this.setStatus("connecting");

    try {
      const client = this.createClient();

      const call = await client.start(env.vapiAssistantId);

      if (this.status === "ended") return;

      if (!call) {
        throw new Error("Vapi could not establish the call.");
      }

      const callId = (call as { id?: string }).id;

      this.providerCallId =
        typeof callId === "string" && callId.length > 0
          ? callId
          : createCallId();

      if (!this.startedAt) {
        this.startedAt = new Date().toISOString();
      }

      if (this.status === "connecting") {
        this.setStatus("active");
      }

      this.emitInitiated();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start the Vapi call.";

      this.setStatus("error");

      this.events.emit({
        type: "provider.error",
        error: {
          code: "vapi_start_failed",
          message,
          retryable: true,
        },
      });

      this.emitEnded("error");
    }
  }

  async endCall(): Promise<void> {
    if (!this.vapi) return;

    if (
      this.status !== "active" &&
      this.status !== "connecting"
    ) {
      return;
    }

    this.endRequestedByUser = true;
    this.setStatus("ending");

    try {
      await this.vapi.stop();

      if (!this.endedEmitted) {
        this.setStatus("ended");
        this.emitEnded("caller_ended");
      }
    } catch (error) {
      this.setStatus("error");

      this.events.emit({
        type: "provider.error",
        error: {
          code: "vapi_stop_failed",
          message:
            error instanceof Error
              ? error.message
              : "Unable to end the Vapi call.",
          retryable: true,
        },
      });
    }
  }

  setMuted(muted: boolean): void {
    this.vapi?.setMuted(muted);
  }
}