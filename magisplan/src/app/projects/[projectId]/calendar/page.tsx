"use client";
import React, { useEffect, useState, use } from 'react';
import Sidebar from "@/components/Sidebar";
import Button from "@/components/Button";
import List from "@/components/List";

interface Event {
  eventID: number;
  eventName: string;
  startAt: string;
}

export default function CalendarPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [isExpanded, setIsExpanded] = useState(true);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const from = "2025-12-01T00:00:00Z";
        const to = "2025-12-31T23:59:59Z";
        
        const res = await fetch(`/api/projects/${projectId}/calendar?from=${from}&to=${to}`);
        const data = await res.json();
        if (data.events) setEvents(data.events);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    };
    if (projectId) fetchEvents();
  }, [projectId]);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className={`min-h-screen bg-white text-slate-900 ${isExpanded ? 'sb-expanded' : ''}`}>
      <Sidebar />

      <main className="transition-all duration-500">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-[var(--main)]">Project Calendar</h1>
          <Button label="Schedule event" className="btn-primary" />
        </header>

        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">December 2025</h2>
          <div className="bg-[var(--bg-gray)] px-4 py-2 rounded-lg text-sm font-medium text-[var(--txt-gray)]">
            📅 Dec 1, 2025 - Dec 31, 2025
          </div>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
            <div key={dayName} className="text-center font-bold text-slate-400 text-xs uppercase mb-2">
              {dayName}
            </div>
          ))}
          
          {days.map(day => (
            <div key={day} className="min-h-[110px] bg-slate-50 rounded-2xl p-3 relative group border border-transparent hover:border-[var(--main)] transition-all">
              <span className="absolute top-3 right-4 text-xs font-bold text-slate-400 group-hover:text-[var(--main)]">
                {day.toString().padStart(2, '0')}
              </span>
              <div className="mt-6">
                <List data={events.filter(e => new Date(e.startAt).getUTCDate() === day)} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}