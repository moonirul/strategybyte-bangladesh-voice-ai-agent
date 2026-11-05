import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Capabilities from "@/components/landing/Capabilities";
import UseCases from "@/components/landing/UseCases";
import Pricing from "@/components/landing/Pricing";
import Faq from "@/components/landing/Faq";
import FinalCtaFooter from "@/components/landing/FinalCtaFooter";
import { VoiceCallHost } from "@/components/voice/VoiceCallModal";

export default function HomePage() {
  return (
    <VoiceCallHost>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Capabilities />
        <UseCases />
        <Pricing />
        <Faq />
        <FinalCtaFooter />
      </main>
    </VoiceCallHost>
  );
}
