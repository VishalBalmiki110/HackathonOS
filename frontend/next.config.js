/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.devpost.com',
            },
            {
                protocol: 'https',
                hostname: '**.mlh.io',
            },
            {
                protocol: 'https',
                hostname: '**.unstop.com',
            },
        ],
    },
}

module.exports = nextConfig
