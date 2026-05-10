/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.quran.foundation" },
      { protocol: "https", hostname: "apis.quran.foundation" },
      { protocol: "https", hostname: "mcp.quran.ai" },
      { protocol: "https", hostname: "auth.quran.foundation" }
    ]
  },
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/favicon.svg" }];
  }
};

module.exports = nextConfig;
