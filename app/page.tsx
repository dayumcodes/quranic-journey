"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, InstagramLogo, YoutubeLogo } from "@phosphor-icons/react";
import GlobalNav from "@/components/nav/GlobalNav";
import { pageVariants, SPRINGS } from "@/lib/constants/motion";

const LANDING_IMG =
  "?auto=format&fit=crop&w=1200&q=80";

function LandingCard({
  title,
  desc,
  href,
  bg,
  dark,
  imageSrc,
  imageAlt,
  overlayClassName,
  priority,
  imageObjectClass,
}: {
  title: string;
  desc: string;
  href: string;
  bg: string;
  dark?: boolean;
  imageSrc: string;
  imageAlt: string;
  overlayClassName: string;
  priority?: boolean;
  /** Tailwind object-* classes for focal point (wide assets may need a custom crop). */
  imageObjectClass?: string;
}) {
  const resolvedSrc = imageSrc.startsWith("/") ? imageSrc : `${imageSrc}${LANDING_IMG}`;
  const objectClass =
    imageObjectClass ?? "object-cover object-[center_25%] transition-transform duration-500 group-hover:scale-[1.03]";

  return (
    <Link href={href} className="block h-full">
      <motion.div
        whileHover={{ y: -12, scale: 1.02 }}
        transition={SPRINGS.DEFAULT}
        className={`cursor-pointer rounded-3xl sm:rounded-[2.5rem] p-7 sm:p-10 min-h-[280px] h-[min(400px,58vh)] sm:h-[400px] flex flex-col justify-end relative overflow-hidden group ${bg} ${dark ? "border border-white/10" : "border border-[var(--panel-border)] shadow-card-resting hover:shadow-card-hover"}`}
      >
        <div className="absolute inset-0 z-0">
          <Image
            src={resolvedSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className={objectClass}
            priority={priority}
          />
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${overlayClassName}`} aria-hidden />
        </div>
        <div
          className={`absolute top-6 right-6 sm:top-10 sm:right-10 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-rotate-12 backdrop-blur-[2px] ${dark ? "border-white/25 bg-black/20 text-white" : "border-[rgba(13,15,18,0.12)] bg-white/30 text-[var(--ink)]"}`}
        >
          <ArrowRight weight="regular" size={20} />
        </div>
        <div className="relative z-10">
          <h3 className={`font-display font-semibold text-2xl sm:text-4xl tracking-tight mb-3 sm:mb-4 drop-shadow-sm ${dark ? "text-white" : "text-[var(--ink)]"}`}>{title}</h3>
          <p className={`font-sans text-sm leading-relaxed ${dark ? "text-white/80" : "text-[var(--text-2)]"}`}>{desc}</p>
        </div>
      </motion.div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <>
      <GlobalNav currentPage="home" />
      <motion.div className="min-h-screen bg-[var(--parchment)] pt-[5.75rem] sm:pt-32 pb-0 px-4 sm:px-6 md:px-12" variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <div className="max-w-[1320px] mx-auto flex flex-col min-h-[calc(100vh-6rem)] sm:min-h-[calc(100vh-8rem)]">
          <div className="text-center mb-14 sm:mb-20 md:mb-24">
            <h1 className="font-display font-bold text-[clamp(2.25rem,10vw,6rem)] md:text-8xl tracking-tighter leading-[0.95] sm:leading-[0.9] text-[var(--ink)] mb-4 sm:mb-6 px-1">The Journey.</h1>
            <p className="font-sans text-base sm:text-lg text-[var(--text-2)] max-w-[60ch] mx-auto px-2">Your Quranic journey starts here — built for those who want more than reading. Learn with purpose, reflect with stillness, and grow with someone walking beside you.</p>
          </div>
          <div className="w-full max-w-[1320px] grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
            <LandingCard
              title="Journey"
              desc="Step-by-step guidance to master your recitation. Watch your progress unfold as you travel beautifully through the chapters of the Quran."
              bg="bg-[var(--panel)]"
              href="/journey"
              imageSrc="https://images.unsplash.com/photo-1471958680802-1345a694ba6d"
              imageAlt="Asphalt road winding through autumn forest"
              overlayClassName="from-[var(--panel)] via-[var(--panel)]/92 to-transparent"
              imageObjectClass="object-cover object-[center_50%_45%] transition-transform duration-500 group-hover:scale-[1.03]"
              priority
            />
            <LandingCard
              title="Reflect"
              desc="Find your quiet center. Dive deep into the meanings of the verses and let the wisdom of the Quran illuminate your daily life."
              bg="bg-[var(--void)] text-white"
              href="/reflect"
              dark
              imageSrc="/landing/reflect-tadabbur.png"
              imageAlt="Open Quran at dusk by still water with mosque and crescent moon"
              overlayClassName="from-[var(--void)] via-[var(--void)]/88 to-transparent"
              imageObjectClass="object-cover object-[center_50%_42%] transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <LandingCard
              title="Pal"
              desc="You never walk alone. Connect with a companion, share your spiritual milestones, and keep each other inspired every step of the way."
              bg="bg-[#EDE5D5] dark:bg-[#252218]"
              href="/pal"
              imageSrc="/landing/pal-courtyard.png"
              imageAlt="Embossed Quran volumes, lamp, and prayer beads in a tiled courtyard at golden hour"
              overlayClassName="from-[#EDE5D5] via-[#EDE5D5]/92 to-transparent dark:from-[#252218] dark:via-[#252218]/92"
              imageObjectClass="object-cover object-[center_48%_45%] transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
          <footer className="bg-[var(--parchment)] pt-16 sm:pt-24 pb-0 mb-0 border-t border-[var(--panel-border)] mt-16 relative">
            <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-24">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
                <div className="col-span-2 lg:col-span-2">
                  <div className="flex items-center gap-2 mb-6">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="font-display font-bold text-[38px] leading-none tracking-tight text-[var(--ink)]">Al-Rihla</span>
                  </div>
                  <div className="flex flex-col gap-4">
                    <p className="text-[var(--text-2)] text-sm leading-relaxed max-w-xs">Deepen Quran engagement with guided journey, contextual reflection, and accountability with your learning partner.</p>
                    {/* <div className="flex gap-4 mt-2 text-[var(--text-3)]">
                      <InstagramLogo weight="regular" size={20} />
                      <YoutubeLogo weight="regular" size={20} />
                    </div> */}
                    <p className="text-[var(--text-3)] text-xs mt-4">© 2026 Al-Rihla. All rights reserved.</p>
                    {/* <div className="mt-2 flex items-center gap-3 px-3 py-2 border border-[var(--panel-border)] rounded-lg w-fit bg-[var(--panel-muted)]"> */}
                      {/* <div className="w-8 h-8 rounded-full bg-[var(--ink)] text-[var(--parchment)] text-[10px] flex items-center justify-center font-bold">AR</div> */}
                      {/* <div className="flex flex-col">
                        <span className="text-[var(--text-3)] text-[10px] font-semibold uppercase tracking-wider leading-tight">Security</span>
                        <span className="text-[var(--text-3)] text-[10px] font-semibold uppercase tracking-wider leading-tight">Partner</span>
                      </div> */}
                    {/* </div> */}
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="font-semibold text-[var(--ink)]">Links</h4>
                  <Link className="text-[var(--text-2)] hover:text-[var(--gold)] transition-colors text-sm" href="/privacy">Privacy Policy</Link>
                  <Link className="text-[var(--text-2)] hover:text-[var(--gold)] transition-colors text-sm" href="/terms">Terms &amp; Conditions</Link>
                  <Link className="text-[var(--text-2)] hover:text-[var(--gold)] transition-colors text-sm" href="/contact">Contact Us</Link>
                  {/* <Link className="text-[var(--text-2)] hover:text-[var(--gold)] transition-colors text-sm" href="/security">Security</Link> */}
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="font-semibold text-[var(--ink)]">Explore</h4>
                  <Link className="text-[var(--text-2)] hover:text-[var(--gold)] transition-colors text-sm" href="/journey">Journey</Link>
                  <Link className="text-[var(--text-2)] hover:text-[var(--gold)] transition-colors text-sm" href="/reflect">Reflect</Link>
                  <Link className="text-[var(--text-2)] hover:text-[var(--gold)] transition-colors text-sm" href="/pal">Pal</Link>
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
