"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/Modal";

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

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  projectId: string | number;
  editingEvent: EventType | null;
}

const initialFormState = {
  eventKind: "meeting" as "meeting" | "activity",
  eventName: "",
  location: "",
  startAt: "",
  endAt: "",
  eventDescription: "",
  modality: "onsite" as "onsite" | "online",
  meetingLink: "",
  activityType: "",
  blastRequired: false,
};

export default function EventModal({ isOpen, onClose, onRefresh, projectId, editingEvent }: EventModalProps) {
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        setForm({
          eventKind: editingEvent.eventKind,
          eventName: editingEvent.eventName,
          location: editingEvent.location || "",
          startAt: new Date(editingEvent.startAt).toISOString().slice(0, 16),
          endAt: new Date(editingEvent.endAt).toISOString().slice(0, 16),
          eventDescription: editingEvent.eventDescription || "",
          modality: editingEvent.meeting?.modality || "onsite",
          meetingLink: editingEvent.meeting?.meetingLink || "",
          activityType: editingEvent.activity?.activityType || "",
          blastRequired: editingEvent.activity?.blastRequired || false,
        });
      } else {
        setForm(initialFormState);
      }
      setFormError("");
    }
  }, [isOpen, editingEvent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    const payload = {
      eventKind: form.eventKind,
      eventName: form.eventName,
      eventDescription: form.eventDescription,
      startAt: form.startAt,
      endAt: form.endAt,
      location: form.location,
      ...(form.eventKind === "meeting" && { modality: form.modality, meetingLink: form.meetingLink }),
      ...(form.eventKind === "activity" && { activityType: form.activityType, blastRequired: form.blastRequired }),
    };

    const endpoint = editingEvent ? `/api/projects/${projectId}/events/${editingEvent.eventID}` : `/api/projects/${projectId}/events`;
    const method = editingEvent ? "PATCH" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) {
        setFormError(data.error || "Something went wrong.");
      } else {
        onRefresh();
        onClose();
      }
    } catch (err) {
      setFormError("A network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/events/${editingEvent.eventID}`, { method: "DELETE" });
      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        const data = await res.json();
        setFormError(data.error || "Failed to delete.");
      }
    } catch (err) {
      setFormError("Network error on delete.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="flex items-center justify-between border-b pb-4 mb-6 relative">
          <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-[var(--main)]">
                  {editingEvent ? `Edit your ${form.eventKind}` : `Schedule a ${form.eventKind === 'meeting' ? 'meeting' : 'activity'}`}
              </h2>
          </div>
          {editingEvent && (
              <button onClick={handleDeleteEvent} type="button" className="hover:bg-red-100 p-2 rounded-md transition absolute right-8 top-0">
                  <img src="/delete.svg" className="w-5 h-5" alt="Delete" />
              </button>
          )}
      </div>

      {formError && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{formError}</div>}

      <form onSubmit={handleModalSubmit} className="space-y-5 text-gray-800">
          <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Event Name<span className="text-red-500">*</span></label>
                  <input name="eventName" value={form.eventName} onChange={handleChange} className="border border-gray-400 p-2 rounded-full px-4 bg-white" required />
              </div>
              <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Location</label>
                  <input name="location" value={form.location} onChange={handleChange} className="border border-gray-400 p-2 rounded-full px-4 bg-white" />
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Start date<span className="text-red-500">*</span></label>
                  <input type="datetime-local" name="startAt" value={form.startAt} onChange={handleChange} className="border border-gray-400 p-2 rounded-full px-4 bg-white" required />
              </div>
              <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">End date<span className="text-red-500">*</span></label>
                  <input type="datetime-local" name="endAt" value={form.endAt} onChange={handleChange} className="border border-gray-400 p-2 rounded-full px-4 bg-white" required />
              </div>
          </div>

          <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Notes</label>
              <input name="eventDescription" value={form.eventDescription} onChange={handleChange} className="border border-gray-400 p-2 rounded-full px-4 w-full bg-white" />
          </div>

          <div className="flex border border-gray-400 rounded w-fit overflow-hidden">
              <button 
                  type="button"
                  onClick={() => setForm(p => ({...p, eventKind: "meeting"}))}
                  className={`px-4 py-1 text-sm font-medium ${form.eventKind === "meeting" ? "bg-[var(--main)] text-white" : "bg-white text-gray-700"}`}
              >
                  Meeting
              </button>
              <button 
                  type="button"
                  onClick={() => setForm(p => ({...p, eventKind: "activity"}))}
                  className={`px-4 py-1 text-sm font-medium ${form.eventKind === "activity" ? "bg-[var(--main)] text-white" : "bg-white text-gray-700 border-l border-gray-400"}`}
              >
                  Activity
              </button>
          </div>

          {form.eventKind === "meeting" ? (
              <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                      <label className="text-sm font-medium mb-1">Modality<span className="text-red-500">*</span></label>
                      <select name="modality" value={form.modality} onChange={handleChange} className="border border-gray-400 p-2 rounded-full px-4 bg-white" required>
                          <option value="onsite">Onsite</option>
                          <option value="online">Online</option>
                      </select>
                  </div>
                  <div className="flex flex-col">
                      <label className="text-sm font-medium mb-1">Meeting Link</label>
                      <input name="meetingLink" value={form.meetingLink} onChange={handleChange} className="border border-gray-400 p-2 rounded-full px-4 bg-white" />
                  </div>
              </div>
          ) : (
              <div className="grid grid-cols-2 gap-4 items-end">
                  <div className="flex flex-col">
                      <label className="text-sm font-medium mb-1">Activity Type<span className="text-red-500">*</span></label>
                      <select name="activityType" value={form.activityType} onChange={handleChange} className="border border-gray-400 p-2 rounded-full px-4 bg-white" required>
                          <option value="">Select type...</option>
                          <option value="workshop">Workshop</option>
                          <option value="seminar">Seminar</option>
                          <option value="social">Social</option>
                      </select>
                  </div>
                  <div className="flex items-center gap-2 pb-3 pl-2">
                      <label className="text-sm font-medium">Blast?</label>
                      <input type="checkbox" name="blastRequired" checked={form.blastRequired} onChange={handleChange} className="w-4 h-4 cursor-pointer" />
                  </div>
              </div>
          )}

          <div className="flex justify-end gap-3 pt-6">
              <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-400 rounded-full font-medium hover:bg-gray-50 transition">
                  Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-[#33415C] text-white rounded-full font-medium hover:bg-opacity-90 transition disabled:opacity-50">
                  {isSubmitting ? "Saving..." : editingEvent ? "Edit" : "Schedule"}
              </button>
          </div>
      </form>
    </Modal>
  );
}