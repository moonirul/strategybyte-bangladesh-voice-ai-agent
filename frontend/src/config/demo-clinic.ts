/**
 * Fictional demo clinic used by the simulated assistant and seed data.
 * All names, hours, and services are SAMPLE values for the assessment demo —
 * not a real clinic. The backend seeds the same values (backend/migrations/seed.sql).
 */
export const demoClinic = {
  name: "Dhaka Dental Care",
  nameBn: "ঢাকা ডেন্টাল কেয়ার",
  timezone: "Asia/Dhaka",
  hoursBn: "শনিবার থেকে বৃহস্পতিবার, সকাল ১০টা থেকে রাত ৮টা পর্যন্ত। শুক্রবার বন্ধ।",
  doctors: [
    { id: "doc_sample_1", fullName: "Dr. Farzana Haque", nameBn: "ডা. ফারজানা হক", specialty: "General dentistry" },
    { id: "doc_sample_2", fullName: "Dr. Imran Kabir", nameBn: "ডা. ইমরান কবির", specialty: "Orthodontics" },
  ],
} as const;
