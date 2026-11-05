import { demoClinic } from "@/config/demo-clinic";
import { toBanglaDigits } from "@/lib/validation/bangla";
import { parseBdMobile } from "@/lib/validation/phone";
import { parsePreference } from "@/lib/validation/preference";
import {
  VoiceEventEmitter,
  type FinalCallData,
  type FinalCallExtraction,
  type TextInputCapable,
  type VoiceCallStatus,
  type VoiceEventListener,
  type VoiceProvider,
} from "./types";
import type { CallOutcome, Speaker } from "@/types/domain";

/**
 * SIMULATED voice provider.
 *
 * A deterministic, rule-based Bangla receptionist script. There is no AI model,
 * no microphone, and no audio: the visitor types (or taps suggested replies)
 * as the caller. It exists so the full call lifecycle — events, transcript,
 * extraction, persistence, portal — can be demonstrated without voice credentials.
 * It is always labelled "Simulated" in the UI and persisted with call_mode="demo".
 */

type Step =
  | "intent"
  | "faq_more"
  | "reason"
  | "name"
  | "phone"
  | "preference"
  | "doctor"
  | "confirm"
  | "done";

type Flow = "appointment" | "callback" | "faq" | null;

const RE = {
  appointment: /অ্যাপয়েন্টমেন্ট|এপয়েন্টমেন্ট|অ্যাপোয়েন্টমেন্ট|সিরিয়াল|দেখাতে|ডাক্তার দেখা|appointment|book|serial/i,
  hours: /সময়সূচি|কখন খোলা|খোলা থাকে|কয়টা|বন্ধ|hours|open|timing/i,
  yes: /^(হ্যাঁ|হ্যা|জি|জ্বি|ঠিক আছে|ঠিক|yes|yeah|ok|correct)/i,
  no: /^(না|নাহ|no|nope|ভুল)/i,
  noMore: /^(না|no|ধন্যবাদ|thanks|thank you|আর কিছু না)/i,
  noPreference: /না|যেকোনো|যে কেউ|any|no preference|কোনো পছন্দ নেই/i,
};

const ASSISTANT_DELAY_MS = 750;

export class DemoVoiceProvider implements VoiceProvider, TextInputCapable {
  readonly id = "demo" as const;
  readonly callMode = "demo" as const;
  readonly label = "Simulated demo";

  private events = new VoiceEventEmitter();
  private status: VoiceCallStatus = "idle";
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private seq = 0;
  private startMs = 0;
  private startedAt = "";
  private providerCallId = "";
  private muted = false;

  private step: Step = "intent";
  private flow: Flow = null;
  private unknownCount = 0;
  private phoneAttempts = 0;
  private clarifiedPreference = false;
  private data: FinalCallExtraction = emptyExtraction();

  getStatus() {
    return this.status;
  }

  subscribeToEvents(listener: VoiceEventListener) {
    return this.events.subscribe(listener);
  }

  setMuted(muted: boolean) {
    // No audio in the simulation; tracked so the UI control behaves consistently.
    this.muted = muted;
  }

  async startCall() {
    if (this.status !== "idle" && this.status !== "ended") return;
    this.reset();
    this.providerCallId = `demo_${crypto.randomUUID()}`;
    this.startMs = Date.now();
    this.startedAt = new Date(this.startMs).toISOString();
    this.setStatus("connecting");
    this.events.emit({
      type: "call.initiated",
      providerCallId: this.providerCallId,
      provider: this.id,
      callMode: this.callMode,
      at: this.startedAt,
    });
    this.later(() => {
      this.setStatus("active");
      this.say(
        `আসসালামু আলাইকুম, ${demoClinic.nameBn}-এ ফোন করার জন্য ধন্যবাদ। আমি ক্লিনিকের ডিজিটাল রিসেপশনিস্ট। আজ আপনাকে কীভাবে সাহায্য করতে পারি?`,
      );
    }, 900);
  }

  async endCall() {
    if (this.status !== "active" && this.status !== "connecting") return;
    this.finish("caller_ended");
  }

  getSuggestedReplies(): string[] {
    switch (this.step) {
      case "intent":
        return ["আমি একটা অ্যাপয়েন্টমেন্ট নিতে চাই", "ক্লিনিক কখন খোলা থাকে?", "রুট ক্যানেলের খরচ কত?"];
      case "faq_more":
        return ["অ্যাপয়েন্টমেন্ট নিতে চাই", "না, ধন্যবাদ"];
      case "reason":
        return ["দাঁতে ব্যথা হচ্ছে", "দাঁত পরিষ্কার করাতে চাই", "ব্রেস নিয়ে পরামর্শ"];
      case "name":
        return ["রহিম উদ্দিন", "নুসরাত জাহান"];
      case "phone":
        return ["০১৭১২৩৪৫৬৭৮", "01812-345678"];
      case "preference":
        return this.clarifiedPreference
          ? ["বিকাল ৫টা"]
          : ["আগামীকাল বিকাল ৫টায়", "পরশু সকাল ১১টা", "কাল ৫টা"];
      case "doctor":
        return [...demoClinic.doctors.map((d) => d.nameBn), "কোনো পছন্দ নেই"];
      case "confirm":
        return ["হ্যাঁ, ঠিক আছে", "না, ভুল আছে"];
      default:
        return [];
    }
  }

  sendCallerText(raw: string) {
    const text = raw.trim();
    if (!text || this.status !== "active" || this.step === "done") return;
    this.emitTurn("caller", text);
    this.events.emit({ type: "speaker.changed", speaker: null });
    this.later(() => this.handle(text), ASSISTANT_DELAY_MS);
  }

  // ---------------------------------------------------------------- dialogue

  private handle(text: string) {
    switch (this.step) {
      case "intent":
        return this.handleIntent(text);
      case "faq_more":
        if (RE.appointment.test(text)) return this.startAppointment();
        if (RE.noMore.test(text)) return this.close("ধন্যবাদ, ভালো থাকবেন।");
        return this.startCallback("Caller question outside approved FAQ");
      case "reason":
        this.data.reasonForVisit = text;
        this.step = "name";
        return this.say("বুঝতে পেরেছি। আপনার পুরো নামটা বলবেন?");
      case "name":
        this.data.patientName = text;
        this.step = "phone";
        return this.say("ধন্যবাদ। আপনার মোবাইল নম্বরটা বলুন।");
      case "phone":
        return this.handlePhone(text);
      case "preference":
        return this.handlePreference(text);
      case "doctor":
        return this.handleDoctor(text);
      case "confirm":
        return this.handleConfirm(text);
    }
  }

  private handleIntent(text: string) {
    if (RE.appointment.test(text)) return this.startAppointment();
    if (RE.hours.test(text)) {
      this.flow = "faq";
      this.data.intent = "faq";
      this.step = "faq_more";
      return this.say(
        `আমাদের ক্লিনিক খোলা থাকে ${demoClinic.hoursBn} আর কিছু জানতে চান, নাকি অ্যাপয়েন্টমেন্ট নিতে চান?`,
      );
    }
    if (this.unknownCount === 0 && text.length < 6) {
      this.unknownCount++;
      return this.say("দুঃখিত, বুঝতে পারিনি। আপনি কি অ্যাপয়েন্টমেন্ট নিতে চান, নাকি কিছু জানতে চান?");
    }
    // No approved answer (e.g. fees): never improvise — escalate to a human.
    return this.startCallback("Question without an approved FAQ answer: " + text);
  }

  private startAppointment() {
    this.flow = "appointment";
    this.data.intent = "appointment";
    this.step = "reason";
    this.say("অবশ্যই। কী সমস্যার জন্য ডাক্তার দেখাতে চান?");
  }

  private startCallback(reason: string) {
    this.flow = "callback";
    this.data.intent = "callback";
    this.data.requiresHumanFollowup = true;
    this.data.followupReason = reason;
    this.step = "name";
    this.say(
      "এই বিষয়ে সঠিক তথ্য দিতে আমাদের স্টাফ আপনাকে কল করবেন। আপনার নামটা বলবেন?",
    );
  }

  private handlePhone(text: string) {
    const result = parseBdMobile(text);
    this.data.phoneRaw = text;
    if (result.ok) {
      this.data.phoneE164 = result.e164;
    } else if (this.phoneAttempts < 1) {
      this.phoneAttempts++;
      return this.say(
        "নম্বরটা সঠিক মনে হচ্ছে না। ০১ দিয়ে শুরু ১১ সংখ্যার মোবাইল নম্বরটা আবার বলবেন?",
      );
    } else {
      // Never guess digits: keep the raw value and flag for a human.
      this.flagFollowup("Phone number could not be validated");
    }

    if (this.flow === "callback") {
      return this.close("ধন্যবাদ। আমাদের স্টাফ শীঘ্রই আপনাকে কল করবেন। ভালো থাকবেন।");
    }
    this.step = "preference";
    this.say("কোন দিন এবং কখন আসতে চান?");
  }

  private handlePreference(text: string) {
    this.data.preferredDateText = this.data.preferredDateText
      ? `${this.data.preferredDateText}; ${text}`
      : text;
    const parsed = parsePreference(this.data.preferredDateText);

    if (parsed.ambiguity && !this.clarifiedPreference) {
      this.clarifiedPreference = true;
      const q =
        parsed.ambiguity === "missing_day"
          ? "কোন দিন আসতে চান—আজ, আগামীকাল, নাকি পরশু?"
          : parsed.ambiguity === "ambiguous_time"
            ? "সকাল, নাকি বিকাল/সন্ধ্যা—কোন সময়টা?"
            : "কয়টার দিকে আসতে চান?";
      return this.say(q);
    }
    if (parsed.ambiguity) this.flagFollowup("Preferred date/time is ambiguous");

    this.step = "doctor";
    this.say(
      `কোনো নির্দিষ্ট ডাক্তার দেখাতে চান? ${demoClinic.doctors.map((d) => d.nameBn).join(" অথবা ")}।`,
    );
  }

  private handleDoctor(text: string) {
    const doctor = demoClinic.doctors.find((d) => {
      const first = d.fullName.split(" ")[1].toLowerCase();
      const firstBn = d.nameBn.split(" ")[1];
      return text.toLowerCase().includes(first) || text.includes(firstBn);
    });
    this.data.preferredDoctor = doctor ? doctor.fullName : RE.noPreference.test(text) ? null : text;
    this.step = "confirm";
    const phone = this.data.phoneE164
      ? toBanglaDigits("0" + this.data.phoneE164.slice(4))
      : (this.data.phoneRaw ?? "—");
    this.say(
      `নিশ্চিত করছি—নাম: ${this.data.patientName}, নম্বর: ${phone}, সমস্যা: ${this.data.reasonForVisit}, পছন্দের সময়: ${this.data.preferredDateText}${doctor ? `, ডাক্তার: ${doctor.nameBn}` : ""}। সব ঠিক আছে?`,
    );
  }

  private handleConfirm(text: string) {
    this.data.bookingStatus = "requested";
    if (RE.yes.test(text)) {
      this.data.patientNameConfirmed = true;
      this.data.phoneConfirmed = Boolean(this.data.phoneE164);
    } else {
      this.flagFollowup(RE.no.test(text) ? "Caller said captured details were incorrect" : "Details not confirmed");
    }
    this.close(
      "ধন্যবাদ। আপনার অ্যাপয়েন্টমেন্টের অনুরোধ রেকর্ড করা হয়েছে। এটি এখনো নিশ্চিত নয়—ক্লিনিকের স্টাফ সময় নিশ্চিত করে আপনাকে জানাবেন। ভালো থাকবেন।",
    );
  }

  private flagFollowup(reason: string) {
    this.data.requiresHumanFollowup = true;
    this.data.followupReason = this.data.followupReason
      ? `${this.data.followupReason}; ${reason}`
      : reason;
  }

  private close(text: string) {
    this.step = "done";
    this.say(text);
    this.later(() => this.finish("assistant_ended"), 1200);
  }

  // ---------------------------------------------------------------- plumbing

  private finish(reason: "caller_ended" | "assistant_ended") {
    if (this.status === "ended" || this.status === "ending") return;
    this.setStatus("ending");
    this.clearTimers();
    const endedAt = new Date().toISOString();

    if (reason === "caller_ended" && this.step !== "done" && this.flow === "appointment") {
      // Caller hung up mid-booking: no request is recorded, but a callback is useful if we have a number.
      this.data.bookingStatus = "none";
      if (this.data.phoneE164) this.flagFollowup("Caller ended the call before completing the request");
    }

    const final: FinalCallData = {
      provider: this.id,
      callMode: this.callMode,
      providerCallId: this.providerCallId,
      startedAt: this.startedAt,
      endedAt,
      outcome: deriveOutcome(this.data, reason, this.step),
      extraction: { ...this.data },
    };
    this.events.emit({ type: "speaker.changed", speaker: null });
    this.events.emit({ type: "call.final_data", data: final });
    this.events.emit({ type: "call.ended", reason, at: endedAt });
    this.setStatus("ended");
  }

  private say(text: string) {
    this.events.emit({ type: "speaker.changed", speaker: "assistant" });
    this.emitTurn("assistant", text);
  }

  private emitTurn(speaker: Speaker, text: string) {
    this.events.emit({
      type: "transcript.message",
      message: {
        sequenceNumber: this.seq++,
        speaker,
        text,
        timestampMs: Date.now() - this.startMs,
        isFinal: true,
      },
    });
  }

  private setStatus(status: VoiceCallStatus) {
    this.status = status;
    this.events.emit({ type: "connection.changed", status });
  }

  private later(fn: () => void, ms: number) {
    const t = setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
  }

  private clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers.clear();
  }

  private reset() {
    this.clearTimers();
    this.seq = 0;
    this.step = "intent";
    this.flow = null;
    this.unknownCount = 0;
    this.phoneAttempts = 0;
    this.clarifiedPreference = false;
    this.muted = false;
    this.data = emptyExtraction();
  }
}

function emptyExtraction(): FinalCallExtraction {
  return {
    intent: "unknown",
    reasonForVisit: null,
    patientName: null,
    patientNameConfirmed: false,
    phoneRaw: null,
    phoneE164: null,
    phoneConfirmed: false,
    preferredDateText: null,
    preferredDoctor: null,
    bookingStatus: "none",
    requiresHumanFollowup: false,
    followupReason: null,
  };
}

function deriveOutcome(d: FinalCallExtraction, reason: string, step: Step): CallOutcome {
  if (d.bookingStatus === "requested") return "appointment_requested";
  if (d.intent === "callback" || (d.requiresHumanFollowup && d.phoneE164)) return "followup_required";
  if (d.intent === "faq" && step === "done") return "faq_answered";
  if (reason === "caller_ended" && step !== "done") return "incomplete";
  return "no_action";
}
