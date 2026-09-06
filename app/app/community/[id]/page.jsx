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
      title: 'Community Not Found | more.',
    };
  }
  
  // Construct dynamic OG image URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://morecommunity.co.uk';
  const ogUrl = new URL(`${baseUrl}/api/og`);
  ogUrl.searchParams.set('title', community.name);
  ogUrl.searchParams.set('community', 'more community.');
  const image = community.image || community.cover_image;
  if (image) {
    ogUrl.searchParams.set('image', image.startsWith('http') ? image : `${baseUrl}${image}`);
  }

  return {
    title: `${community.name} | more.`,
    description: community.description,
    openGraph: {
      title: `${community.name} | more.`,
      description: community.description,
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
      title: community.name,
      description: community.description,
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
