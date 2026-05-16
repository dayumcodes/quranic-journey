import GlobalNav from "@/components/nav/GlobalNav";

export default function TermsPage() {
  return (
    <>
      <GlobalNav currentPage="home" />
      <main className="min-h-screen bg-[var(--parchment)] pt-28 pb-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display font-bold text-4xl text-[var(--ink)] mb-6">Terms of Service</h1>
          <p className="font-sans text-[var(--text-2)] leading-8 mb-6">
            By using Al-Rihla, you agree to use the service lawfully and respectfully. You are responsible for activity under
            your account and for keeping your account credentials secure.
          </p>
          <p className="font-sans text-[var(--text-2)] leading-8 mb-6">
            Al-Rihla provides Quranic learning and reflection tools on an as-is basis. We may update or discontinue features
            to improve safety, reliability, and quality.
          </p>
          <p className="font-sans text-[var(--text-2)] leading-8 mb-6">
            You retain ownership of content you create (such as reflections and notes), while granting Al-Rihla permission to
            process and display that content for product functionality.
          </p>
          <p className="font-sans text-[var(--text-2)] leading-8">
            Contact: <a className="text-[var(--gold)] underline" href="mailto:mfuzail7820@gmail.com">mfuzail7820@gmail.com</a>
          </p>
        </div>
      </main>
    </>
  );
}
