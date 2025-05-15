import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Configuración para exportación estática
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['firebasestorage.googleapis.com', 'lh3.googleusercontent.com'],
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
