export interface BadgeMeta {
  id: string;
  name: string;
  description: string;
}

export const BADGES: BadgeMeta[] = [
  { id: "gate-protection", name: "Gate of Protection", description: "Unlocked after quiz completion." }
];
