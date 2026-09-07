import React, { useState, useEffect } from 'react';
import { format, startOfWeek, subDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts';
import { formatApiDate } from '../utils/formatters';
import { getDailyReport, getWeeklyReport, getMonthlyReport } from '../api/reports';
import NutrientProgressBar from '../components/NutrientProgressBar';

const MACRO_COLORS = { protein: '#f97316', carbohydrates: '#eab308', fat: '#ef4444', fiber: '#22c55e' };

// ─── Helpers ────────────────────────────────────────────────────────────────
const pct = (val, goal) => (goal > 0 ? Math.min(100, Math.round((val / goal) * 100)) : 0);

// ─── Main Component ─────────────────────────────────────────────────────────
const Reports = () => {
  const [activeTab, setActiveTab] = useState('weekly');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">📊 Nutrition Reports</h2>
        <p className="text-gray-500 text-sm mt-1">Analyse your dietary trends — daily, weekly, and monthly.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {['daily', 'weekly', 'monthly'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 font-medium text-sm capitalize transition-colors ${
              activeTab === tab
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'daily' ? '📅 Daily' : tab === 'weekly' ? '📆 Weekly' : '🗓️ Monthly'}
          </button>
        ))}
      </div>

      {activeTab === 'daily'   && <DailyReport />}
      {activeTab === 'weekly'  && <WeeklyReport />}
      {activeTab === 'monthly' && <MonthlyReport />}
    </div>
  );
};

// ─── Daily Report Tab ────────────────────────────────────────────────────────
const DailyReport = () => {
  const [date, setDate] = useState(formatApiDate(new Date()));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getDailyReport(date)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div className="space-y-6">
      <div className="card flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Select date:</label>
        <input
          type="date"
          value={date}
          max={formatApiDate(new Date())}
          onChange={e => setDate(e.target.value)}
          className="input-field w-auto"
        />
      </div>

      {loading ? <Spinner /> : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Calories', val: Math.round(report.totals?.calories || 0), unit: 'kcal', color: 'primary' },
              { label: 'Protein', val: (report.totals?.protein || 0).toFixed(1), unit: 'g', color: 'orange-500' },
              { label: 'Carbs', val: (report.totals?.carbohydrates || 0).toFixed(1), unit: 'g', color: 'yellow-500' },
              { label: 'Fat', val: (report.totals?.fat || 0).toFixed(1), unit: 'g', color: 'red-500' },
            ].map(c => (
              <div key={c.label} className="card text-center">
                <p className={`text-2xl font-bold text-${c.color}`}>{c.val}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label} ({c.unit})</p>
              </div>
            ))}
          </div>

          {/* Goal progress */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">Goal Achievement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              {[
                { label: 'Calories', key: 'calories', unit: 'kcal' },
                { label: 'Protein', key: 'protein', unit: 'g' },
                { label: 'Carbohydrates', key: 'carbohydrates', unit: 'g' },
                { label: 'Fat', key: 'fat', unit: 'g' },
                { label: 'Fiber', key: 'fiber', unit: 'g' },
                { label: 'Iron', key: 'iron', unit: 'mg' },
                { label: 'Calcium', key: 'calcium', unit: 'mg' },
                { label: 'Vitamin C', key: 'vitamin_c', unit: 'mg' },
              ].map(n => (
                <NutrientProgressBar
                  key={n.key}
                  label={n.label}
                  current={report.totals?.[n.key] || 0}
                  goal={report.goals?.[n.key] || 1}
                  unit={n.unit}
                />
              ))}
            </div>
          </div>

          {/* Food log table */}
          {Object.entries(report.entries || {}).map(([mealType, items]) =>
            items?.length > 0 && (
              <div key={mealType} className="card">
                <h3 className="font-bold text-gray-900 mb-3 capitalize">
                  {mealType === 'snack' ? '🍿' : mealType === 'breakfast' ? '🌅' : mealType === 'lunch' ? '🌞' : '🌙'} {mealType}
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                      <th className="text-left py-2">Food</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Cal</th>
                      <th className="text-right py-2">Protein</th>
                      <th className="text-right py-2">Carbs</th>
                      <th className="text-right py-2">Fat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} className="border-b border-gray-50">
                        <td className="py-2 font-medium text-gray-800">{item.food?.name}</td>
                        <td className="py-2 text-right text-gray-500">{item.quantity_display} {item.quantity_unit}</td>
                        <td className="py-2 text-right font-medium text-primary">{Math.round(item.calories)}</td>
                        <td className="py-2 text-right text-orange-500">{item.protein?.toFixed(1)}g</td>
                        <td className="py-2 text-right text-yellow-600">{item.carbohydrates?.toFixed(1)}g</td>
                        <td className="py-2 text-right text-red-500">{item.fat?.toFixed(1)}g</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </>
      ) : <EmptyState message="No data found for this date." />}
    </div>
  );
};

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
      <div className="card flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Week starting:</label>
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="input-field w-auto"
        />
      </div>

      {loading ? <Spinner /> : report ? (
        <>
          {/* Average Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Avg. Calories', val: Math.round(report.averages?.calories || 0), unit: 'kcal', color: 'text-primary' },
              { label: 'Avg. Protein', val: (report.averages?.protein || 0).toFixed(1), unit: 'g', color: 'text-orange-500' },
              { label: 'Avg. Carbs', val: (report.averages?.carbohydrates || 0).toFixed(1), unit: 'g', color: 'text-yellow-600' },
              { label: 'Avg. Fat', val: (report.averages?.fat || 0).toFixed(1), unit: 'g', color: 'text-red-500' },
            ].map(c => (
              <div key={c.label} className="card text-center">
                <p className={`text-2xl font-bold ${c.color}`}>{c.val}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label} ({c.unit})</p>
              </div>
            ))}
          </div>

          {/* Calorie Bar Chart */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">Daily Calorie Intake</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Calories" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Macro Trend Line Chart */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">Macro Trend (g/day)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Protein" stroke={MACRO_COLORS.protein} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Carbs" stroke={MACRO_COLORS.carbohydrates} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Fat" stroke={MACRO_COLORS.fat} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Fiber" stroke={MACRO_COLORS.fiber} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Goal Achievement Days */}
          {report.goal_achievement_days && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">Days Goal Was Met (out of 7)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(report.goal_achievement_days).map(([nutrient, days]) => (
                  <div key={nutrient} className="text-center bg-gray-50 rounded-xl p-4">
                    <p className="text-3xl font-bold text-primary">{days}<span className="text-lg text-gray-400">/7</span></p>
                    <p className="text-xs text-gray-600 capitalize mt-1">{nutrient.replace(/_/g, ' ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : <EmptyState message="Log at least a few days to see your weekly report." />}
    </div>
  );
};

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
      <div className="card flex items-center gap-4 flex-wrap">
        <label className="text-sm font-medium text-gray-700">Month:</label>
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="input-field w-auto"
        >
          {MONTH_NAMES.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="input-field w-auto"
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
            <div className="card bg-green-50 border-green-100">
              <h3 className="font-bold text-green-800 mb-3">📝 Monthly Summary</h3>
              <ul className="space-y-2">
                {report.summary_sentences.map((s, i) => (
                  <li key={i} className="text-sm text-green-700 flex gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Average Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Avg. Daily Calories', val: Math.round(report.averages?.calories || 0), unit: 'kcal', color: 'text-primary' },
              { label: 'Avg. Protein', val: (report.averages?.protein || 0).toFixed(1), unit: 'g', color: 'text-orange-500' },
              { label: 'Avg. Fiber', val: (report.averages?.fiber || 0).toFixed(1), unit: 'g', color: 'text-green-600' },
              { label: 'Avg. Fat', val: (report.averages?.fat || 0).toFixed(1), unit: 'g', color: 'text-red-500' },
            ].map(c => (
              <div key={c.label} className="card text-center">
                <p className={`text-2xl font-bold ${c.color}`}>{c.val}</p>
                <p className="text-xs text-gray-500 mt-1">{c.label} ({c.unit})</p>
              </div>
            ))}
          </div>

          {/* Calendar Heatmap */}
          {report.calendar_data && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">
                Calorie Goal Achievement — {MONTH_NAMES[month - 1]} {year}
              </h3>
              <CalendarHeatmap calendarData={report.calendar_data} calorieGoal={report.averages?.goal_calories || 2000} />
            </div>
          )}

          {/* Days goal met per nutrient */}
          {report.days_goal_met && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">
                Days Goal Was Met (out of {report.total_logged_days || 30})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(report.days_goal_met).map(([nutrient, days]) => {
                  const total = report.total_logged_days || 30;
                  const pctVal = pct(days, total);
                  return (
                    <div key={nutrient} className="text-center bg-gray-50 rounded-xl p-4">
                      <p className="text-3xl font-bold text-primary">
                        {days}<span className="text-lg text-gray-400">/{total}</span>
                      </p>
                      <p className="text-xs text-gray-600 capitalize mt-1">{nutrient.replace(/_/g, ' ')}</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div
                          className={`h-1.5 rounded-full ${pctVal >= 80 ? 'bg-green-500' : pctVal >= 50 ? 'bg-orange-400' : 'bg-gray-400'}`}
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

// ─── Calendar Heatmap Component ──────────────────────────────────────────────
const CalendarHeatmap = ({ calendarData, calorieGoal }) => {
  const getCellColor = (calories) => {
    if (!calories) return 'bg-gray-100';
    const ratio = calories / calorieGoal;
    if (ratio >= 0.9 && ratio <= 1.1) return 'bg-green-500 text-white';
    if (ratio >= 0.7) return 'bg-green-200';
    if (ratio > 1.1) return 'bg-orange-400 text-white';
    return 'bg-gray-200';
  };

  const days = Object.entries(calendarData).sort(([a], [b]) => Number(a) - Number(b));

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(([day, data]) => {
          const cal = data?.calories || 0;
          return (
            <div
              key={day}
              title={`Day ${day}: ${Math.round(cal)} kcal`}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold cursor-default transition-all ${getCellColor(cal)}`}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block"></span> At goal</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-200 inline-block"></span> Under</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-400 inline-block"></span> Over</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 inline-block"></span> No data</span>
      </div>
    </div>
  );
};

// ─── Shared Components ───────────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex items-center justify-center h-40">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="card text-center p-12 text-gray-400">
    <p className="text-5xl mb-4">📊</p>
    <p className="font-medium">{message}</p>
  </div>
);

export default Reports;
