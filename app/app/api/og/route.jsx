import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Dynamic values from URL params
    const title = searchParams.get('title') || 'Find Your People, Connect in Real Life';
    const date = searchParams.get('date');
    const location = searchParams.get('location') || 'Tunbridge Wells';
    const members = searchParams.get('members');
    const community = searchParams.get('community') || 'More Community';
    const type = searchParams.get('type') || (date ? 'event' : 'community');
    const image = searchParams.get('image');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundImage: image ? `url(${image})` : 'linear-gradient(135deg, #090d16 0%, #0d2826 50%, #08141e 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            fontFamily: 'sans-serif',
            position: 'relative',
          }}
        >
          {/* Dark Overlay for contrast and sleek glass effect */}
          <div
            style={{
              position: 'absolute',
              top: 0, right: 0, bottom: 0, left: 0,
              backgroundImage: 'linear-gradient(to top, rgba(9, 13, 22, 0.96) 0%, rgba(9, 13, 22, 0.75) 50%, rgba(9, 13, 22, 0.45) 100%)',
            }}
          />

          {/* Top Header Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '48px 60px 0 60px',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  color: 'white',
                  fontSize: 36,
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span>More Community</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(20, 184, 166, 0.15)',
                  border: '1px solid rgba(20, 184, 166, 0.35)',
                  borderRadius: 999,
                  padding: '6px 16px',
                  color: '#2dd4bf',
                  fontSize: 16,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                <span>●</span>
                <span>{type === 'event' ? 'Upcoming Event' : 'Local Community'}</span>
              </div>
            </div>

            <div
              style={{
                color: '#94a3b8',
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              Tunbridge Wells
            </div>
          </div>

          {/* Center / Bottom Content Block */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '0 60px 52px 60px',
              zIndex: 10,
            }}
          >
            {type === 'event' && community && (
              <div
                style={{
                  color: '#2dd4bf',
                  fontSize: 24,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 12,
                }}
              >
                {community}
              </div>
            )}

            <div
              style={{
                color: 'white',
                fontSize: title.length > 35 ? 56 : 68,
                fontWeight: 800,
                lineHeight: 1.12,
                marginBottom: 24,
                maxWidth: '1050px',
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </div>

            {/* Badges Bar (Date, Location, Members) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {date && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 12,
                    padding: '8px 18px',
                    color: '#f8fafc',
                    fontSize: 22,
                    fontWeight: 600,
                  }}
                >
                  <span>📅</span>
                  <span>{date}</span>
                </div>
              )}

              {location && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 12,
                    padding: '8px 18px',
                    color: '#f8fafc',
                    fontSize: 22,
                    fontWeight: 600,
                  }}
                >
                  <span>📍</span>
                  <span>{location}</span>
                </div>
              )}

              {members && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 12,
                    padding: '8px 18px',
                    color: '#f8fafc',
                    fontSize: 22,
                    fontWeight: 600,
                  }}
                >
                  <span>👥</span>
                  <span>{members}</span>
                </div>
              )}

              <div
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                  borderRadius: 12,
                  padding: '10px 22px',
                  color: 'white',
                  fontSize: 20,
                  fontWeight: 700,
                  boxShadow: '0 8px 24px rgba(20, 184, 166, 0.35)',
                }}
              >
                <span>Join on More Community →</span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error('OG generation error:', e.message);
    return new Response('Failed to generate OG image', { status: 500 });
  }
}
