import GlobalNav from "@/components/nav/GlobalNav";

export default function DeleteAccountPage() {
  return (
    <>
      <GlobalNav currentPage="home" />
      <main className="min-h-screen bg-[var(--parchment)] pt-28 pb-20 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display font-bold text-4xl text-[var(--ink)] mb-6">Delete Account</h1>
          <p className="font-sans text-[var(--text-2)] leading-8 mb-6">
            To request account deletion and data removal, email us from your registered account email address.
          </p>
          <p className="font-sans text-[var(--ink)] text-lg">
            <a className="text-[var(--gold)] underline" href="mailto:support@al-rihla.app?subject=Delete%20My%20Account">
              support@al-rihla.app
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
