import type { NextConfig } from "next";

const config: NextConfig = {
  // Các package trong workspace xuất trực tiếp file .ts nên Next cần biên dịch chúng.
  transpilePackages: ["@pr-evidence/db", "@pr-evidence/evidence", "@pr-evidence/types"],
  serverExternalPackages: ["mongodb"],
};

export default config;
