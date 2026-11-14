import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const isProduction = process.env.NODE_ENV === "production";
const basePath = isProduction ? "/xldx" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: {
    unoptimized: true,
  },
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  turbopack: {},
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
