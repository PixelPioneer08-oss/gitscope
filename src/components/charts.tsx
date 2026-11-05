import { Bar, BarChart, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { GHRepo } from '@/lib/github'
import { compact, num } from '@/lib/format'
import { langColor } from '@/lib/languages'

const OTHER = 'hsl(var(--muted-foreground) / 0.45)'

function TipBox({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">{children}</div>
}

export function LanguageDonut({ langs }: { langs: [string, number][] }) {
  const total = langs.reduce((s, [, n]) => s + n, 0)
  const items = langs.slice(0, 6).map(([name, value]) => ({ name, value, color: langColor(name) }))
  const rest = langs.slice(6).reduce((s, [, n]) => s + n, 0)
  if (rest) items.push({ name: 'Other', value: rest, color: OTHER })

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative h-[150px] w-[150px] shrink-0">
        <PieChart width={150} height={150}>
          <Pie
            data={items}
            dataKey="value"
            nameKey="name"
            innerRadius={48}
            outerRadius={70}
            paddingAngle={items.length > 1 ? 2 : 0}
            stroke="none"
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
          >
            {items.map((i) => (
              <Cell key={i.name} fill={i.color} />
            ))}
          </Pie>
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            content={({ active, payload }: any) =>
              active && payload?.length ? (
                <TipBox>
                  <b>{payload[0].name}</b> · {payload[0].value} repos
                </TipBox>
              ) : null
            }
          />
        </PieChart>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="text-2xl font-semibold tabular-nums leading-none">{langs.length}</span>
          <span className="text-xs text-muted-foreground">languages</span>
        </div>
      </div>
      <ul className="grid min-w-[160px] flex-1 gap-1.5">
        {items.map((i) => (
          <li key={i.name} className="grid grid-cols-[10px_1fr_auto] items-center gap-2 text-[13px]">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: i.color }} />
            <span className="truncate">{i.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{Math.round((i.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function StarsChart({ repos, onOpen }: { repos: GHRepo[]; onOpen: (r: GHRepo) => void }) {
  const top = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 8)
  const data = top.map((r) => ({ id: r.id, name: r.name, stars: r.stargazers_count }))
  const open = (id: number) => {
    const r = top.find((x) => x.id === id)
    if (r) onOpen(r)
  }
  return (
    <div style={{ height: data.length * 32 + 8 }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis
            type="category"
            dataKey="name"
            width={118}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12.5 }}
            tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            content={({ active, payload }: any) =>
              active && payload?.length ? (
                <TipBox>
                  <b>{payload[0].payload.name}</b> · {num(payload[0].payload.stars)} stars
                </TipBox>
              ) : null
            }
          />
          <Bar
            dataKey="stars"
            fill="hsl(var(--chart-1))"
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
            className="cursor-pointer"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={(d: any) => open(d?.payload?.id ?? d?.id)}
          >
            <LabelList
              dataKey="stars"
              position="right"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => compact(Number(v))}
              style={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'Geist Mono, monospace' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
