import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["gitclaw"],
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/demo/01-login.html", permanent: true },
      { source: "/home", destination: "/demo/01-login.html", permanent: true },
      { source: "/login", destination: "/demo/01-login.html", permanent: true },
      { source: "/demo", destination: "/demo/01-login.html", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;
