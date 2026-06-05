/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude the open-notebook folder from Next.js compilation
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/open-notebook/**', '**/node_modules/**'],
    }
    return config
  },
}

export default nextConfig
