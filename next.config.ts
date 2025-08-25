import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "mtr-backend-fbq8.onrender.com", pathname: "/**" }
    ],
    // 🔧 bouton ON/OFF : mets NEXT_PUBLIC_UNOPTIMIZED_IMAGES=1 sur Render (service frontend)
    unoptimized: process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES === "1",
  },
};

export default withNextIntl(nextConfig);
