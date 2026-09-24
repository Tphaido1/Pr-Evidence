import type { NextConfig } from "next";

const config: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@pr-evidence/db", "@pr-evidence/evidence", "@pr-evidence/types"],
  serverExternalPackages: ["mongodb", "aws4"],
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      aws4: false,
      snappy: false,
      kerberos: false,
      "@mongodb-js/zstd": false,
      "@aws-sdk/credential-providers": false,
      "gcp-metadata": false,
      socks: false,
    };
    if (isServer) {
      const externals = Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean);
      config.externals = [...externals, "aws4", "snappy", "kerberos", "@mongodb-js/zstd", "@aws-sdk/credential-providers", "gcp-metadata", "socks"];
    }
    return config;
  },
};

export default config;

