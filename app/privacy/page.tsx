import GlobalNav from "@/components/nav/GlobalNav";

export default function PrivacyPage() {
  return (
    <>
      <GlobalNav currentPage="home" />
      <main className="min-h-screen bg-[var(--parchment)] pt-28 pb-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display font-bold text-4xl text-[var(--ink)] mb-6">Privacy Policy</h1>
          <p className="font-sans text-[var(--text-2)] leading-8 mb-6">
            Al-Rihla respects your privacy. We collect only the data required to operate Quranic learning features, including
            account profile data (name, email, initials), activity sessions, goals, streaks, collections, and reflections you
            create.
          </p>
          <p className="font-sans text-[var(--text-2)] leading-8 mb-6">
            We use OAuth2/OIDC with Quran Foundation to authenticate users. Access tokens are stored in browser session storage
            for active sessions. We do not sell personal data. Data is used only for core product functionality and support.
          </p>
          <p className="font-sans text-[var(--text-2)] leading-8 mb-6">
            You can request deletion of your account data through the Delete Account page. Security controls include HTTPS
            transport, least-privilege scopes, and controlled API access.
          </p>
          <p className="font-sans text-[var(--text-2)] leading-8">
            Contact: <a className="text-[var(--gold)] underline" href="mailto:support@al-rihla.app">support@al-rihla.app</a>
          </p>
        </div>
      </main>
    </>
  );
}
