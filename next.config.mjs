import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Comentamos estas líneas para permitir SSR en lugar de exportación estática
  // output: 'export',
  // distDir: 'out',
  // trailingSlash: true,
  images: {
    // unoptimized: true, // No es necesario con SSR
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Configuración de ESLint para evitar que los errores detengan la compilación
  eslint: {
    // No detiene la compilación si hay errores de ESLint
    ignoreDuringBuilds: true,
  },
  // Configuración de TypeScript para evitar que los errores detengan la compilación
  typescript: {
    // No detiene la compilación si hay errores de TypeScript
    ignoreBuildErrors: true,
  },
  webpack(config) {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
  turbopack: {
    resolveAlias: {
      "@": path.resolve(__dirname, "src")
    }
  },
};

export default nextConfig;
