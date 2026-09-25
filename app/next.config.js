/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index.html',
      },
      {
        source: '/about',
        destination: '/about.html',
      },
      {
        source: '/leaders',
        destination: '/leaders.html',
      },
      {
        source: '/tunbridge-wells',
        destination: '/tunbridge-wells.html',
      },
      {
        source: '/accelerator',
        destination: '/accelerator.html',
      },
      {
        source: '/hackathons',
        destination: '/hackathons.html',
      },
      {
        source: '/sponsorship',
        destination: '/sponsorship.html',
      },
      {
        source: '/yentw',
        destination: '/yentw.html',
      },
      {
        source: '/business-plan',
        destination: '/business-plan.html',
      },
      {
        source: '/commercials',
        destination: '/commercials.html',
      },
      {
        source: '/investor-deck',
        destination: '/investor-deck.html',
      },
      {
        source: '/a-z-challenge',
        destination: '/a-z-challenge.html',
      },
      {
        source: '/kent-adventures',
        destination: '/kent-adventures.html',
      },
      {
        source: '/mindful-miles',
        destination: '/mindful-miles.html',
      },
      {
        source: '/tw-creative-collective',
        destination: '/tw-creative-collective.html',
      },
      {
        source: '/tw-good-neighbours',
        destination: '/tw-good-neighbours.html',
      },
      {
        source: '/tw-interfaith-network',
        destination: '/tw-interfaith-network.html',
      },
      {
        source: '/tw-parkrun',
        destination: '/tw-parkrun.html',
      },
      {
        source: '/tw-ramblers',
        destination: '/tw-ramblers.html',
      },
      {
        source: '/tw-yoga-collective',
        destination: '/tw-yoga-collective.html',
      },
    ];
  },
};

export default nextConfig;


