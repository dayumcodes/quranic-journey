"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Howl } from "howler";

interface UseVerseAudioOptions {
  onEnded?: () => void;
}

export function useVerseAudio(audioUrl: string | null, options: UseVerseAudioOptions = {}) {
  const { onEnded } = options;
  const howlRef = useRef<Howl | null>(null);
  const rafRef = useRef<number | null>(null);
  const continuePlaybackRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveBars, setWaveBars] = useState<number[]>(Array.from({ length: 24 }, () => 20));

  const tick = useCallback(() => {
    const sound = howlRef.current;
    if (!sound) return;
    const seek = Number(sound.seek() || 0);
    setCurrentTime(seek);
    setWaveBars(Array.from({ length: 24 }, (_, i) => 20 + Math.max(0, Math.sin((seek + i) * 2) * 80)));
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!audioUrl) return;
    howlRef.current?.unload();
    const howl = new Howl({
      src: [audioUrl],
      html5: true,
      preload: true,
      volume: 1,
      onload: () => {
        setDuration(howl.duration());
        if (continuePlaybackRef.current) {
          howl.play();
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(tick);
        }
      },
      onloaderror: () => {},
      onplayerror: () => {},
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onend: () => {
        setIsPlaying(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (continuePlaybackRef.current) onEnded?.();
      }
    });
    howlRef.current = howl;
    return () => {
      howl.unload();
    };
  }, [audioUrl, onEnded, tick]);

  const play = useCallback(() => {
    continuePlaybackRef.current = true;
    howlRef.current?.play();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);
  const pause = useCallback(() => {
    continuePlaybackRef.current = false;
    howlRef.current?.pause();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);
  const progress = useMemo(() => (duration ? currentTime / duration : 0), [currentTime, duration]);
  return { isPlaying, play, pause, progress, duration, currentTime, waveBars };
}
