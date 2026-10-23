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

interface ActivityChartProps {
  data: ActivityPoint[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  const hasData = data && data.length > 0 && data.some((d) => d.uploads > 0 || d.shares > 0 || d.verifications > 0);

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Workspace Document Telemetry</CardTitle>
        <CardDescription>
          Daily activity across uploads, permission grants, and SHA-256 integrity checks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full pt-2">
          {!hasData && (
            <div className="h-full flex flex-col items-center justify-center text-center text-xs text-text-muted p-4">
              <p className="font-medium text-text-secondary">No activity recorded in the past 7 days</p>
              <p className="text-[11px] mt-0.5">Upload a document or seed demo data to populate real chart data.</p>
            </div>
          )}
          {hasData && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3155D9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3155D9" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6687F5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6687F5" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorVerif" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#207B61" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#207B61" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#8992A3" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#8992A3" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 4px 16px -2px rgba(16, 24, 40, 0.08)',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
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
                  name="Permission Grants"
                  stroke="#6687F5"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorShares)"
                />
                <Area
                  type="monotone"
                  dataKey="verifications"
                  name="SHA-256 Verifications"
                  stroke="#207B61"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVerif)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
