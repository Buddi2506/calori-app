import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getMonthlyReport } from '../../api/reports';
import StatCard from '../../components/ui/StatCard';
import CalendarHeatmap from './CalendarHeatmap';
import { Spinner, EmptyState, PeriodNav, GoalDaysCard } from './shared';

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

  // Move by whole months; Date handles the year rollover
  const shift = (delta) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
  const logged = report?.total_logged_days || 0;

  return (
    <div className="flex flex-col gap-5">
      <PeriodNav
        label={format(new Date(year, month - 1, 1), 'MMMM yyyy')}
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
        onReset={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }}
        resetLabel="This month"
        atLatest={isCurrent}
      />

      {loading ? <Spinner /> : !report ? (
        <EmptyState message="Couldn't load this month's report." />
      ) : (
        <>
          {logged > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Avg. calories" value={Math.round(report.averages?.calories || 0).toLocaleString()} unit="kcal"
                note={`${logged} ${logged === 1 ? 'day' : 'days'} logged`} accent="stripe-amber" />
              <StatCard label="Avg. protein" value={(report.averages?.protein || 0).toFixed(1)} unit="g"
                note={`goal ${Math.round(report.goals?.protein || 0)} g`} accent="stripe-green" />
              <StatCard label="Avg. fiber" value={(report.averages?.fiber || 0).toFixed(1)} unit="g"
                note={`goal ${Math.round(report.goals?.fiber || 0)} g`} accent="stripe-amber" />
              <StatCard label="Avg. fat" value={(report.averages?.fat || 0).toFixed(1)} unit="g"
                note={`goal ${Math.round(report.goals?.fat || 0)} g`} accent="stripe-pink" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 items-start">
            {report.calendar_data && (
              <section className="zentra-card p-6">
                <h3 className="text-base font-extrabold text-gray-900 mb-4">Calories vs goal</h3>
                <CalendarHeatmap
                  calendarData={report.calendar_data}
                  calorieGoal={report.averages?.goal_calories || 2000}
                  year={year}
                  month={month}
                />
              </section>
            )}

            <section className="zentra-card p-6 flex flex-col gap-3">
              <h3 className="text-base font-extrabold text-gray-900">Summary</h3>
              {report.summary_sentences?.length > 0 ? (
                <ul className="flex flex-col gap-2.5">
                  {report.summary_sentences.map((s, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" aria-hidden="true" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Nothing logged this month yet. A summary appears once you log a few days.</p>
              )}
            </section>
          </div>

          {logged > 0 && report.days_goal_met && (
            <GoalDaysCard daysMet={report.days_goal_met} loggedDays={logged} />
          )}
        </>
      )}
    </div>
  );
};

export default MonthlyReport;
