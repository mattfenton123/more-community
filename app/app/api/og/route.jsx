import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Dynamic values from URL params
    const title = searchParams.get('title') || 'Discover more communities & events';
    const date = searchParams.get('date');
    const community = searchParams.get('community') || 'more.';
    
    // Background style (can be an image URL if provided, otherwise a gradient)
    const image = searchParams.get('image');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            // Default dark teal gradient
            backgroundImage: image ? `url(${image})` : 'linear-gradient(to bottom right, #0f172a, #134e4a)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Dark Overlay for readability */}
          <div
            style={{
              position: 'absolute',
              top: 0, right: 0, bottom: 0, left: 0,
              backgroundImage: 'linear-gradient(to top, rgba(15, 23, 42, 1), rgba(15, 23, 42, 0.2))',
            }}
          />

          {/* Content Block */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '60px', zIndex: 10 }}>
            <div style={{ color: '#2dd4bf', fontSize: 32, fontWeight: 700, textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.05em' }}>
              {community}
            </div>
            
            <div style={{ color: 'white', fontSize: 72, fontWeight: 800, lineHeight: 1.1, marginBottom: 24, maxWidth: '1000px', letterSpacing: '-0.02em' }}>
              {title}
            </div>
            
            {date && (
              <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: 36, fontWeight: 600 }}>
                {date}
              </div>
            )}
          </div>

          {/* Watermark Logo */}
          <div style={{ position: 'absolute', top: 40, right: 60, color: 'white', fontSize: 48, fontWeight: 800, letterSpacing: '-0.05em', zIndex: 10 }}>
            more.
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error(e.message);
    return new Response('Failed to generate OG image', { status: 500 });
  }
}
