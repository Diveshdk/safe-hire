/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      readline: false,
    }
    return config
  },
  experimental: {
    serverComponentsExternalPackages: ["puppeteer-core"],
  },
}

export default nextConfig
