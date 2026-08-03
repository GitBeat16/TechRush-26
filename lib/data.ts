import type {
  Achievement,
  ComparisonCandidate,
  Destination,
  ItineraryDay,
  PackingItem,
  TravelStat,
  TravelStyle,
  Traveler,
  Trip,
  WeatherNow,
} from "@/types/dashboard";

export const USER = {
  firstName: "Srushti",
  fullName: "Srushti Kalokhe",
  initials: "SR",
  homeCity: "Bengaluru",
  memberSince: "2023",
};

export const TRAVELERS: Record<string, Traveler> = {
  t1: { id: "t1", name: "Srushti", initials: "SR", tone: "peach" },
  t2: { id: "t2", name: "Aarav", initials: "AA", tone: "mint" },
  t3: { id: "t3", name: "Meera", initials: "ME", tone: "lilac" },
};

/* ------------------------------------------------------------------ */
/* Packing templates                                                   */
/* ------------------------------------------------------------------ */

function packing(prefix: string, packed: string[] = []): PackingItem[] {
  const template: [string, PackingItem["category"]][] = [
    ["Light jackets", "Clothes"],
    ["Walking shoes", "Clothes"],
    ["Rain shell", "Clothes"],
    ["Comfy socks x6", "Clothes"],
    ["Passport", "Documents"],
    ["Visa printout", "Documents"],
    ["Travel insurance", "Documents"],
    ["Transit pass voucher", "Documents"],
    ["Universal adapter", "Electronics"],
    ["Power bank", "Electronics"],
    ["Camera + spare SD", "Electronics"],
    ["Noise cancelling buds", "Electronics"],
    ["Medicines pouch", "Essentials"],
    ["Sunscreen", "Essentials"],
    ["Reusable bottle", "Essentials"],
    ["Foldable tote", "Essentials"],
  ];

  return template.map(([label, category], index) => ({
    id: `${prefix}-p${index + 1}`,
    label,
    category,
    packed: packed.includes(label),
  }));
}

/* ------------------------------------------------------------------ */
/* Trips                                                               */
/* ------------------------------------------------------------------ */

const japanItinerary: ItineraryDay[] = [
  {
    id: "jp-d1",
    label: "Day 1 · Land in Osaka",
    date: "14 Oct",
    items: [
      { id: "jp-1a", time: "09:40", title: "Arrive at Kansai Airport", note: "Pick up transit pass at the counter", cost: 0, category: "travel", done: true },
      { id: "jp-1b", time: "12:30", title: "Check in, Namba", note: "Drop bags, shower, reset", cost: 6800, category: "stay", done: true },
      { id: "jp-1c", time: "18:00", title: "Dotonbori walk", note: "Street food, neon, slow first evening", cost: 1400, category: "food", done: false },
    ],
  },
  {
    id: "jp-d2",
    label: "Day 2 · Kyoto temples",
    date: "15 Oct",
    items: [
      { id: "jp-2a", time: "07:15", title: "Train to Kyoto", note: "Reserved seats, 30 min", cost: 1200, category: "travel", done: false },
      { id: "jp-2b", time: "08:30", title: "Fushimi Inari", note: "Go early, the gates empty out above the halfway point", cost: 0, category: "sight", done: false },
      { id: "jp-2c", time: "13:00", title: "Nishiki Market lunch", note: "Standing counters, pay as you go", cost: 1600, category: "food", done: false },
      { id: "jp-2d", time: "16:00", title: "Kiyomizu-dera", note: "Golden hour from the terrace", cost: 500, category: "sight", done: false },
    ],
  },
  {
    id: "jp-d3",
    label: "Day 3 · Arashiyama",
    date: "16 Oct",
    items: [
      { id: "jp-3a", time: "09:00", title: "Bamboo grove", note: "Quiet before 10am", cost: 0, category: "sight", done: false },
      { id: "jp-3b", time: "11:30", title: "Riverside lunch", note: "Reserve the day before", cost: 2200, category: "food", done: false },
      { id: "jp-3c", time: "15:00", title: "Open afternoon", note: "Wanderly keeps two hours free for detours", cost: 0, category: "free", done: false },
    ],
  },
  {
    id: "jp-d4",
    label: "Day 4 · Nara day trip",
    date: "17 Oct",
    items: [
      { id: "jp-4a", time: "08:45", title: "Train to Nara", note: "Buy crackers for the deer at the station", cost: 900, category: "travel", done: false },
      { id: "jp-4b", time: "10:00", title: "Todai-ji", note: "The Great Buddha hall", cost: 600, category: "sight", done: false },
    ],
  },
];

export const SEED_TRIPS: Trip[] = [
  {
    id: "trip-japan",
    title: "Japan Adventure",
    country: "Japan",
    destinationId: "japan",
    startDate: "14 Oct 2026",
    endDate: "23 Oct 2026",
    days: 9,
    budget: 180000,
    currency: "INR",
    tone: "blush",
    status: "upcoming",
    summary: "Nine days across Osaka, Kyoto and Nara, built around food and slow mornings.",
    travelers: [TRAVELERS.t1, TRAVELERS.t2, TRAVELERS.t3],
    milestones: [
      { id: "m1", label: "Flights booked", done: true },
      { id: "m2", label: "Visa approved", done: true },
      { id: "m3", label: "Stays confirmed", done: true },
      { id: "m4", label: "Rail pass ordered", done: false },
      { id: "m5", label: "Packing done", done: false },
    ],
    itinerary: japanItinerary,
    packing: packing("jp", [
      "Light jackets", "Passport", "Visa printout", "Power bank", "Sunscreen",
    ]),
    expenses: [
      { id: "jp-e1", label: "Return flights", amount: 62000, category: "travel", paidBy: "t1", splitWith: ["t1", "t2", "t3"], date: "02 Aug" },
      { id: "jp-e2", label: "Namba apartment, 4 nights", amount: 27200, category: "stay", paidBy: "t2", splitWith: ["t1", "t2", "t3"], date: "05 Aug" },
      { id: "jp-e3", label: "Rail passes", amount: 14400, category: "travel", paidBy: "t1", splitWith: ["t1", "t2", "t3"], date: "11 Aug" },
      { id: "jp-e4", label: "Travel insurance", amount: 4500, category: "other", paidBy: "t3", splitWith: ["t1", "t2", "t3"], date: "12 Aug" },
      { id: "jp-e5", label: "Teamlab tickets", amount: 2400, category: "activity", paidBy: "t2", splitWith: ["t1", "t2"], date: "18 Aug" },
    ],
  },
  {
    id: "trip-bali",
    title: "Bali Reset",
    country: "Indonesia",
    destinationId: "bali",
    startDate: "06 Feb 2027",
    endDate: "11 Feb 2027",
    days: 5,
    budget: 70000,
    currency: "INR",
    tone: "mint",
    status: "planning",
    summary: "Five slow days. Rice terraces, warm water, nothing scheduled before ten.",
    travelers: [TRAVELERS.t1, TRAVELERS.t2],
    milestones: [
      { id: "m1", label: "Dates agreed", done: true },
      { id: "m2", label: "Flights booked", done: false },
      { id: "m3", label: "Stays confirmed", done: false },
      { id: "m4", label: "Packing done", done: false },
    ],
    itinerary: [
      {
        id: "bl-d1",
        label: "Day 1 · Arrive Ubud",
        date: "06 Feb",
        items: [
          { id: "bl-1a", time: "14:00", title: "Airport transfer", note: "Pre-booked, 90 minutes", cost: 1800, category: "travel", done: false },
          { id: "bl-1b", time: "19:00", title: "Dinner near the palace", note: "", cost: 900, category: "food", done: false },
        ],
      },
    ],
    packing: packing("bl", ["Sunscreen"]),
    expenses: [
      { id: "bl-e1", label: "Deposit, villa", amount: 9000, category: "stay", paidBy: "t1", splitWith: ["t1", "t2"], date: "20 Jul" },
    ],
  },
  {
    id: "trip-lisbon",
    title: "Lisbon Long Weekend",
    country: "Portugal",
    destinationId: "portugal",
    startDate: "12 Apr 2026",
    endDate: "16 Apr 2026",
    days: 4,
    budget: 95000,
    currency: "INR",
    tone: "peach",
    status: "completed",
    summary: "Tiled streets, cliff coast, more pastéis than strictly sensible.",
    travelers: [TRAVELERS.t1, TRAVELERS.t3],
    milestones: [
      { id: "m1", label: "Flights booked", done: true },
      { id: "m2", label: "Stays confirmed", done: true },
      { id: "m3", label: "Packing done", done: true },
    ],
    itinerary: [
      {
        id: "lx-d1",
        label: "Day 1 · Alfama",
        date: "12 Apr",
        items: [
          { id: "lx-1a", time: "10:00", title: "Tram 28 end to end", note: "Board at Martim Moniz", cost: 300, category: "sight", done: true },
          { id: "lx-1b", time: "13:00", title: "Time Out Market", note: "", cost: 1500, category: "food", done: true },
        ],
      },
    ],
    packing: packing("lx", [
      "Light jackets", "Walking shoes", "Rain shell", "Comfy socks x6",
      "Passport", "Visa printout", "Travel insurance", "Transit pass voucher",
      "Universal adapter", "Power bank", "Camera + spare SD",
      "Noise cancelling buds", "Medicines pouch", "Sunscreen",
      "Reusable bottle", "Foldable tote",
    ]),
    expenses: [
      { id: "lx-e1", label: "Flights", amount: 54000, category: "travel", paidBy: "t1", splitWith: ["t1", "t3"], date: "02 Mar" },
      { id: "lx-e2", label: "Apartment, 4 nights", amount: 24000, category: "stay", paidBy: "t3", splitWith: ["t1", "t3"], date: "04 Mar" },
      { id: "lx-e3", label: "Food and coffee", amount: 11200, category: "food", paidBy: "t1", splitWith: ["t1", "t3"], date: "16 Apr" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Destinations                                                        */
/* ------------------------------------------------------------------ */

export const DESTINATIONS: Destination[] = [
  {
    id: "japan", name: "Japan", country: "Japan", region: "Asia",
    price: 80000, days: 7, tone: "blush",
    tagline: "Temples, ramen alleys and bullet trains",
    rating: 4.9, bestSeason: "Mar - May",
    vibes: ["Culture", "Food", "Cities"],
  },
  {
    id: "bali", name: "Bali", country: "Indonesia", region: "Asia",
    price: 35000, days: 5, tone: "mint",
    tagline: "Rice terraces, warm water, slow mornings",
    rating: 4.7, bestSeason: "Apr - Oct",
    vibes: ["Beaches", "Nature", "Relaxed"],
  },
  {
    id: "switzerland", name: "Switzerland", country: "Switzerland", region: "Europe",
    price: 120000, days: 8, tone: "sky",
    tagline: "Alpine trains and impossibly green valleys",
    rating: 4.8, bestSeason: "Jun - Sep",
    vibes: ["Nature", "Hiking", "Scenic"],
  },
  {
    id: "iceland", name: "Iceland", country: "Iceland", region: "Nordics",
    price: 145000, days: 6, tone: "lilac",
    tagline: "Black beaches, geysers and northern lights",
    rating: 4.8, bestSeason: "Sep - Mar",
    vibes: ["Nature", "Adventure", "Scenic"],
  },
  {
    id: "vietnam", name: "Vietnam", country: "Vietnam", region: "Asia",
    price: 42000, days: 6, tone: "butter",
    tagline: "Limestone bays and street food marathons",
    rating: 4.6, bestSeason: "Nov - Apr",
    vibes: ["Food", "Nature", "Budget"],
  },
  {
    id: "portugal", name: "Portugal", country: "Portugal", region: "Europe",
    price: 95000, days: 7, tone: "peach",
    tagline: "Tiled streets, cliff coasts and pastéis",
    rating: 4.7, bestSeason: "May - Sep",
    vibes: ["Culture", "Beaches", "Food"],
  },
];

export const REGIONS = ["All", "Asia", "Europe", "Nordics"] as const;
export const VIBES = [
  "Culture", "Food", "Nature", "Beaches", "Adventure", "Hiking", "Scenic",
  "Cities", "Relaxed", "Budget",
];

/* ------------------------------------------------------------------ */
/* Comparison                                                          */
/* ------------------------------------------------------------------ */

export const COMPARISON_CANDIDATES: ComparisonCandidate[] = [
  {
    id: "japan", name: "Japan", country: "Asia", tone: "blush",
    metrics: [
      { id: "budget", label: "Total budget", score: 42, display: "Rs 80,000", lowerIsBetter: true },
      { id: "weather", label: "Weather", score: 88, display: "18 - 24 C" },
      { id: "activities", label: "Activities", score: 94, display: "Very high" },
      { id: "food", label: "Food", score: 96, display: "Legendary" },
      { id: "safety", label: "Safety", score: 97, display: "Excellent" },
      { id: "difficulty", label: "Travel difficulty", score: 34, display: "Easy", lowerIsBetter: true },
    ],
  },
  {
    id: "bali", name: "Bali", country: "Indonesia", tone: "mint",
    metrics: [
      { id: "budget", label: "Total budget", score: 22, display: "Rs 35,000", lowerIsBetter: true },
      { id: "weather", label: "Weather", score: 78, display: "26 - 31 C" },
      { id: "activities", label: "Activities", score: 82, display: "High" },
      { id: "food", label: "Food", score: 85, display: "Excellent" },
      { id: "safety", label: "Safety", score: 79, display: "Good" },
      { id: "difficulty", label: "Travel difficulty", score: 28, display: "Very easy", lowerIsBetter: true },
    ],
  },
  {
    id: "switzerland", name: "Switzerland", country: "Europe", tone: "sky",
    metrics: [
      { id: "budget", label: "Total budget", score: 78, display: "Rs 1,20,000", lowerIsBetter: true },
      { id: "weather", label: "Weather", score: 72, display: "9 - 18 C" },
      { id: "activities", label: "Activities", score: 88, display: "High" },
      { id: "food", label: "Food", score: 74, display: "Very good" },
      { id: "safety", label: "Safety", score: 98, display: "Excellent" },
      { id: "difficulty", label: "Travel difficulty", score: 45, display: "Moderate", lowerIsBetter: true },
    ],
  },
  {
    id: "vietnam", name: "Vietnam", country: "Asia", tone: "butter",
    metrics: [
      { id: "budget", label: "Total budget", score: 25, display: "Rs 42,000", lowerIsBetter: true },
      { id: "weather", label: "Weather", score: 74, display: "24 - 30 C" },
      { id: "activities", label: "Activities", score: 80, display: "High" },
      { id: "food", label: "Food", score: 92, display: "Outstanding" },
      { id: "safety", label: "Safety", score: 76, display: "Good" },
      { id: "difficulty", label: "Travel difficulty", score: 40, display: "Moderate", lowerIsBetter: true },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export const TRAVEL_STATS: TravelStat[] = [
  { id: "countries", label: "Countries visited", value: 12, caption: "3 new this year", tone: "sky", icon: "globe" },
  { id: "trips", label: "Trips completed", value: 27, caption: "Avg 6 days each", tone: "peach", icon: "suitcase" },
  { id: "streak", label: "Travel streak", value: 4, suffix: " yrs", caption: "One trip every quarter", tone: "butter", icon: "flame" },
  { id: "memories", label: "Memories saved", value: 1480, caption: "Photos, notes and pins", tone: "lilac", icon: "camera" },
];

export const ACHIEVEMENTS: Achievement[] = [
  { id: "a1", label: "First flight", detail: "Booked your first trip on Wanderly", tone: "mint", unlocked: true },
  { id: "a2", label: "Light packer", detail: "Finished a packing list before departure day", tone: "sky", unlocked: true },
  { id: "a3", label: "Three continents", detail: "Trips logged across three continents", tone: "butter", unlocked: true },
  { id: "a4", label: "Budget keeper", detail: "Finished a trip under budget", tone: "peach", unlocked: true },
  { id: "a5", label: "Nine day wanderer", detail: "Complete a trip longer than a week", tone: "lilac", unlocked: false },
  { id: "a6", label: "Northern lights", detail: "Visit somewhere above 60 degrees north", tone: "blush", unlocked: false },
];

export const WEATHER: WeatherNow = {
  city: "Kyoto",
  temperature: 19,
  condition: "Soft clouds, light breeze",
  high: 23,
  low: 14,
  icon: "cloud",
};

/* ------------------------------------------------------------------ */
/* Planner options                                                     */
/* ------------------------------------------------------------------ */

export const TRAVEL_STYLES: TravelStyle[] = ["Relaxed", "Adventure", "Culture", "Luxury"];

export const INTERESTS = [
  "Food", "Nature", "Museums", "Nightlife", "Shopping", "Hiking", "Beaches", "Photography",
];

export const AI_STEPS = [
  "Reading your travel style",
  "Scanning routes and stays",
  "Balancing budget against days",
  "Shaping a day by day plan",
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function formatInr(value: number): string {
  return `Rs ${Math.round(value).toLocaleString("en-IN")}`;
}

export function formatShort(value: number): string {
  if (value >= 100000) return `Rs ${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `Rs ${Math.round(value / 1000)}k`;
  return `Rs ${value}`;
}

export function greetingFor(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
