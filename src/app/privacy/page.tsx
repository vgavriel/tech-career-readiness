import Link from "next/link";

/**
 * Render a lightweight privacy policy page.
 */
export default function PrivacyPolicyPage() {
  return (
    <div className="page-shell min-h-screen overflow-hidden">
      <main
        id="main-content"
        tabIndex={-1}
        className="page-content mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 pb-20 pt-12 md:pt-16"
      >
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
            Privacy Policy
          </p>
          <h1 className="font-display text-4xl text-[color:var(--ink-900)] md:text-5xl">
            How we handle your information
          </h1>
          <p className="text-sm text-[color:var(--ink-500)]">Last updated: January 28, 2026</p>
        </header>

        <section className="space-y-4 text-base text-[color:var(--ink-700)]">
          <p>
            Tech Career Readiness is a learning app for students. We collect a small amount of
            information to run the service, keep it secure, and improve the experience.
          </p>
          <p>
            This policy is provided for transparency and does not replace any terms required by your
            institution or hosting provider.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-[color:var(--ink-900)]">
            Information we collect
          </h2>
          <ul className="list-disc space-y-2 pl-6 text-base text-[color:var(--ink-700)]">
            <li>Account details from Google sign-in (email, name, profile image).</li>
            <li>Learning progress (lesson completion, timestamps, and focus selections).</li>
            <li>
              Technical metadata such as request IDs, IP address (for rate limiting), and basic logs
              needed to operate the service.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-[color:var(--ink-900)]">
            How we use this information
          </h2>
          <ul className="list-disc space-y-2 pl-6 text-base text-[color:var(--ink-700)]">
            <li>Authenticate you and keep your progress synced.</li>
            <li>Personalize your learning experience.</li>
            <li>Keep the app secure and prevent abuse.</li>
            <li>Understand aggregate usage to improve the curriculum.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-[color:var(--ink-900)]">
            Sharing and service providers
          </h2>
          <p className="text-base text-[color:var(--ink-700)]">
            We use trusted service providers to run the app, including Google for authentication,
            Vercel for hosting, and Upstash for rate limiting. We do not sell your personal
            information.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-[color:var(--ink-900)]">
            Data retention and your choices
          </h2>
          <p className="text-base text-[color:var(--ink-700)]">
            We keep your data while your account is active or as needed to operate the service. If
            you would like your account or progress deleted, contact{" "}
            <Link
              href="https://career-center.brown.edu/people/viktor-gavrielov-15"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Viktor Gavrielov
            </Link>{" "}
            at viktor_gavrielov@brown.edu.
          </p>
        </section>
      </main>
    </div>
  );
}
