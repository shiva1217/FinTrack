import type { NextConfig } from "next";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

const nextConfig: NextConfig = {
  async rewrites() {
    const apiProxyTarget = process.env.API_PROXY_TARGET?.trim();

    if (!apiProxyTarget) {
      return [];
    }

    const normalizedTarget = trimTrailingSlash(apiProxyTarget);

    return [
      {
        source: "/api/:path*",
        destination: `${normalizedTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
