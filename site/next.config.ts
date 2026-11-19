import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { nextMdxOptions } from "./mdx.config";

const images = { unoptimized: true };
const pageExtensions = ["js", "jsx", "ts", "tsx", "md", "mdx"];
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/xldx",
  trailingSlash: true,
  images,
  pageExtensions,
};

const withMDX = createMDX({ options: nextMdxOptions });

export default withMDX(nextConfig);
