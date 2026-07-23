/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "fuzzy-yodel-jjr5gx5496g35qxp-3000.app.github.dev",
        "*.app.github.dev",
      ],
    },
  },
};

module.exports = nextConfig;