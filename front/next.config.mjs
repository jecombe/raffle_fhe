import path from 'path';
const nextConfig = {
    reactStrictMode: true,
    webpack: config => {
      config.externals.push('pino-pretty', 'lokijs', 'encoding');
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'tfhe_bg.wasm': path.resolve('node_modules/tfhe/tfhe_bg.wasm'),
      };
      return config;
    },
};

export default nextConfig;
