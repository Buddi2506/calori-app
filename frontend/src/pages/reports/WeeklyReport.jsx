import React, { useState, useEffect } from 'react';
import { format, startOfWeek } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { formatApiDate } from '../../utils/formatters';
import { getWeeklyReport } from '../../api/reports';
import { Spinner, EmptyState } from './shared';

const MACRO_COLORS = { protein: '#10B981', carbohydrates: '#3B82F6', fat: '#EC4899', fiber: '#F59E0B' };

// ─── Weekly Report Tab ───────────────────────────────────────────────────────
const WeeklyReport = () => {
  const defaultStart = formatApiDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [startDate, setStartDate] = useState(defaultStart);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getWeeklyReport(startDate)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [startDate]);

  const chartData = report?.days?.map(d => ({
    day: format(new Date(d.date + 'T00:00:00'), 'EEE'),
    Calories: Math.round(d.totals?.calories || 0),
    Protein: Math.round(d.totals?.protein || 0),
    Carbs: Math.round(d.totals?.carbohydrates || 0),
    Fat: Math.round(d.totals?.fat || 0),
  })) || [];

  return (
    <div className="space-y-6">
      <div className="zentra-card p-5 md:p-6 flex items-center gap-4 flex-wrap">
        <label className="text-sm font-bold text-gray-800">Week Starting:</label>
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
      </div>

      {loading ? <Spinner /> : report ? (
        <>
          {/* Average Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Avg. Calories', val: Math.round(report.averages?.calories || 0), unit: 'kcal', color: 'text-gray-900' },
              { label: 'Avg. Protein', val: (report.averages?.protein || 0).toFixed(1), unit: 'g', color: 'text-emerald-600' },
              { label: 'Avg. Carbs', val: (report.averages?.carbohydrates || 0).toFixed(1), unit: 'g', color: 'text-blue-600' },
              { label: 'Avg. Fat', val: (report.averages?.fat || 0).toFixed(1), unit: 'g', color: 'text-pink-600' },
            ].map(c => (
              <div key={c.label} className="zentra-card p-5 text-center">
                <p className={`text-3xl font-black ${c.color}`}>{c.val}</p>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{c.label} ({c.unit})</p>
              </div>
            ))}
          </div>

          {/* Calorie Bar Chart */}
          <div className="zentra-card p-6 md:p-8">
            <h3 className="font-extrabold text-gray-900 mb-4 text-base">Daily Calorie Intake</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2C34" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#8E8E98' }} />
                <YAxis tick={{ fontSize: 12, fill: '#8E8E98' }} />
                <Tooltip contentStyle={{ background: "#1A1B21", border: "1px solid #2A2C34", borderRadius: 12, color: "#F4F4F5" }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="Calories" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Macro Trend Line Chart */}
          <div className="zentra-card p-6 md:p-8">
            <h3 className="font-extrabold text-gray-900 mb-4 text-base">Macro Trend (g/day)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2C34" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#8E8E98' }} />
                <YAxis tick={{ fontSize: 12, fill: '#8E8E98' }} />
                <Tooltip contentStyle={{ background: "#1A1B21", border: "1px solid #2A2C34", borderRadius: 12, color: "#F4F4F5" }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Legend />
                <Line type="monotone" dataKey="Protein" stroke={MACRO_COLORS.protein} strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Carbs" stroke={MACRO_COLORS.carbohydrates} strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Fat" stroke={MACRO_COLORS.fat} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Goal Achievement Days with Candy-Stripes */}
          {report.goal_achievement_days && (
            <div className="zentra-card p-6 md:p-8">
              <h3 className="font-extrabold text-gray-900 mb-5 text-base">Days Goal Was Met (out of 7)</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(report.goal_achievement_days).map(([nutrient, days]) => {
                  const pctVal = Math.round((days / 7) * 100);
                  const stripeClass = pctVal >= 70 ? 'stripe-green' : pctVal >= 40 ? 'stripe-amber' : 'stripe-pink';

                  return (
                    <div key={nutrient} className="bg-gray-50/80 border border-gray-200/70 rounded-2xl p-4 text-center">
                      <p className="text-3xl font-black text-gray-900">
                        {days}<span className="text-base text-gray-400 font-normal">/7</span>
                      </p>
                      <p className="text-xs font-bold text-gray-600 capitalize mt-1 mb-2.5">
                        {nutrient.replace(/_/g, ' ')}
                      </p>
                      <div className="w-full bg-gray-200/70 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${stripeClass}`}
                          style={{ width: `${pctVal}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : <EmptyState message="Log at least a few days to see your weekly report." />}
    </div>
  );
};

export default WeeklyReport;
