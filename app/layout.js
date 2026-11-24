import { Geist, Geist_Mono, Fredoka, Poppins, Nunito } from "next/font/google";
import "./globals.css";
import { STORE_NAME, STORE_TAGLINE } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  title: {
    default: `${STORE_NAME} — ${STORE_TAGLINE}`,
    template: `%s | ${STORE_NAME}`,
  },
  description:
    "Shop safe, fun and imaginative toys for every age. Fast delivery across Pakistan, easy returns and secure checkout.",
  keywords: ["toys", "kids toys", "Octagonetoys", "Pakistan toy store", "educational toys"],
  openGraph: {
    title: `${STORE_NAME} — ${STORE_TAGLINE}`,
    description: "Shop safe, fun and imaginative toys for every age.",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#f59e0b",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} ${poppins.variable} ${nunito.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full bg-[#fbfaf7] text-slate-900">
        {children}
      </body>
    </html>
  );
}
