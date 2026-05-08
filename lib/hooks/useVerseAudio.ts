"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Howl } from "howler";

export function useVerseAudio(audioUrl: string | null) {
  const howlRef = useRef<Howl | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveBars, setWaveBars] = useState<number[]>(Array.from({ length: 24 }, () => 20));

  useEffect(() => {
    if (!audioUrl) return;
    howlRef.current?.unload();
    const howl = new Howl({
      src: [audioUrl],
      html5: true,
      onload: () => setDuration(howl.duration()),
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onend: () => setIsPlaying(false)
    });
    howlRef.current = howl;
    return () => howl.unload();
  }, [audioUrl]);

  const tick = useCallback(() => {
    const sound = howlRef.current;
    if (!sound) return;
    const seek = Number(sound.seek() || 0);
    setCurrentTime(seek);
    setWaveBars(Array.from({ length: 24 }, (_, i) => 20 + Math.max(0, Math.sin((seek + i) * 2) * 80)));
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const play = useCallback(() => {
    howlRef.current?.play();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);
  const pause = useCallback(() => {
    howlRef.current?.pause();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);
  const progress = useMemo(() => (duration ? currentTime / duration : 0), [currentTime, duration]);
  return { isPlaying, play, pause, progress, duration, currentTime, waveBars };
}
