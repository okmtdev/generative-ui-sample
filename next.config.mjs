/** @type {import('next').NextConfig} */
const nextConfig = {
  // MCP 公式 SDK は Node ランタイムを前提にしているため、
  // API ルートを Node ランタイムで動かす（Edge では動かさない）。
  serverExternalPackages: ["@modelcontextprotocol/sdk"],
};

export default nextConfig;
