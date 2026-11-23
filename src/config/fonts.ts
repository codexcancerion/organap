import {
  Bowlby_One_SC as FontBowlby,
  Inter,
  JetBrains_Mono,
} from "next/font/google";

export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const fontBowlby = FontBowlby({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bowlby-sc",
  display: "swap",
});
