import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import { ThemeProvider, THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme/ThemeProvider";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
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
      className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}
    >
      <head>
        {/* Applies the cached theme before first paint. Without this the
            default palette flashes for one frame while /api/auth/me loads. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-clay-bg text-clay-ink">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
