/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@eger/shared'],
  experimental: {
    // Leaflet touches window/global at import time. Make sure Next.js does NOT
    // try to pre-bundle it server-side.  We also import react-leaflet
    // dynamically (see components/map/MapView.tsx).
    serverComponentsExternalPackages: ['leaflet'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.tile.openstreetmap.org' },
      { protocol: 'https', hostname: 'tile.openstreetmap.org' },
    ],
  },
};

export default nextConfig;
