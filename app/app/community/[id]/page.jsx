import { supabase } from '../../../src/lib/supabaseClient';
import CommunityClient from './client-page';

// Next.js 15 requires params to be awaited
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('id', id)
    .single();
    
  if (!community) {
    return {
      title: 'Community Not Found | More Community',
    };
  }
  
  // Construct dynamic OG image URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.morecommunity.app';
  const ogUrl = new URL(`${baseUrl}/api/og`);
  ogUrl.searchParams.set('title', community.name);
  ogUrl.searchParams.set('community', 'More Community');
  ogUrl.searchParams.set('type', 'community');
  if (community.location || community.location_name) ogUrl.searchParams.set('location', community.location || community.location_name);
  if (community.members) ogUrl.searchParams.set('members', `${community.members} members`);
  const image = community.image || community.cover_image;
  if (image) {
    ogUrl.searchParams.set('image', image.startsWith('http') ? image : `${baseUrl}${image}`);
  }

  const desc = community.description || `Join ${community.name} on More Community. Discover upcoming meetups, connect with local members, and experience the joy of real-life connection.`;

  return {
    title: `${community.name} | More Community`,
    description: desc,
    openGraph: {
      title: `${community.name} | More Community`,
      description: desc,
      siteName: 'More Community',
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: community.name,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${community.name} | More Community`,
      description: desc,
      images: [ogUrl.toString()],
    }
  };
}

export default async function CommunityServerPage({ params }) {
  // In Next.js 15, params is a Promise
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  return <CommunityClient id={id} />;
}
