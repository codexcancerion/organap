/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["@heroui/react", "lucide-react"],
  },
};

export default nextConfig;
