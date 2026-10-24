import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ActivityPoint } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Activity, Calendar } from 'lucide-react';

interface ActivityChartProps {
  data: ActivityPoint[];
  days?: number;
  onDaysChange?: (days: number) => void;
}

export function ActivityChart({ data, days = 7, onDaysChange }: ActivityChartProps) {
  const hasData =
    data &&
    data.length > 0 &&
    data.some(
      (d) =>
        (d.uploads || 0) > 0 ||
        (d.shares || 0) > 0 ||
        (d.verifications || 0) > 0 ||
        (d.downloads || 0) > 0
    );

  const gridColor = '#E8EAF1';
  const axisColor = '#747C90';

  const timeOptions = [
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
  ];

  return (
    <Card className="col-span-full lg:col-span-2 border-border shadow-card bg-white">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-3">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span>Operational & Security Telemetry</span>
          </CardTitle>
          <CardDescription className="text-xs text-text-secondary mt-0.5">
            Audit-backed events grouped by date across document uploads, access grants, downloads, and SHA-256 integrity verifications.
          </CardDescription>
        </div>

        {/* Time Window Filter Pills */}
        {onDaysChange && (
          <div className="flex items-center gap-1 p-1 bg-surface-subtle border border-border rounded-medium self-start sm:self-auto">
            <Calendar className="w-3.5 h-3.5 text-text-muted ml-1 mr-0.5" />
            {timeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onDaysChange(opt.value)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-small transition-all ${
                  days === opt.value
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="h-72 w-full pt-2">
          {!hasData ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-xs text-text-muted p-6 space-y-2 border border-dashed border-border rounded-medium bg-surface-subtle/50">
              <div className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-primary shadow-subtle">
                <Activity className="w-5 h-5 stroke-[1.8]" />
              </div>
              <p className="font-bold text-text-primary text-sm">
                No activity recorded in this timeframe
              </p>
              <p className="text-xs text-text-muted max-w-sm">
                Upload documents, grant access to team members, or run cryptographic integrity verifications to record real events.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* Uploads - Cobalt (#3155D9) */}
                  <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3155D9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3155D9" stopOpacity={0.0} />
                  </linearGradient>

                  {/* Grants - Teal (#0F9D91) */}
                  <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F9D91" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0F9D91" stopOpacity={0.0} />
                  </linearGradient>

                  {/* Verifications - Emerald (#16865B) */}
                  <linearGradient id="colorVerif" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16865B" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#16865B" stopOpacity={0.0} />
                  </linearGradient>

                  {/* Downloads - Lavender (#8B72D9) */}
                  <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B72D9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8B72D9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="date"
                  stroke={axisColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke={axisColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-medium border border-border shadow-xl text-xs space-y-1.5 min-w-[170px]">
                          <p className="font-bold text-text-primary border-b border-border pb-1">
                            {label}
                          </p>
                          {payload.map((entry, index) => (
                            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-1.5 text-text-secondary">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span>{entry.name}:</span>
                              </span>
                              <span className="font-bold text-text-primary">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />

                <Area
                  type="monotone"
                  dataKey="uploads"
                  name="Uploads"
                  stroke="#3155D9"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUploads)"
                />
                <Area
                  type="monotone"
                  dataKey="shares"
                  name="Access Grants"
                  stroke="#0F9D91"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorShares)"
                />
                <Area
                  type="monotone"
                  dataKey="verifications"
                  name="Verifications"
                  stroke="#16865B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVerif)"
                />
                <Area
                  type="monotone"
                  dataKey="downloads"
                  name="Downloads"
                  stroke="#8B72D9"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDownloads)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
