/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow production builds to complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail builds on TypeScript errors (already checked by linter)
    ignoreBuildErrors: false,
  },
  outputFileTracingRoot: __dirname,
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'accelerometer=*, encrypted-media=*, geolocation=*, microphone=*, camera=*',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
