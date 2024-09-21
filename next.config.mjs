/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const isProd = () => process.env.NODE_ENV === 'production';

const nextConfig = {};

export default isProd() ? withPWA({
    dest: 'public',
}) : nextConfig;
