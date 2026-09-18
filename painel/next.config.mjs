/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build enxuto para o contêiner Docker (copia só o necessário para rodar).
  output: 'standalone',
  reactStrictMode: true,
  // O painel roda na raiz de crm.nordenimoveis.com.br, sem basePath.
  poweredByHeader: false,
  // Esconde o selo de desenvolvimento do Next (o "N" no canto).
  devIndicators: false,
};

export default nextConfig;
