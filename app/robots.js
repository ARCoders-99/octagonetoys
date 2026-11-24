// app/robots.js
// Public storefront pages are crawlable; private, transactional and API
// routes are excluded so search engines do not index them.

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/account",
          "/order",
          "/cart",
          "/checkout",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
