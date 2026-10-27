const isElectronBuild = process.env.ELECTRON_BUILD === '1';

/** @type {import('next').NextConfig} */
const nextConfig = isElectronBuild
  ? {
      // Desktop (Electron) build: fully static export, served by the bundled
      // NestJS backend from the same origin — so relative /api/* calls just work.
      output: 'export',
      trailingSlash: true,
      images: { unoptimized: true },
      // Separate build cache dir so this never collides with a concurrently running `next dev`.
      distDir: '.next-electron',
    }
  : {
      output: 'standalone',
      images: { unoptimized: true },
      async rewrites() {
        const apiUrl = process.env.API_URL || 'http://localhost:4000';
        return [
          { source: '/api/:path*', destination: `${apiUrl}/api/:path*` },
          { source: '/uploads/:path*', destination: `${apiUrl}/uploads/:path*` },
        ];
      },
    };

module.exports = nextConfig;
