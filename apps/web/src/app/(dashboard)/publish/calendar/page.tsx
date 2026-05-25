'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface ScheduleItem {
  id: string;
  status: string;
  scheduledAt: string;
  content?: {
    id: string;
    body: string;
    platform: string;
  } | null;
  socialAccount: {
    id: string;
    platform: string;
    name: string;
  };
  campaign?: {
    id: string;
    name: string;
  } | null;
}

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const [monthOffset, setMonthOffset] = useState(0);
  const now = new Date();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['publish-calendar'],
    queryFn: async () => {
      const res = await apiClient.get('/schedules');
      return res.data as ScheduleItem[];
    },
  });

  const currentMonth = useMemo(() => new Date(now.getFullYear(), now.getMonth() + monthOffset, 1), [now, monthOffset]);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + totalDays }, (_, i) => (i < firstDay ? null : i - firstDay + 1));

  const schedulesByDay = useMemo(() => {
    return schedules.reduce<Record<number, ScheduleItem[]>>((acc, schedule) => {
      const date = new Date(schedule.scheduledAt);
      if (date.getFullYear() !== year || date.getMonth() !== month) {
        return acc;
      }

      const day = date.getDate();
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(schedule);
      return acc;
    }, {});
  }, [month, schedules, year]);

  const monthlyScheduleCount = Object.values(schedulesByDay).reduce((sum, daySchedules) => sum + daySchedules.length, 0);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Publishing Calendar</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">See every queued, published, and failed post on a real calendar instead of hoping time is a flat list.</p>
        </div>
        <Link href="/publish" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          <Calendar className="h-4 w-4" /> Open publishing hub
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Schedules this month" value={String(monthlyScheduleCount)} />
        <MetricCard label="Published this month" value={String(schedules.filter((item) => {
          const date = new Date(item.scheduledAt);
          return item.status === 'published' && date.getFullYear() === year && date.getMonth() === month;
        }).length)} />
        <MetricCard label="Failed this month" value={String(schedules.filter((item) => {
          const date = new Date(item.scheduledAt);
          return item.status === 'failed' && date.getFullYear() === year && date.getMonth() === month;
        }).length)} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">{monthName} {year}</h2>
          <div className="flex gap-2">
            <button onClick={() => setMonthOffset((value) => value - 1)} className="rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-sm hover:bg-gray-50 dark:bg-gray-950 dark:border-gray-700 dark:hover:bg-gray-800">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setMonthOffset((value) => value + 1)} className="rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-sm hover:bg-gray-50 dark:bg-gray-950 dark:border-gray-700 dark:hover:bg-gray-800">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-gray-800">
          {days.map((day) => (
            <div key={day} className="bg-gray-50 dark:bg-gray-950 px-3 py-3 text-center text-xs font-semibold uppercase tracking-widest text-gray-400 dark:bg-gray-800/50">
              {day}
            </div>
          ))}

          {cells.map((day, index) => {
            const daySchedules = day ? schedulesByDay[day] ?? [] : [];
            const isToday = day !== null && day === now.getDate() && month === now.getMonth() && year === now.getFullYear();

            return (
              <div
                key={index}
                className={`min-h-[150px] p-3 align-top ${isToday ? 'bg-brand-50/40 dark:bg-brand-900/10' : 'hover:bg-gray-50 dark:bg-gray-950/60 dark:hover:bg-gray-800/20'}`}
              >
                {day !== null ? (
                  <>
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${isToday ? 'bg-brand-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                      {day}
                    </span>

                    <div className="mt-3 space-y-2">
                      {daySchedules.slice(0, 3).map((schedule) => (
                        <div key={schedule.id} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/80 p-2 text-xs dark:border-gray-800 dark:bg-gray-950/40">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white">{schedule.socialAccount.name}</span>
                            <span className={`rounded-full px-2 py-0.5 font-bold uppercase tracking-widest ${schedule.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : schedule.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                              {schedule.status}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                            <Clock className="h-3 w-3" />
                            {new Date(schedule.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="mt-1 line-clamp-2 text-[11px] text-gray-600 dark:text-gray-300">
                            {schedule.content?.body || schedule.campaign?.name || 'Scheduled publish'}
                          </div>
                        </div>
                      ))}

                      {daySchedules.length > 3 ? (
                        <Link href="/publish" className="block text-[11px] font-semibold text-brand-600 hover:underline">
                          +{daySchedules.length - 3} more posts
                        </Link>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="text-2xl font-black text-gray-900 dark:text-white">{value}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-400">{label}</div>
    </div>
  );
}
