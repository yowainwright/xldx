import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/xldx",
  images: {
    unoptimized: true,
  },
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  turbopack: {},
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
