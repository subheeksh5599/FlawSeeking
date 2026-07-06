/**
 * ============================================================================
 * SITE CONFIGURATION
 * ============================================================================
 *
 * Customize your landing page by editing the values below.
 * All text, links, and settings are centralized here for easy editing.
 */

export const siteConfig = {
  name: "FlawSeeking",
  tagline: "Programmable Security Layer for AI Agents on Casper",
  description:
    "The shared security middleware for autonomous AI agents on Casper Network. Every transaction checked, every violation logged on-chain, every verdict verified by independent AI validators.",
  url: "https://flawseeking.vercel.app",
  twitter: "@flawseeking",

  nav: {
    cta: {
      text: "Integrate Agent",
      href: "#",
    },
    signIn: {
      text: "Dashboard",
      href: "#",
    },
  },
} as const;

/**
 * ============================================================================
 * FEATURE FLAGS
 * ============================================================================
 *
 * Toggle features on/off without touching component code.
 */
export const features = {
  smoothScroll: true,
  darkMode: true,
} as const;

/**
 * ============================================================================
 * THEME CONFIGURATION
 * ============================================================================
 */
export const themeConfig = {
  defaultTheme: "dark" as "light" | "dark" | "system",
  enableSystemTheme: true,
} as const;
