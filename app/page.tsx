"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, InstagramLogo, YoutubeLogo } from "@phosphor-icons/react";
import GlobalNav from "@/components/nav/GlobalNav";
import { pageVariants, SPRINGS } from "@/lib/constants/motion";

function LandingCard({ title, desc, href, bg, dark }: { title: string; desc: string; href: string; bg: string; dark?: boolean }) {
  return (
    <Link href={href}>
      <motion.div whileHover={{ y: -12, scale: 1.02 }} transition={SPRINGS.DEFAULT} className={`cursor-pointer rounded-[2.5rem] p-10 h-[400px] flex flex-col justify-end relative overflow-hidden group ${bg} ${dark ? "border border-white/10" : "border border-[rgba(13,15,18,0.08)] shadow-card-resting hover:shadow-card-hover"}`}>
        <div className={`absolute top-10 right-10 w-12 h-12 rounded-full border flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-rotate-12 ${dark ? "border-white/20 text-white" : "border-[rgba(13,15,18,0.1)] text-[var(--ink)]"}`}>
          <ArrowRight weight="regular" size={20} />
        </div>
        <h3 className={`font-display font-semibold text-4xl tracking-tight mb-4 ${dark ? "text-white" : "text-[var(--ink)]"}`}>{title}</h3>
        <p className={`font-sans text-sm leading-relaxed ${dark ? "text-[var(--text-3)]" : "text-[var(--text-2)]"}`}>{desc}</p>
      </motion.div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <>
      <GlobalNav currentPage="home" />
      <motion.div className="min-h-screen bg-[var(--parchment)] pt-32 pb-0 px-6 md:px-12" variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <div className="max-w-[1320px] mx-auto flex flex-col min-h-[calc(100vh-8rem)]">
          <div className="text-center mb-24">
            <h1 className="font-display font-bold text-6xl md:text-8xl tracking-tighter leading-[0.9] text-[var(--ink)] mb-6">The Journey.</h1>
            <p className="font-sans text-lg text-[var(--text-2)] max-w-[60ch] mx-auto">Three distinct interfaces for Quranic engagement, built with award-winning motion physics and asymmetrical gallery layouts.</p>
          </div>
          <div className="w-full max-w-[1320px] grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <LandingCard title="Journey" desc="Gamified learning paths for kids with dynamic SVG maps and spring-physics interactions." bg="bg-white" href="/journey" />
            <LandingCard title="Reflect" desc="Location-aware meditative space featuring generative canvas meshes and massive typography." bg="bg-[var(--void)] text-white" href="/reflect" dark />
            <LandingCard title="Pal" desc="Social accountability dashboard with asymmetric layouts and synchronized progress tracking." bg="bg-[#EDE5D5]" href="/pal" />
          </div>
          <footer className="bg-[var(--parchment)] pt-16 sm:pt-24 pb-0 mb-0 border-t border-gray-100 mt-16 relative">
            <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-24">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
                <div className="col-span-2 lg:col-span-2">
                  <div className="flex items-center gap-2 mb-6">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="font-display font-bold text-[38px] leading-none tracking-tight text-[#0F172A]">Al-Rihla</span>
                  </div>
                  <div className="flex flex-col gap-4">
                    <p className="text-gray-500 text-sm leading-relaxed max-w-xs">Deepen Quran engagement with guided journey, contextual reflection, and accountability with your learning partner.</p>
                    <div className="flex gap-4 mt-2 text-gray-400">
                      <InstagramLogo weight="regular" size={20} />
                      <YoutubeLogo weight="regular" size={20} />
                    </div>
                    <p className="text-gray-400 text-xs mt-4">© 2026 Al-Rihla. All rights reserved.</p>
                    <div className="mt-2 flex items-center gap-3 px-3 py-2 border border-gray-100 rounded-lg w-fit bg-gray-50">
                      <div className="w-8 h-8 rounded-full bg-[var(--ink)] text-white text-[10px] flex items-center justify-center font-bold">AR</div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider leading-tight">Security</span>
                        <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider leading-tight">Partner</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="font-semibold text-gray-900">Company</h4>
                  <Link className="text-gray-500 hover:text-blue-600 transition-colors text-sm" href="/privacy">Privacy Policy</Link>
                  <Link className="text-gray-500 hover:text-blue-600 transition-colors text-sm" href="/terms">Terms &amp; Conditions</Link>
                  <Link className="text-gray-500 hover:text-blue-600 transition-colors text-sm" href="/contact">Contact Us</Link>
                  <Link className="text-gray-500 hover:text-blue-600 transition-colors text-sm" href="/security">Security</Link>
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="font-semibold text-gray-900">Explore</h4>
                  <Link className="text-gray-500 hover:text-blue-600 transition-colors text-sm" href="/journey">Journey</Link>
                  <Link className="text-gray-500 hover:text-blue-600 transition-colors text-sm" href="/reflect">Reflect</Link>
                  <Link className="text-gray-500 hover:text-blue-600 transition-colors text-sm" href="/pal">Pal</Link>
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="font-semibold text-gray-900">Account</h4>
                  <Link className="text-gray-500 hover:text-blue-600 transition-colors text-sm" href="/delete-account">Delete Account</Link>
                  <Link className="text-gray-500 hover:text-blue-600 transition-colors text-sm" href="/auth/callback">OAuth Callback</Link>
                  <Link className="text-gray-500 hover:text-blue-600 transition-colors text-sm" href="/logout">Logout</Link>
                </div>
              </div>
            </div>
            <div className="w-full text-center overflow-hidden leading-none select-none pointer-events-none pb-0 mb-0 px-4 sm:px-0">
              <span className="text-[17vw] sm:text-[15vw] font-bold bg-gradient-to-b from-[rgba(184,148,63,0.28)] to-[rgba(244,239,230,0)] bg-clip-text text-transparent block transform translate-y-[14%] leading-[0.85] mb-0">Al-Rihla</span>
            </div>
          </footer>
        </div>
      </motion.div>
    </>
  );
}
