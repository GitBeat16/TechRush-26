import type { Metadata, Viewport } from "next";
import { Grandstander, Karla } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import { IntroSplash } from "@/components/shell/IntroSplash";
import { ThemeProvider, THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme/ThemeProvider";
import "./globals.css";

// Two families, three tiers. Grandstander carries every voice that speaks up —
// page titles, section headings, card titles, numbers — its bouncing baseline
// and rounded terminals are the typographic echo of the clay shapes behind it.
// Karla carries everything you actually read: a quiet grotesque with enough
// character in the italics to not feel like a system font.
//
// Both are variable, so a single load covers the whole weight range and the
// browser never has to fake a bold.
const grandstander = Grandstander({
  variable: "--font-grandstander",
  subsets: ["latin"],
  display: "swap",
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wanderly — Your AI travel command center",
  description:
    "Plan, pack and compare trips with a playful AI travel assistant.",
};

export const viewport: Viewport = {
  themeColor: "#f1e7dc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="clay"
      // The bootstrap script below rewrites data-theme before React hydrates,
      // which is a deliberate server/client mismatch, not a bug.
      suppressHydrationWarning
      className={`${grandstander.variable} ${karla.variable} h-full antialiased`}
    >
      <head>
        {/* Applies the cached theme before first paint. Without this the
            default palette flashes for one frame while /api/auth/me loads. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-clay-bg text-clay-ink">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
          {/* Overlay, not a gate — the app below hydrates and fetches while
              this holds for one full flight. Once per session. */}
          <IntroSplash />
        </ThemeProvider>
      </body>
    </html>
  );
}
