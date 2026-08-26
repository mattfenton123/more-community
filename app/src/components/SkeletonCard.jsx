/**
 * Reusable skeleton loading components for all views.
 */

export function SkeletonLine({ width = '100%', height = '14px', style = {} }) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius: '6px',
        ...style,
      }}
    />
  );
}

export function SkeletonAvatar({ size = 50, round = false, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{
        width: size,
        height: size,
        borderRadius: round ? '50%' : 'var(--radius-md)',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ style = {} }) {
  return (
    <div className="skeleton-card" style={style}>
      <SkeletonAvatar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SkeletonLine width="70%" height="16px" />
        <SkeletonLine width="50%" height="12px" />
        <SkeletonLine width="40%" height="10px" />
      </div>
      <div className="skeleton" style={{ width: '60px', height: '32px', borderRadius: '999px' }} />
    </div>
  );
}

export function SkeletonCommunityCard({ style = {} }) {
  return (
    <div
      style={{
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        ...style,
      }}
    >
      <div className="skeleton" style={{ height: '120px', borderRadius: 0 }} />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <SkeletonLine width="65%" height="18px" />
        <SkeletonLine width="90%" height="12px" />
        <SkeletonLine width="40%" height="12px" />
      </div>
    </div>
  );
}

export function SkeletonChatBubble({ align = 'left' }) {
  const isRight = align === 'right';
  return (
    <div style={{ alignSelf: isRight ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
      {!isRight && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', marginLeft: '4px' }}>
          <SkeletonAvatar size={20} round />
          <SkeletonLine width="60px" height="12px" />
        </div>
      )}
      <div
        className="skeleton"
        style={{
          padding: '16px 20px',
          borderRadius: isRight ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          minHeight: '44px',
          width: `140px`,
        }}
      />
    </div>
  );
}

export function SkeletonEvent() {
  return (
    <div className="skeleton-event">
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ textAlign: 'center', minWidth: '45px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <SkeletonLine width="30px" height="10px" />
          <SkeletonLine width="24px" height="22px" />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SkeletonLine width="75%" height="16px" />
          <SkeletonLine width="45%" height="12px" />
          <SkeletonLine width="55%" height="12px" />
        </div>
      </div>
    </div>
  );
}

/**
 * Renders N skeleton items with staggered animation.
 */
export function SkeletonList({ count = 4, Component = SkeletonCard }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 80}ms` }} className="stagger-item">
          <Component />
        </div>
      ))}
    </>
  );
}
