import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  typedRoutes: true,
  // Serve Firebase's sign-in helper pages from the app's own domain (see
  // lib/auth/firebase-client.ts::authDomainFor). Keeping the Google sign-in
  // round trip on one site is what makes it work on phones, whose browsers
  // block the cross-site storage it otherwise depends on.
  async rewrites() {
    const authHost = `https://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`;
    return [{ source: "/__/auth/:path*", destination: `${authHost}/__/auth/:path*` }];
  },
};

export default nextConfig;
