// next.config.ts
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    // 🔒 Autorise explicitement les hôtes/chemins d'où viennent tes images
    remotePatterns: [
      // Dev local (port 4000)
      { protocol: "http", hostname: "localhost",     port: "4000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1",     port: "4000", pathname: "/uploads/**" },
      // Dev local alternatif (port 1000 si tu l’utilises parfois)
      { protocol: "http", hostname: "localhost",     port: "1000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1",     port: "1000", pathname: "/uploads/**" },

      // Prod (Render) — élargis à tout chemin pour éviter les 400 si le path change
      { protocol: "https", hostname: "mtr-backend-fbq8.onrender.com", pathname: "/**" },
    ],

    // 🧯 Bouton “secours” : mets NEXT_PUBLIC_UNOPTIMIZED_IMAGES=1 pour bypasser l’optimizer
    unoptimized: process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES === "1",
  },
};

export default withNextIntl(nextConfig);
