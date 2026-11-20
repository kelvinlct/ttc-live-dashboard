import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next dev` blocks dev resources when the browser host is not the one it
  // bound. Allow both so 127.0.0.1 and localhost can hydrate.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
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
