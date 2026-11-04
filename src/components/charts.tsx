import { useId } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSettings } from '../store/SettingsContext';
import { formatCurrency, formatInt, formatPercent } from '../lib/format';
import type { ChannelRow, SegmentRow, SeriesPoint } from '../data/analytics';

function usePalette() {
  const { settings } = useSettings();
  const dark = settings.theme === 'dark';
  return {
    accent: dark ? '#38E1FF' : '#0891B2',
    accent2: dark ? '#3B82F6' : '#2563EB',
    grid: dark ? '#1B2A44' : '#D6DEEC',
    axis: dark ? '#8593A8' : '#5A6B82',
    tooltipBg: dark ? '#0B1220' : '#FFFFFF',
    tooltipFg: dark ? '#E7EEF8' : '#0B1424',
    tooltipBorder: dark ? '#213049' : '#D6DEEC',
    series: dark
      ? ['#38E1FF', '#3B82F6', '#818CF8', '#34D399', '#FBBF24', '#F472B6']
      : ['#0891B2', '#2563EB', '#6366F1', '#059669', '#D97706', '#DB2777'],
  };
}

const tooltipStyle = (p: ReturnType<typeof usePalette>) => ({
  background: p.tooltipBg,
  border: `1px solid ${p.tooltipBorder}`,
  borderRadius: 12,
  color: p.tooltipFg,
  fontSize: 13,
  boxShadow: '0 18px 40px -18px rgba(0,0,0,0.5)',
});

// ---------- Receita ao longo do tempo ----------

export function RevenueChart({ data, summary }: { data: SeriesPoint[]; summary: string }) {
  const p = usePalette();
  const { settings } = useSettings();
  const gradientId = `rev-${useId().replace(/:/g, '')}`;

  return (
    <div role="img" aria-label={summary} className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={p.accent} stopOpacity={0.42} />
              <stop offset="100%" stopColor={p.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={p.grid} strokeDasharray="3 6" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: p.axis, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis
            tick={{ fill: p.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={72}
            tickFormatter={(v: number) => formatCurrency(v, settings.compactNumbers)}
          />
          <Tooltip
            contentStyle={tooltipStyle(p)}
            labelStyle={{ color: p.axis }}
            formatter={(value: number, name: string) =>
              name === 'Receita' ? [formatCurrency(value), name] : [formatInt(value), name]
            }
            cursor={{ stroke: p.accent, strokeOpacity: 0.35 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Receita"
            stroke={p.accent}
            strokeWidth={2.2}
            fill={`url(#${gradientId})`}
            isAnimationActive={settings.animations}
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- Canais ----------

export function ChannelChart({ rows, summary }: { rows: ChannelRow[]; summary: string }) {
  const p = usePalette();
  const { settings } = useSettings();
  return (
    <div role="img" aria-label={summary} className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid stroke={p.grid} strokeDasharray="3 6" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: p.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatCurrency(v, true)}
          />
          <YAxis
            type="category"
            dataKey="channel"
            width={118}
            tick={{ fill: p.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle(p)}
            cursor={{ fill: p.accent, fillOpacity: 0.06 }}
            formatter={(value: number, _name, item) => [
              `${formatCurrency(value)} · ${formatPercent((item.payload as ChannelRow).share)}`,
              'Receita',
            ]}
          />
          <Bar dataKey="revenue" radius={[0, 8, 8, 0]} isAnimationActive={settings.animations} animationDuration={800}>
            {rows.map((row, i) => (
              <Cell key={row.channel} fill={p.series[i % p.series.length]} fillOpacity={0.9} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- Segmentos ----------

export function SegmentDonut({ rows, summary }: { rows: SegmentRow[]; summary: string }) {
  const p = usePalette();
  const { settings } = useSettings();
  const data = rows.filter((r) => r.count > 0);
  return (
    <div role="img" aria-label={summary} className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="segment"
            innerRadius="58%"
            outerRadius="88%"
            paddingAngle={3}
            stroke="none"
            isAnimationActive={settings.animations}
            animationDuration={800}
          >
            {data.map((row, i) => (
              <Cell key={row.segment} fill={p.series[i % p.series.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle(p)}
            formatter={(value: number, name: string) => [`${formatInt(value)} clientes`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
