/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Prevent static optimization for dynamic routes that need Supabase
  serverExternalPackages: ['@supabase/ssr'],
}

export default nextConfig
