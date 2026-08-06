import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    /**
     * Pinned explicitly because there is a stray package-lock.json in the home
     * directory above this project. Turbopack infers the root from the nearest
     * lockfile, so without this it walks up and picks the wrong one.
     */
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
