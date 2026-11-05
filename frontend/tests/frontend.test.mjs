import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs";
import path from "node:path";

describe("ByteVoice Bangladesh — Frontend Acceptance & Contract Checks", () => {
  const srcRoot = path.resolve(import.meta.dirname, "../src");

  it("exposes required landing page sections and exact hero copy", () => {
    const heroSource = fs.readFileSync(
      path.join(srcRoot, "components/landing/Hero.tsx"),
      "utf8",
    );
    assert.ok(heroSource.includes("Every patient call deserves an answer."));
    assert.ok(
      heroSource.includes(
        "আপনার ক্লিনিকের প্রতিটি কলের উত্তর দিন—সহজ, স্বাভাবিক বাংলায়।",
      ),
    );
  });

  it("includes WebGL fallback, reduced-motion support, and off-screen observer in HeroSceneLoader", () => {
    const loaderSource = fs.readFileSync(
      path.join(srcRoot, "components/three/HeroSceneLoader.tsx"),
      "utf8",
    );
    assert.ok(loaderSource.includes("detectWebGL"));
    assert.ok(loaderSource.includes("prefers-reduced-motion: reduce"));
    assert.ok(loaderSource.includes("IntersectionObserver"));
    assert.ok(loaderSource.includes("CssVoiceFallback"));
  });

  it("implements the provider-independent VoiceProvider contract and demo + Vapi adapters", () => {
    const typesSource = fs.readFileSync(
      path.join(srcRoot, "providers/voice/types.ts"),
      "utf8",
    );
    for (const method of [
      "startCall()",
      "endCall()",
      "setMuted(",
      "getStatus()",
      "subscribeToEvents(",
    ]) {
      assert.ok(typesSource.includes(method), `Missing ${method} on VoiceProvider`);
    }
    assert.ok(
      fs.existsSync(path.join(srcRoot, "providers/voice/demo-provider.ts")),
    );
    assert.ok(
      fs.existsSync(path.join(srcRoot, "providers/voice/vapi-provider.ts")),
    );
  });

  it("guards development fixtures from production builds in env.ts and portal-api.ts", () => {
    const envSource = fs.readFileSync(path.join(srcRoot, "lib/env.ts"), "utf8");
    const apiSource = fs.readFileSync(
      path.join(srcRoot, "lib/api/portal-api.ts"),
      "utf8",
    );
    assert.ok(envSource.includes('process.env.NODE_ENV === "production"'));
    assert.ok(apiSource.includes('process.env.NODE_ENV !== "production"'));
  });

  it("contains all required Staff Portal routes", () => {
    const requiredRoutes = [
      "app/portal/login/page.tsx",
      "app/portal/(app)/page.tsx",
      "app/portal/(app)/calls/page.tsx",
      "app/portal/(app)/calls/[callId]/page.tsx",
      "app/portal/(app)/patients/page.tsx",
      "app/portal/(app)/patients/[patientId]/page.tsx",
      "app/portal/(app)/appointments/page.tsx",
      "app/portal/(app)/follow-ups/page.tsx",
      "app/portal/(app)/settings/page.tsx",
    ];
    for (const rel of requiredRoutes) {
      assert.ok(
        fs.existsSync(path.join(srcRoot, rel)),
        `Missing portal route: ${rel}`,
      );
    }
  });

  it("provides a Bangla-default, persisted Bangla/English language system", () => {
    const read = (rel) => fs.readFileSync(path.join(srcRoot, rel), "utf8");
    const types = read("i18n/types.ts");
    const provider = read("i18n/I18nProvider.tsx");
    assert.ok(types.includes('DEFAULT_LANG: Lang = "bn"'));
    assert.ok(provider.includes("localStorage"));
    assert.ok(read("i18n/LanguageToggle.tsx").includes("বাংলা"));
    assert.ok(read("components/landing/Navbar.tsx").includes("LanguageToggle"));
    assert.ok(read("components/portal/PortalShell.tsx").includes("LanguageToggle"));
    assert.ok(read("components/portal/LoginForm.tsx").includes("LanguageToggle"));
  });

  it("keeps demo pricing separate from backend data and payments", () => {
    const read = (rel) => fs.readFileSync(path.join(srcRoot, rel), "utf8");
    const config = read("config/demo-pricing.ts");
    for (const amount of ["4999", "14999", "34999"]) {
      assert.ok(config.includes(amount), `Missing demo price ${amount}`);
    }
    const pricing = read("components/landing/Pricing.tsx");
    assert.ok(!/lib\/api|fetch\(|payment|checkout/i.test(pricing.replace(/\/\*[\s\S]*?\*\//, "")));
    const landing = read("i18n/dictionaries/landing.ts");
    assert.ok(landing.includes("Demo Pricing"));
    assert.ok(landing.includes("ডেমো মূল্য"));
    assert.ok(
      landing.includes(
        "These prices are for demonstration purposes only and are not actual service charges.",
      ),
    );
  });
});
