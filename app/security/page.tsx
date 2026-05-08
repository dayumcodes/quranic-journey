import GlobalNav from "@/components/nav/GlobalNav";

export default function SecurityPage() {
  return (
    <>
      <GlobalNav currentPage="home" />
      <main className="min-h-screen bg-[var(--parchment)] pt-28 pb-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display font-bold text-4xl text-[var(--ink)] mb-6">Security</h1>
          <ul className="font-sans text-[var(--text-2)] leading-8 list-disc pl-6 space-y-2">
            <li>OAuth2 Authorization Code Flow with PKCE for secure authentication.</li>
            <li>Least-privilege API scopes for user data operations.</li>
            <li>HTTPS transport for all production traffic.</li>
            <li>Session-scoped token storage and explicit logout handling.</li>
            <li>Controlled access to user-related APIs and content APIs.</li>
          </ul>
        </div>
      </main>
    </>
  );
}
