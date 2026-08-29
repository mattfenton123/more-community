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
  
  return {
    title: `${community.name} | more.`,
    description: community.description,
    openGraph: {
      title: `${community.name} | more.`,
      description: community.description,
      images: [community.image || community.cover_image || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80'],
    }
  };
}

export default async function CommunityServerPage({ params }) {
  // In Next.js 15, params is a Promise
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  return <CommunityClient id={id} />;
}
