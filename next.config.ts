import type { NextConfig } from 'next';

// GitHub Pages build: `PAGES=1 NEXT_PUBLIC_BASE_PATH=/bym-sonsuz-perspektif next build`
// produces a static site in ./out. Normal `next build` / `next dev` are unchanged.
const pages = process.env.PAGES === '1';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(pages ? { output: 'export', trailingSlash: true, basePath, images: { unoptimized: true } } : {}),
};
export default nextConfig;
