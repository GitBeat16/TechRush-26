import type { Destination } from "@/types/dashboard";

export interface DestinationTip {
  id: string;
  icon: string;
  tip: string;
  highlight?: string;
}

const DESTINATION_TIPS_MAP: Record<string, DestinationTip[]> = {
  goa: [
    { id: "g1", icon: "scooter", tip: "Rent a scooter (approx ₹300-₹500/day) instead of relying on expensive private taxis.", highlight: "Scooter rental" },
    { id: "g2", icon: "sun", tip: "Visit famous beach shacks & fort vistas during early morning to avoid peak tourist pricing.", highlight: "Early mornings" },
    { id: "g3", icon: "pin", tip: "Explore South Goa (Palolem, Agonda) for peaceful, budget-friendly guesthouses.", highlight: "South Goa stays" },
  ],
  japan: [
    { id: "j1", icon: "transport", tip: "Purchase a JR Regional Rail Pass or Kansai Area Pass for unlimited train transit.", highlight: "JR Rail Pass" },
    { id: "j2", icon: "food", tip: "Use convenience stores (7-Eleven, Lawson) for high-quality, delicious meals under ₹400.", highlight: "Konbini meals" },
    { id: "j3", icon: "wallet", tip: "Load a digital Suica or Pasmo IC card on your phone for instant subway taps.", highlight: "IC Transit Card" },
  ],
  paris: [
    { id: "p1", icon: "ticket", tip: "Buy a Paris Museum Pass to skip ticket queues and access 50+ monuments.", highlight: "Museum Pass" },
    { id: "p2", icon: "car", tip: "Use the Paris Métro 10-ticket carnet instead of single fare tickets.", highlight: "Métro Carnet" },
    { id: "p3", icon: "food", tip: "Enjoy fresh bakery baguettes and picnics in the Luxembourg Gardens.", highlight: "Garden picnics" },
  ],
  kerala: [
    { id: "k1", icon: "boat", tip: "Book Alleppey houseboats or day Shikara boats directly to avoid agent markups.", highlight: "Direct boat booking" },
    { id: "k2", icon: "car", tip: "Take KSRTC bus routes between Kochi and Munnar for scenic, ultra-cheap transit.", highlight: "KSRTC scenic bus" },
    { id: "k3", icon: "food", tip: "Dine at local Toddy Shops or Karimpumkala for authentic, fresh seafood.", highlight: "Local seafood" },
  ],
  bali: [
    { id: "b1", icon: "car", tip: "Hire a private day driver (₹2,500/day) for full island tours instead of single taxis.", highlight: "Private day driver" },
    { id: "b2", icon: "pin", tip: "Visit Uluwatu and Tanah Lot temples before 9 AM for peaceful sunrise views.", highlight: "Early temple visits" },
    { id: "b3", icon: "food", tip: "Dine at traditional Warungs for delicious Nasi Goreng under ₹200.", highlight: "Local Warungs" },
  ],
  switzerland: [
    { id: "s1", icon: "mountain", tip: "Get a Swiss Travel Pass for unlimited alpine trains, lake steamers & cable cars.", highlight: "Swiss Travel Pass" },
    { id: "s2", icon: "food", tip: "Shop at Coop or Migros supermarkets for fresh mountain picnic lunches.", highlight: "Supermarket meals" },
  ],
  iceland: [
    { id: "i1", icon: "car", tip: "Rent a 4WD campervan to combine accommodation & transportation in one.", highlight: "Campervan travel" },
    { id: "i2", icon: "water", tip: "Iceland tap water is pristine glacier water—never buy bottled water.", highlight: "Free tap water" },
  ],
  portugal: [
    { id: "pt1", icon: "car", tip: "Get a Lisboa Card for unlimited tram 28 transit and free museum entries.", highlight: "Lisboa Card" },
    { id: "pt2", icon: "food", tip: "Order the 'Prato do Dia' (Daily Special) for authentic 3-course Portuguese lunches.", highlight: "Prato do Dia" },
  ],
  vietnam: [
    { id: "v1", icon: "food", tip: "Enjoy street side Pho and Banh Mi stalls for incredible ₹150 meals.", highlight: "Street side Pho" },
    { id: "v2", icon: "car", tip: "Use the Grab ride app for upfront fare pricing across Hanoi and Da Nang.", highlight: "Grab app rides" },
  ],
};

/**
 * Gets destination-specific travel tips for a destination object.
 */
export function getDestinationTips(destination?: Destination): DestinationTip[] {
  if (!destination) return DESTINATION_TIPS_MAP.japan;

  const key = destination.id.toLowerCase();
  if (DESTINATION_TIPS_MAP[key]) return DESTINATION_TIPS_MAP[key];

  // Match by country / region if specific ID is not listed
  const countryKey = destination.country.toLowerCase();
  if (DESTINATION_TIPS_MAP[countryKey]) return DESTINATION_TIPS_MAP[countryKey];

  return DESTINATION_TIPS_MAP.goa;
}
