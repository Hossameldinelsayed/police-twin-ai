/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  // Produces a minimal self-contained server bundle for containers (Cloud Run, Docker).
  output: 'standalone',
};

export default nextConfig;
