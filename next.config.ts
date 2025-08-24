// next.config.ts
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

// Laisse le plugin sans argument : il cherchera par défaut ./i18n/request.ts
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Dev local
      {
        protocol: "http",
        hostname: "localhost",
        port: "1000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "1000",
        pathname: "/uploads/**",
      },
      // Prod (Render)
      {
        protocol: "https",
        hostname: "mtr-backend-fbq8.onrender.com",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
