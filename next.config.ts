// next.config.ts
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

// 👉 si ton fichier est à src/i18n/request.ts, tu peux passer le chemin.
//    (Sinon, sans argument, next-intl cherche ./i18n/request.ts par défaut)
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Config Next
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Dév local
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "4000",
        pathname: "/uploads/**",
      },
      // 👉 Production (Render)
      {
        protocol: "https",
        hostname: "mtr-backend-fbq8.onrender.com",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
