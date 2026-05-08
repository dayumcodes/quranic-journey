/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.quran.foundation" },
      { protocol: "https", hostname: "mcp.quran.ai" },
      { protocol: "https", hostname: "auth.quran.foundation" }
    ]
  }
};

module.exports = nextConfig;
