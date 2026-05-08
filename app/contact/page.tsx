import GlobalNav from "@/components/nav/GlobalNav";

export default function ContactPage() {
  return (
    <>
      <GlobalNav currentPage="home" />
      <main className="min-h-screen bg-[var(--parchment)] pt-28 pb-20 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display font-bold text-4xl text-[var(--ink)] mb-6">Contact</h1>
          <p className="font-sans text-[var(--text-2)] leading-8 mb-4">
            For support, compliance, or developer questions, contact the Al-Rihla team:
          </p>
          <p className="font-sans text-[var(--ink)] text-lg">
            <a className="text-[var(--gold)] underline" href="mailto:support@al-rihla.app">support@al-rihla.app</a>
          </p>
        </div>
      </main>
    </>
  );
}
