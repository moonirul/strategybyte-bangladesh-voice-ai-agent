/**
 * DEVELOPMENT FIXTURES — synthetic data only.
 *
 * Loaded exclusively when NODE_ENV !== "production" and
 * NEXT_PUBLIC_DATA_SOURCE=fixtures (see lib/api/portal-api.ts). Names and
 * numbers are invented; nothing here represents real patients or clinic activity.
 * The portal shows a "Development fixtures" banner whenever this is active.
 */
import type {
  Appointment,
  CallDetail,
  CallOutcome,
  CallStatus,
  FollowUp,
  TranscriptTurn,
} from "@/types/domain";

const NOW = Date.now();
const ago = (hours: number) => new Date(NOW - hours * 3_600_000).toISOString();

export const fixturePatients = [
  { id: "pat_01", fullName: "রহিম উদ্দিন", phoneE164: "+8801712345678", createdAt: ago(2) },
  { id: "pat_02", fullName: "নুসরাত জাহান", phoneE164: "+8801812345678", createdAt: ago(5) },
  { id: "pat_03", fullName: "Tahmid Hasan", phoneE164: "+8801912340000", createdAt: ago(27) },
  { id: "pat_04", fullName: "সাবরিনা আক্তার", phoneE164: "+8801556677889", createdAt: ago(50) },
  { id: "pat_05", fullName: "কামরুল ইসলাম", phoneE164: null, createdAt: ago(75) },
];

const doctors = [
  { id: "doc_sample_1", fullName: "Dr. Farzana Haque", specialty: "General dentistry" },
  { id: "doc_sample_2", fullName: "Dr. Imran Kabir", specialty: "Orthodontics" },
];

const t = (seq: number, speaker: "assistant" | "caller", textBn: string, sec: number): TranscriptTurn => ({
  id: `turn_${seq}`,
  sequenceNumber: seq,
  speaker,
  textBn,
  textEn: null,
  timestampMs: sec * 1000,
});

const appointmentTranscript = (name: string, phone: string, reason: string, pref: string) => [
  t(0, "assistant", "আসসালামু আলাইকুম, ঢাকা ডেন্টাল কেয়ার-এ ফোন করার জন্য ধন্যবাদ। আজ আপনাকে কীভাবে সাহায্য করতে পারি?", 0),
  t(1, "caller", "আমি একটা অ্যাপয়েন্টমেন্ট নিতে চাই", 6),
  t(2, "assistant", "অবশ্যই। কী সমস্যার জন্য ডাক্তার দেখাতে চান?", 9),
  t(3, "caller", reason, 14),
  t(4, "assistant", "বুঝতে পেরেছি। আপনার পুরো নামটা বলবেন?", 17),
  t(5, "caller", name, 21),
  t(6, "assistant", "ধন্যবাদ। আপনার মোবাইল নম্বরটা বলুন।", 24),
  t(7, "caller", phone, 30),
  t(8, "assistant", "কোন দিন এবং কখন আসতে চান?", 33),
  t(9, "caller", pref, 38),
  t(10, "assistant", "ধন্যবাদ। আপনার অ্যাপয়েন্টমেন্টের অনুরোধ রেকর্ড করা হয়েছে। এটি এখনো নিশ্চিত নয়—ক্লিনিকের স্টাফ সময় নিশ্চিত করে আপনাকে জানাবেন।", 44),
];

interface CallSeed {
  id: string;
  hoursAgo: number;
  duration: number | null;
  mode: "demo" | "live";
  status: CallStatus;
  outcome: CallOutcome | null;
  patientIdx: number | null;
  booking: CallDetail["bookingStatus"];
  followup: string | null;
  reason?: string;
  pref?: string;
  doctor?: string | null;
  transcript?: TranscriptTurn[];
}

const seeds: CallSeed[] = [
  { id: "call_01", hoursAgo: 1, duration: 48, mode: "demo", status: "completed", outcome: "appointment_requested", patientIdx: 0, booking: "requested", followup: null, reason: "দাঁতে ব্যথা হচ্ছে", pref: "আগামীকাল বিকাল ৫টায়", doctor: "Dr. Farzana Haque" },
  { id: "call_02", hoursAgo: 4, duration: 62, mode: "demo", status: "completed", outcome: "appointment_requested", patientIdx: 1, booking: "confirmed", followup: null, reason: "দাঁত পরিষ্কার করাতে চাই", pref: "পরশু সকাল ১১টা", doctor: null },
  { id: "call_03", hoursAgo: 6, duration: 21, mode: "demo", status: "abandoned", outcome: "incomplete", patientIdx: null, booking: "none", followup: null },
  { id: "call_04", hoursAgo: 26, duration: 55, mode: "demo", status: "completed", outcome: "followup_required", patientIdx: 2, booking: "requested", followup: "Preferred date/time is ambiguous", reason: "ব্রেস নিয়ে পরামর্শ", pref: "কাল ৫টা", doctor: "Dr. Imran Kabir" },
  { id: "call_05", hoursAgo: 30, duration: 34, mode: "demo", status: "completed", outcome: "faq_answered", patientIdx: null, booking: "none", followup: null },
  { id: "call_06", hoursAgo: 49, duration: 41, mode: "demo", status: "completed", outcome: "followup_required", patientIdx: 3, booking: "none", followup: "Question without an approved FAQ answer: রুট ক্যানেলের খরচ কত?" },
  { id: "call_07", hoursAgo: 52, duration: null, mode: "demo", status: "failed", outcome: null, patientIdx: null, booking: "none", followup: null },
  { id: "call_08", hoursAgo: 74, duration: 58, mode: "demo", status: "completed", outcome: "followup_required", patientIdx: 4, booking: "requested", followup: "Phone number could not be validated", reason: "মাড়ি থেকে রক্ত পড়ে", pref: "শনিবার সকালে", doctor: null },
];

const mask = (e164: string | null) => (e164 ? `+880 1${e164.slice(5, 7)}•• •••${e164.slice(-3)}` : null);

export const fixtureCalls: CallDetail[] = seeds.map((s, i) => {
  const p = s.patientIdx !== null ? fixturePatients[s.patientIdx] : null;
  const startedAt = ago(s.hoursAgo);
  const transcript =
    s.transcript ??
    (p && s.reason && s.pref
      ? appointmentTranscript(p.fullName, p.phoneE164 ? "0" + p.phoneE164.slice(4) : "০১৭১২৩৪", s.reason, s.pref)
      : s.outcome === "faq_answered"
        ? [
            t(0, "assistant", "আসসালামু আলাইকুম, ঢাকা ডেন্টাল কেয়ার-এ ফোন করার জন্য ধন্যবাদ। আজ আপনাকে কীভাবে সাহায্য করতে পারি?", 0),
            t(1, "caller", "ক্লিনিক কখন খোলা থাকে?", 5),
            t(2, "assistant", "আমাদের ক্লিনিক খোলা থাকে শনিবার থেকে বৃহস্পতিবার, সকাল ১০টা থেকে রাত ৮টা পর্যন্ত। শুক্রবার বন্ধ।", 9),
            t(3, "caller", "না, ধন্যবাদ", 20),
          ]
        : s.status === "abandoned"
          ? [
              t(0, "assistant", "আসসালামু আলাইকুম, ঢাকা ডেন্টাল কেয়ার-এ ফোন করার জন্য ধন্যবাদ। আজ আপনাকে কীভাবে সাহায্য করতে পারি?", 0),
              t(1, "caller", "আমি একটা অ্যাপয়েন্টমেন্ট নিতে চাই", 7),
              t(2, "assistant", "অবশ্যই। কী সমস্যার জন্য ডাক্তার দেখাতে চান?", 10),
            ]
          : []);
  const hasExtraction = s.status === "completed" || s.status === "abandoned";
  return {
    id: s.id,
    startedAt,
    endedAt: s.duration ? new Date(Date.parse(startedAt) + s.duration * 1000).toISOString() : null,
    durationSeconds: s.duration,
    callMode: s.mode,
    provider: "demo",
    providerCallId: `demo_fixture_${i}`,
    status: s.status,
    outcome: s.outcome,
    patient: p ? { id: p.id, fullName: p.fullName } : null,
    phoneDisplay: p ? mask(p.phoneE164) : null,
    patientPhone: p?.phoneE164 ?? null,
    bookingStatus: s.booking,
    requiresFollowup: Boolean(s.followup),
    recordingUrl: null,
    transcript,
    extraction: hasExtraction
      ? {
          intent: s.reason ? "appointment" : s.outcome === "faq_answered" ? "faq" : s.followup ? "callback" : "unknown",
          reasonForVisit: s.reason ?? null,
          preferredDateText: s.pref ?? null,
          preferredDate: s.pref && !s.followup?.includes("ambiguous") && s.pref.includes("আগামীকাল") ? ago(-24).slice(0, 10) : null,
          preferredTime: s.pref?.includes("৫টায়") ? "17:00" : s.pref?.includes("১১টা") ? "11:00" : null,
          preferredDoctor: s.doctor ?? null,
          patientNameConfirmed: Boolean(p && s.booking !== "none"),
          phoneConfirmed: Boolean(p?.phoneE164 && s.booking !== "none"),
          bookingStatus: s.booking,
          requiresHumanFollowup: Boolean(s.followup),
          confidence: null,
        }
      : null,
    appointment:
      s.booking === "requested" || s.booking === "confirmed"
        ? { id: `appt_${s.id}`, status: s.booking === "confirmed" ? "confirmed" : "requested" }
        : null,
    followUp: s.followup ? { id: `fu_${s.id}`, status: "open", reason: s.followup } : null,
  };
});

export const fixtureAppointments: Appointment[] = fixtureCalls
  .filter((c) => c.appointment && c.patient)
  .map((c) => {
    const doctor = doctors.find((d) => d.fullName === c.extraction?.preferredDoctor) ?? null;
    const confirmed = c.appointment!.status === "confirmed";
    return {
      id: c.appointment!.id,
      patient: c.patient!,
      callId: c.id,
      doctor,
      requestedPreference: c.extraction?.preferredDateText ?? null,
      scheduledStart: confirmed ? ago(-40) : null,
      status: c.appointment!.status,
      bookingReference: confirmed ? "DDC-FIXTURE-0001" : null,
      createdAt: c.startedAt,
      updatedAt: c.startedAt,
    };
  });

export const fixtureFollowUps: FollowUp[] = fixtureCalls
  .filter((c) => c.followUp)
  .map((c) => ({
    id: c.followUp!.id,
    callId: c.id,
    patient: c.patient,
    reason: c.followUp!.reason,
    status: c.followUp!.status,
    assignedTo: null,
    createdAt: c.startedAt,
    updatedAt: c.startedAt,
  }));

export { doctors as fixtureDoctors, mask as maskPhone };
