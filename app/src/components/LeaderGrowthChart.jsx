"use client";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip as RechartsTooltip } from 'recharts';

export default function LeaderGrowthChart({ weeks = [] }) {
  return (
    <div style={{ height: '140px', width: '100%', marginLeft: '-10px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={weeks} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--brand-accent)" stopOpacity={0.38} />
              <stop offset="95%" stopColor="var(--brand-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: 'var(--ink-muted)' }}
            dy={10}
          />
          <RechartsTooltip
            contentStyle={{
              background: 'var(--surface-card)',
              border: '1px solid var(--hairline-border-strong)',
              borderRadius: '10px',
              color: 'var(--ink-primary)',
              fontSize: '0.84rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
            }}
            itemStyle={{ color: 'var(--brand-accent)', fontWeight: 700 }}
            cursor={{ stroke: 'var(--hairline-border-strong)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--brand-accent)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorCount)"
            activeDot={{ r: 6, fill: 'var(--brand-accent)', stroke: '#FFFFFF', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
