"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import EventModal from "@/components/EventModal";

type EventType = {
  eventID: number;
  projectID: number;
  createdBy: string;
  eventName: string;
  eventDescription: string;
  startAt: string;
  endAt: string;
  location: string | null;
  eventKind: "meeting" | "activity";
  meeting?: { modality: "onsite" | "online"; meetingLink: string | null; } | null;
  activity?: { activityType: string; blastRequired: boolean; } | null;
};

export default function CalendarPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);

  const [projectName, setProjectName] = useState("");
  const [projectTargetDate, setProjectTargetDate] = useState<Date | null>(null);
  const [projectCreatedAt, setProjectCreatedAt] = useState<Date | null>(null);
  
  const [events, setEvents] = useState<EventType[]>([]);
  const [error, setError] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date()); 

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("projectName, targetDate, datetimeCreated")
        .eq("projectID", projectId)
        .single();

      if (!error && data) {
        setProjectName(data.projectName);
        if (data.targetDate) setProjectTargetDate(new Date(data.targetDate));
        if (data.datetimeCreated) {
          const createdDate = new Date(data.datetimeCreated);
          setProjectCreatedAt(createdDate);
          if (new Date() < createdDate) setCurrentDate(createdDate);
        }
      }
    };
    fetchProject();
  }, [projectId]);

  const fetchEvents = async () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const res = await fetch(`/api/projects/${projectId}/calendar?from=${startOfMonth}&to=${endOfMonth}`);
    const data = await res.json();
    if (!res.ok) setError(data.error);
    else setEvents(data.events || []);
  };

  useEffect(() => {
    fetchEvents();
  }, [projectId, currentDate]);

  const openCreateModal = () => {
    setEditingEvent(null);
    setShowModal(true);
  };

  const openEditModal = (event: EventType) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const canGoPrev = projectCreatedAt ? 
    (currentDate.getFullYear() > projectCreatedAt.getFullYear() || 
    (currentDate.getFullYear() === projectCreatedAt.getFullYear() && currentDate.getMonth() > projectCreatedAt.getMonth())) 
    : true;

  const canGoNext = projectTargetDate ? 
    (currentDate.getFullYear() < projectTargetDate.getFullYear() || 
    (currentDate.getFullYear() === projectTargetDate.getFullYear() && currentDate.getMonth() < projectTargetDate.getMonth())) 
    : true;

  const prevMonth = () => {
    if (canGoPrev) setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    if (canGoNext) setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  const blankDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const actualDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
      <div className="bg-[#f5f5f5] w-full min-h-screen p-10 font-sans overflow-x-hidden">
        
        <div className="flex justify-between items-start mt-4 mb-12">
            <h1 className="text-[2.5rem] font-bold text-[var(--main)] tracking-tight">
              {projectName ? `${projectName} Calendar` : "Loading Calendar..."}
            </h1>
            <button 
                onClick={openCreateModal}
                className="bg-[#33415C] text-white px-5 py-2 rounded-full font-medium hover:bg-opacity-90 transition shadow-sm"
            >
              Schedule event
            </button>
        </div>

        <div className="flex justify-between items-end mb-6">
            <div className="flex items-center gap-4">
                <button 
                  onClick={prevMonth} disabled={!canGoPrev}
                  className={`text-2xl font-bold px-2 transition ${canGoPrev ? "text-gray-500 hover:text-[var(--main)]" : "text-gray-300 cursor-not-allowed"}`}
                >&lt;</button>
                <h2 className="text-2xl font-bold text-slate-800 w-48 text-center">{monthName} {year}</h2>
                <button 
                  onClick={nextMonth} disabled={!canGoNext}
                  className={`text-2xl font-bold px-2 transition ${canGoNext ? "text-gray-500 hover:text-[var(--main)]" : "text-gray-300 cursor-not-allowed"}`}
                >&gt;</button>
            </div>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="grid grid-cols-7 gap-3 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
            <div key={dayName} className="text-center font-bold text-gray-500 text-xs uppercase">{dayName}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3 mb-10">
          {blankDays.map((_, index) => (
            <div key={`blank-${index}`} className="bg-transparent h-36 rounded-xl"></div>
          ))}

          {actualDays.map((day) => {
             const cellStart = new Date(year, currentDate.getMonth(), day, 0, 0, 0, 0).getTime();
             const cellEnd = new Date(year, currentDate.getMonth(), day, 23, 59, 59, 999).getTime();

             const dayEvents = events.filter(evt => {
                 const eStart = new Date(evt.startAt).getTime();
                 const eEnd = new Date(evt.endAt).getTime();
                 return eStart <= cellEnd && eEnd >= cellStart;
             });

             return (
              <div key={day} className="bg-[#e6e6e6] rounded-xl h-36 p-3 flex flex-col shadow-sm group border border-transparent hover:border-[var(--main)] transition-all overflow-y-auto">
                  <div className="flex justify-end items-start mb-2">
                      <span className="text-sm font-bold text-gray-500 group-hover:text-[var(--main)] transition-colors">
                          {day.toString().padStart(2, '0')}
                      </span>
                  </div>
                  
                  <div className="space-y-1 flex-1">
                      {dayEvents.map(evt => (
                          <div 
                              key={evt.eventID}
                              onClick={() => openEditModal(evt)}
                              className={`text-[10px] font-bold px-2 py-1 rounded truncate cursor-pointer shadow-sm text-white transition hover:opacity-80
                                  ${evt.eventKind === 'meeting' ? 'bg-[#93c5fd] text-blue-900' : 'bg-[#fca5a5] text-red-900'}
                              `}
                          >
                              {evt.eventName}
                          </div>
                      ))}
                  </div>
              </div>
            )
          })}
        </div>

        <EventModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          onRefresh={fetchEvents} 
          projectId={projectId as string}
          editingEvent={editingEvent}
        />
      </div>
  );
}