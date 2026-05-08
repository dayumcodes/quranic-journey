import type { LocationClassification, NominatimResult } from "@/types";

export function classifyLocation(result: NominatimResult): LocationClassification {
  const raw = `${result.address.amenity ?? ""} ${result.address.building ?? ""} ${result.address.place ?? ""}`.toLowerCase();
  if (/(hospital|clinic|pharmacy)/.test(raw)) {
    return { label: "You are at a hospital", icon: "HeartbeatStraight", keywords: "shifa healing patience sabr illness mercy Allah", contextTag: "Showing verses on: healing & patience" };
  }
  if (/(mosque|masjid)/.test(raw)) {
    return { label: "You are at a mosque", icon: "MosquePillar", keywords: "salah dhikr worship nearness prayer remembrance", contextTag: "Showing verses on: worship & remembrance" };
  }
  if (/(airport|station|travel)/.test(raw)) {
    return { label: "You are travelling", icon: "AirplaneTakeoff", keywords: "safar journey tawakkul dua travel protection", contextTag: "Showing verses on: journey & trust" };
  }
  if (/(cemetery|graveyard)/.test(raw)) {
    return { label: "You are at a cemetery", icon: "FlowerLotus", keywords: "akhirah death hereafter remembrance mortality", contextTag: "Showing verses on: the hereafter" };
  }
  if (/(university|school|library)/.test(raw)) {
    return { label: "You are studying", icon: "BookOpenText", keywords: "ilm knowledge wisdom seeking learning mind", contextTag: "Showing verses on: knowledge & wisdom" };
  }
  return { label: "You are at home", icon: "House", keywords: "peace family tranquility sakina contentment home", contextTag: "Showing verses on: peace & family" };
}
