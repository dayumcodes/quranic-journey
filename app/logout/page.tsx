"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuthStore();

  useEffect(() => {
    logout();
    router.replace("/");
  }, [logout, router]);

  return (
    <main className="min-h-screen bg-[var(--parchment)] flex items-center justify-center">
      <p className="font-sans text-[var(--text-2)]">Logging you out...</p>
    </main>
  );
}
