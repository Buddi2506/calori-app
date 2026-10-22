import React, { useState, useEffect } from 'react';
import { getMonthlyReport } from '../../api/reports';
import CalendarHeatmap from './CalendarHeatmap';
import { Spinner, EmptyState } from './shared';

// ─── Helpers ────────────────────────────────────────────────────────────────
const pct = (val, goal) => (goal > 0 ? Math.min(100, Math.round((val / goal) * 100)) : 0);

// ─── Monthly Report Tab ──────────────────────────────────────────────────────
const MonthlyReport = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getMonthlyReport(year, month)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, month]);

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6">
      {/* Month picker */}
      <div className="zentra-card p-5 md:p-6 flex items-center gap-4 flex-wrap">
        <label className="text-sm font-bold text-gray-800">Select Month:</label>
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          {MONTH_NAMES.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          {[now.getFullYear(), now.getFullYear() - 1].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? <Spinner /> : report ? (
        <>
          {/* Summary sentences from API */}
          {report.summary_sentences?.length > 0 && (
            <div className="zentra-card p-6 bg-emerald-50/70 border border-emerald-200/70">
              <h3 className="font-extrabold text-emerald-900 mb-3 text-base">📝 Monthly Summary</h3>
              <ul className="space-y-2">
                {report.summary_sentences.map((s, i) => (
                  <li key={i} className="text-sm text-emerald-800 flex gap-2 font-medium">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Average Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Avg. Daily Calories', val: Math.round(report.averages?.calories || 0), unit: 'kcal', color: 'text-gray-900' },
              { label: 'Avg. Protein', val: (report.averages?.protein || 0).toFixed(1), unit: 'g', color: 'text-emerald-600' },
              { label: 'Avg. Fiber', val: (report.averages?.fiber || 0).toFixed(1), unit: 'g', color: 'text-emerald-700' },
              { label: 'Avg. Fat', val: (report.averages?.fat || 0).toFixed(1), unit: 'g', color: 'text-pink-600' },
            ].map(c => (
              <div key={c.label} className="zentra-card p-5 text-center">
                <p className={`text-3xl font-black ${c.color}`}>{c.val}</p>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{c.label} ({c.unit})</p>
              </div>
            ))}
          </div>

          {/* Calendar Heatmap */}
          {report.calendar_data && (
            <div className="zentra-card p-6 md:p-8">
              <h3 className="font-extrabold text-gray-900 mb-5 text-base">
                Calorie Goal Achievement — {MONTH_NAMES[month - 1]} {year}
              </h3>
              <CalendarHeatmap calendarData={report.calendar_data} calorieGoal={report.averages?.goal_calories || 2000} />
            </div>
          )}

          {/* Days goal met per nutrient with Candy-Stripes */}
          {report.days_goal_met && (
            <div className="zentra-card p-6 md:p-8">
              <h3 className="font-extrabold text-gray-900 mb-5 text-base">
                Days Goal Was Met (out of {report.total_logged_days || 30})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(report.days_goal_met).map(([nutrient, days]) => {
                  const total = report.total_logged_days || 30;
                  const pctVal = pct(days, total);
                  const stripeClass = pctVal >= 70 ? 'stripe-green' : pctVal >= 40 ? 'stripe-amber' : 'stripe-pink';

                  return (
                    <div key={nutrient} className="bg-gray-50/80 border border-gray-200/70 rounded-2xl p-4 text-center">
                      <p className="text-3xl font-black text-gray-900">
                        {days}<span className="text-base text-gray-400 font-normal">/{total}</span>
                      </p>
                      <p className="text-xs font-bold text-gray-600 capitalize mt-1 mb-2.5">{nutrient.replace(/_/g, ' ')}</p>
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
      ) : <EmptyState message="No data found for this month. Start logging to see your monthly report!" />}
    </div>
  );
};

export default MonthlyReport;
