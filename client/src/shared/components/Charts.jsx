/**
 * Charts.jsx - Recharts wrappers (BarsChart, LinesChart, LineOnly, Donut) used by the dashboards.
 * FRONTEND: shared component.
 * TALKS TO (backend): none. Dashboards pass in arrays from GET /api/employer/dashboard and /api/admin/dashboard.
 * HOW IT WORKS: each wrapper takes `data` (array of objects) plus which keys to plot. Colours come from CSS variables so dark mode works.
 */
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';

const C = { primary: '#5F5AF6', gold: '#F5B014', teal: '#2EC4B6', orange: '#F28C38', blue: '#4A90E2', grey: '#9aa0b8' };
const axis = { stroke: 'var(--muted)', fontSize: 12, tickLine: false, axisLine: false };
const tip = { contentStyle: { background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, color: 'var(--ink)' } };

export const BarsChart = ({ data, x, y, color = C.primary, label }) => (
  <ResponsiveContainer width="100%" height={240}>
    <BarChart data={data} margin={{ left: -18, right: 8 }}>
      <CartesianGrid stroke="var(--line)" vertical={false} />
      <XAxis dataKey={x} {...axis} tickFormatter={(v) => (String(v).length > 12 ? `${String(v).slice(0, 11)}…` : v)} />
      <YAxis allowDecimals={false} {...axis} />
      <Tooltip {...tip} cursor={{ fill: 'var(--soft)' }} />
      <Bar dataKey={y} name={label || y} fill={color} radius={[6, 6, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);
export const LinesChart = ({ data, x, series }) => (
  <ResponsiveContainer width="100%" height={240}>
    <AreaChart data={data} margin={{ left: -18, right: 8 }}>
      <CartesianGrid stroke="var(--line)" vertical={false} />
      <XAxis dataKey={x} {...axis} tickFormatter={(v) => String(v).slice(5)} interval="preserveStartEnd" />
      <YAxis allowDecimals={false} {...axis} />
      <Tooltip {...tip} />
      <Legend />
      {series.map((s) => <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} fill={s.color} fillOpacity={0.15} strokeWidth={2} />)}
    </AreaChart>
  </ResponsiveContainer>
);
export const LineOnly = ({ data, x, y, color = C.primary, label }) => (
  <ResponsiveContainer width="100%" height={240}>
    <LineChart data={data} margin={{ left: -18, right: 8 }}>
      <CartesianGrid stroke="var(--line)" vertical={false} />
      <XAxis dataKey={x} {...axis} tickFormatter={(v) => String(v).slice(5)} interval="preserveStartEnd" />
      <YAxis allowDecimals={false} {...axis} />
      <Tooltip {...tip} />
      <Line type="monotone" dataKey={y} name={label || y} stroke={color} strokeWidth={3} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);
const PIE = [C.grey, C.primary, C.gold, C.teal];
export const Donut = ({ data, name = 'status', value = 'count' }) => (
  <ResponsiveContainer width="100%" height={240}>
    <PieChart>
      <Pie data={data} dataKey={value} nameKey={name} innerRadius={56} outerRadius={88} paddingAngle={3}>
        {data.map((d, i) => <Cell key={d[name]} fill={PIE[i % PIE.length]} />)}
      </Pie>
      <Tooltip {...tip} /><Legend />
    </PieChart>
  </ResponsiveContainer>
);
