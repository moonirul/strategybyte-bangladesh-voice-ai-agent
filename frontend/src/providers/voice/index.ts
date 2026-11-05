import { DemoVoiceProvider } from "./demo-provider";
import { VapiVoiceProvider } from "./vapi-provider";
import type { VoiceProvider } from "./types";

export type { VoiceProvider, VoiceEvent, VoiceCallStatus, TranscriptMessage, FinalCallData } from "./types";
export { supportsTextInput } from "./types";

/**
 * Single selection point for the voice provider.
 * Vapi is only chosen when explicitly requested AND configured; otherwise the
 * clearly-labelled simulated provider is used.
 */
export function createVoiceProvider(kind: "demo" | "vapi" = "demo"): VoiceProvider {
  return kind === "vapi" ? new VapiVoiceProvider() : new DemoVoiceProvider();
}
