"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import type { Post } from "@/types";

function FeedItem({
  isMine,
  senderName,
  text,
  time,
  verse,
  myInitials,
  partnerInitials
}: {
  isMine: boolean;
  senderName: string;
  text: string;
  time: string;
  verse?: string;
  myInitials: string;
  partnerInitials: string;
}) {
  const bubble = isMine ? myInitials : partnerInitials;
  return (
    <motion.div
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`flex gap-3 items-end ${isMine ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`w-10 h-10 rounded-full flex-none flex items-center justify-center text-xs font-semibold ${isMine ? "bg-[var(--jade)]/20 text-[var(--jade)]" : "bg-orange-100 text-orange-600 dark:bg-[var(--gold)]/15 dark:text-[var(--gold-light)]"}`}
      >
        {bubble}
      </div>
      <div className="flex flex-col gap-1 max-w-[80%]">
        <span className={`font-sans text-[11px] font-medium text-[var(--text-3)] ${isMine ? "text-right" : "text-left"}`}>{senderName}</span>
        {verse && (
          <div
            className={`self-start inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--gold)]/10 border border-[var(--gold)]/20 rounded-full text-xs font-medium mb-1 ${isMine ? "self-end text-[var(--ink)]" : "text-[var(--ink)]"}`}
          >
            <BookOpen weight="regular" size={12} className="text-[var(--gold)]" /> {verse}
          </div>
        )}
        <div
          className={`p-4 font-sans text-sm leading-[1.8] ${isMine ? "bg-[var(--ink)] text-[var(--parchment)] rounded-[1.5rem_0.5rem_1.5rem_1.5rem]" : "bg-[var(--panel)] border border-[var(--panel-border)] rounded-[0.5rem_1.5rem_1.5rem_1.5rem] text-[var(--ink)]"}`}
        >
          {text}
        </div>
        <span className={`font-mono text-[10px] text-[var(--text-3)] ${isMine ? "text-right" : "text-left"}`}>{time}</span>
      </div>
    </motion.div>
  );
}

export default function SharedFeed({
  posts,
  currentUserId,
  partnerLinked,
  myName = "You",
  partnerName = "Partner",
  myInitials = "Me",
  partnerInitials = "P",
  emptyHint,
  onSend,
  composerDisabled,
  composerHint
}: {
  posts: Post[];
  currentUserId?: string;
  partnerLinked: boolean;
  myName?: string;
  partnerName?: string;
  myInitials?: string;
  partnerInitials?: string;
  emptyHint?: string;
  onSend?: (body: string) => void;
  composerDisabled?: boolean;
  composerHint?: string;
}) {
  const [feedInput, setFeedInput] = useState("");
  const trimmedInput = feedInput.trim();
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const updateStickToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 96;
  }, []);

  useEffect(() => {
    if (!posts.length || !stickToBottomRef.current) return;
    requestAnimationFrame(() => {
      scrollToLatest("auto");
      requestAnimationFrame(() => scrollToLatest("auto"));
    });
  }, [posts, scrollToLatest]);

  const defaultEmpty =
    emptyHint ??
    (partnerLinked ? "No messages yet. Share the first reflection." : "Link a partner above to load your shared reflections.");

  return (
    <div className="max-w-[680px] mx-auto">
      <h3 className="font-display font-semibold text-2xl text-[var(--ink)] mb-1">Shared Reflections</h3>
      <p className="font-sans text-[var(--text-3)] text-sm mb-12">Your thoughts and your partner&apos;s reflections, together</p>
      <div className="mb-12">
        {posts.length === 0 ? (
          <div className="text-sm text-[var(--text-3)]">{defaultEmpty}</div>
        ) : (
          <div
            ref={listRef}
            onScroll={updateStickToBottom}
            className="max-h-[34rem] overflow-y-auto pr-1 sm:pr-2 scroll-smooth"
          >
            <div className="flex flex-col gap-6">
              {posts.map((p) => (
                <FeedItem
                  key={p.id}
                  isMine={p.author_id === currentUserId}
                  senderName={p.author_id === currentUserId ? myName : partnerName}
                  text={p.body}
                  time={new Date(p.created_at).toLocaleString()}
                  verse={p.verse_reference}
                  myInitials={myInitials.slice(0, 2)}
                  partnerInitials={partnerInitials.slice(0, 2)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="sticky bottom-3 sm:bottom-6 bg-[var(--parchment)]/90 backdrop-blur-md border-t border-[rgba(13,15,18,0.07)] dark:border-white/[0.07] pt-3 sm:pt-4 pb-2 -mx-1 px-1 sm:mx-0 sm:px-0">
        {composerHint ? <p className="text-[11px] text-[var(--text-3)] mb-2">{composerHint}</p> : null}
        <div className="relative">
          <input
            type="text"
            disabled={composerDisabled || !partnerLinked}
            value={feedInput}
            onChange={(e) => setFeedInput(e.target.value)}
            placeholder={partnerLinked ? "Share a reflection…" : "Link a partner to post…"}
            className="w-full bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 font-sans text-sm text-[var(--ink)] placeholder:text-[var(--text-3)] outline-none focus:border-[var(--gold)] focus:shadow-gold-glow transition-all pr-[4.5rem] sm:pr-20 disabled:opacity-50"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex">
            <button
              type="button"
              disabled={composerDisabled || !partnerLinked || !trimmedInput}
              onClick={() => {
                const text = trimmedInput;
                if (!text || !partnerLinked) return;
                stickToBottomRef.current = true;
                onSend?.(text);
                setFeedInput("");
              }}
              className="bg-[var(--gold)] text-[var(--void)] w-11 h-11 shrink-0 rounded-full inline-flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-40 disabled:hover:scale-100"
            >
              <ArrowRight weight="regular" size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
