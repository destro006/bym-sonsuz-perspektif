/**
 * Public-folder URL that also works when the site is served from a sub-path
 * (GitHub Pages: /bym-sonsuz-perspektif). next/image and three.js loaders do not add basePath.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const asset = (path: string) => `${BASE_PATH}${path}`;
