import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, subDays, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, ReferenceLine, Cell,
} from 'recharts';
import { formatApiDate } from '../../utils/formatters';
import { getWeeklyReport } from '../../api/reports';
import { MACRO_COLORS } from '../../utils/macros';
import StatCard from '../../components/ui/StatCard';
import { Spinner, EmptyState, PeriodNav, GoalDaysCard } from './shared';

const AXIS = { fontSize: 12, fill: '#8E8E98' };
const TOOLTIP = {
  contentStyle: { background: '#11141B', border: '1px solid #1F2430', borderRadius: 12, color: '#F2F4F8' },
  itemStyle: { color: '#F2F4F8' },
  labelStyle: { color: '#A1A1AA', fontWeight: 700 },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
};

// Bar color by how close the day was to the calorie goal (same ±10% rule as the Overview).
const barColor = (calories, goal) => {
  if (!calories) return '#1F2430';
  const ratio = calories / (goal || 1);
  if (ratio > 1.1) return '#FB7185';
  if (ratio < 0.9) return '#6F9BFF';
  return '#D4FF24';
};

const WeeklyReport = () => {
  const navigate = useNavigate();
  const thisWeek = formatApiDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [startDate, setStartDate] = useState(thisWeek);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getWeeklyReport(startDate)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [startDate]);

  const start = parseISO(startDate);
  const end = addDays(start, 6);
  const label = `${format(start, 'd MMM')} – ${format(end, 'd MMM')}`;
  const goal = report?.goals?.calories || 2000;
  const logged = report?.total_logged_days || 0;

  const chartData = report?.days?.map(d => ({
    date: d.date,
    day: format(parseISO(d.date), 'EEE'),
    Calories: Math.round(d.totals?.calories || 0),
    Protein: Math.round(d.totals?.protein || 0),
    Carbs: Math.round(d.totals?.carbohydrates || 0),
    Fat: Math.round(d.totals?.fat || 0),
  })) || [];

  return (
    <div className="flex flex-col gap-5">
      <PeriodNav
        label={label}
        onPrev={() => setStartDate(formatApiDate(subDays(start, 7)))}
        onNext={() => setStartDate(formatApiDate(addDays(start, 7)))}
        onReset={() => setStartDate(thisWeek)}
        resetLabel="This week"
        atLatest={startDate >= thisWeek}
      />

      {loading ? <Spinner /> : !report ? (
        <EmptyState message="Couldn't load this week's report." />
      ) : logged === 0 ? (
        <EmptyState message="Nothing logged this week yet. Averages and charts appear once you log a day." />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Avg. calories" value={Math.round(report.averages?.calories || 0).toLocaleString()} unit="kcal"
              note={`${logged} of 7 days logged`} accent="stripe-amber" />
            <StatCard label="Avg. protein" value={(report.averages?.protein || 0).toFixed(1)} unit="g"
              note={`goal ${Math.round(report.goals?.protein || 0)} g`} accent="stripe-green" />
            <StatCard label="Avg. carbs" value={(report.averages?.carbohydrates || 0).toFixed(1)} unit="g"
              note={`goal ${Math.round(report.goals?.carbohydrates || 0)} g`} accent="stripe-blue" />
            <StatCard label="Avg. fat" value={(report.averages?.fat || 0).toFixed(1)} unit="g"
              note={`goal ${Math.round(report.goals?.fat || 0)} g`} accent="stripe-pink" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="zentra-card p-6">
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <h3 className="text-base font-extrabold text-gray-900">Calories per day</h3>
                <span className="text-xs text-gray-500">Tap a bar to open that day</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2430" vertical={false} />
                  <XAxis dataKey="day" tick={AXIS} axisLine={false} tickLine={false} />
                  {/* Always tall enough to show the goal line */}
                  <YAxis tick={AXIS} axisLine={false} tickLine={false} width={44}
                    domain={[0, (max) => Math.ceil((Math.max(max, goal) * 1.1) / 500) * 500]} />
                  <Tooltip {...TOOLTIP} />
                  <ReferenceLine y={goal} stroke="#F2F4F8" strokeDasharray="4 4" label={{ value: 'Goal', fill: '#F2F4F8', fontSize: 11, position: 'insideTopRight' }} />
                  <Bar dataKey="Calories" radius={[8, 8, 0, 0]} cursor="pointer" onClick={(d) => navigate(`/diary/${d.payload?.date || d.date}`)}>
                    {chartData.map((d) => <Cell key={d.date} fill={barColor(d.Calories, goal)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#D4FF24]" />Within 10% of goal</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#6F9BFF]" />Under</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#FB7185]" />Over</span>
              </div>
            </section>

            <section className="zentra-card p-6">
              <h3 className="text-base font-extrabold text-gray-900 mb-4">Macros per day (g)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2430" vertical={false} />
                  <XAxis dataKey="day" tick={AXIS} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS} axisLine={false} tickLine={false} width={44} />
                  <Tooltip {...TOOLTIP} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Protein" stroke={MACRO_COLORS.protein} strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Carbs" stroke={MACRO_COLORS.carbohydrates} strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Fat" stroke={MACRO_COLORS.fat} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </section>
          </div>

          {report.goal_achievement_days && (
            <GoalDaysCard daysMet={report.goal_achievement_days} loggedDays={logged} />
          )}
        </>
      )}
    </div>
  );
};

export default WeeklyReport;
