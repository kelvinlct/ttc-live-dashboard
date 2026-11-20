import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Live arrivals are request-time data. Cache Components would try to
  // prerender them into a static shell, so the app stays on the default model:
  // static pages, fresh JSON from the API routes.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
