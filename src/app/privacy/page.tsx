import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — What People Think",
  description: "How What People Think handles searches and public discussion data.",
};

export default function PrivacyPage() {
  return (
    <main className="relative h-[100dvh] overflow-y-auto px-5 py-10 sm:px-8 page-ink">
      <article className="mx-auto max-w-[720px] rounded-[32px] border border-white/70 bg-white/55 p-6 shadow-[0_24px_80px_rgba(38,43,48,0.12)] backdrop-blur-xl sm:p-10">
        <a href="/" className="text-[13px] font-semibold underline underline-offset-4">← What People Think</a>
        <h1 className="mb-3 mt-8 text-[clamp(32px,6vw,52px)] font-semibold tracking-[-0.04em]">Privacy</h1>
        <p className="m-0 text-[14px] text-muted">Last updated 12 September 2026.</p>

        <div className="mt-8 space-y-7 text-[15px] leading-7 text-ink">
          <section>
            <h2 className="mb-2 text-[18px] font-semibold">What the app processes</h2>
            <p className="m-0">When you search, the app sends your search phrase to the selected public-data services and temporarily processes the public posts or comments they return. Do not enter private or sensitive personal information in a search.</p>
          </section>
          <section>
            <h2 className="mb-2 text-[18px] font-semibold">How AI is used</h2>
            <p className="m-0">The search phrase is sent to OpenAI and its web-search service to identify the subject and check current facts. The verified name and supported alternative names are then used to search public-data services. A bounded sample of public discussion and the factual context are sent to OpenAI to produce the answer. These requests disable OpenAI response storage, and the app does not use the material to train its own model; OpenAI may still process or retain API data under its own terms and abuse-monitoring rules.</p>
          </section>
          <section>
            <h2 className="mb-2 text-[18px] font-semibold">Storage and accounts</h2>
            <p className="m-0">The app has no user accounts and does not put search phrases or social-media content in its own database. Its hosting and API providers may process technical records such as IP addresses, request times and errors for security, reliability and legal compliance.</p>
          </section>
          <section>
            <h2 className="mb-2 text-[18px] font-semibold">Public-source attribution</h2>
            <p className="m-0">Representative evidence links back to the original platform. Reddit evidence includes the public username supplied by Reddit for attribution. The app does not use usernames for profiling or send them to the AI analysis.</p>
          </section>
          <section>
            <h2 className="mb-2 text-[18px] font-semibold">External links</h2>
            <p className="m-0">Following an evidence link takes you to another service, whose privacy policy and terms then apply. This policy will be updated if the app begins collecting accounts, analytics or other personal data.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
