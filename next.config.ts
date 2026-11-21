import type { NextConfig } from 'next';

// GitHub Pages build: `PAGES=1 NEXT_PUBLIC_BASE_PATH=/bym-sonsuz-perspektif next build`
// produces a static site in ./out. Normal `next dev` / `next build` are unchanged.
const pages = process.env.PAGES === '1';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Optional separate output dir so a verification build does not clobber a running `next dev`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Dev server is also opened from the LAN address; without this Next blocks HMR from it.
  allowedDevOrigins: ['192.168.1.52'],
  ...(pages ? { output: 'export', trailingSlash: true, basePath, images: { unoptimized: true } } : {}),
};
export default nextConfig;
