"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"

type Topic = {
  topicID: number;
  topicName: string;
  topicDescription: string;
  dateCreated: string;
  replyCount: number;
  author?: {
    displayName: string;
    role: string;
    committeeID: string;
  } | null;
};

export default function DiscussionPage({ params }: { params: Promise<{ projectId: string }> } ) {
  const { projectId } = use(params);
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [error, setError] = useState("");
  const [projectName, setProjectName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [topicDescription, setTopicContent] = useState("");
  const [topicName, setTopicName] = useState("");
  const [topicError, setTopicError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // get project name
  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("projectName")
        .eq("projectID", projectId)
        .single();

      if (error) {
        console.error(error);
      } else {
        setProjectName(data.projectName);
      }
    };

    fetchProject();
  }, [projectId]);

  // get topic details
  useEffect(() => {
    const fetchTopics = async () => {
      const res = await fetch(`/api/projects/${projectId}/discussion`);
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setTopics(data);
    };
    fetchTopics();
  }, [projectId]);

  const handleReplySubmit = async () => {
    setTopicError("");
    if (!topicName.trim()) { setTopicError("Title cannot be empty."); return; }
    if (!topicDescription.trim()) { setTopicError("Content cannot be empty."); return; }
    setSubmitting(true);
    const res = await fetch(`/api/projects/${projectId}/discussion/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicName, topicDescription }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setTopicError(data.error); return; }
    setShowModal(false);
    setTopicContent("");
    setTopicName("");
  };

  return (
    <div className="bg-[#f5f5f5] w-ful min-h-screen -mx-8 -my-4 p-7">
      <h1 className="text-5xl font-semibold text-[var(--main)]">{projectName} Discussion Page</h1>

      {/* create new topic */}
      <div className="flex bg-[var(--background)] px-5 py-3 rounded-xl items-center text-[var(--txt-gray)] my-10">
        Add a new thread
        <div className="ml-auto">
          <button className="bg-[var(--accent)] px-3 py-1 text-white rounded-md ml-auto hover:opacity-90 transition cursor-pointer" onClick={() => setShowModal(true)}>+</button>
        {error && <p>{error}</p>}
        
        </div>
      </div>

      {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
              <div className="bg-white w-[500px] max-w-[90%] rounded-xl shadow-lg p-6">
                {/* header */}
                <div className="flex">
                  <button className="cursor-pointer font-semibold" onClick={() => { setShowModal(false); setTopicName(""); setTopicContent(""); setTopicError(""); }}>Cancel</button>
                  <button className="cursor-pointer btn-primary ml-auto" onClick={handleReplySubmit} disabled={submitting}>{submitting ? "Submitting..." : "Post"}</button>
                </div>

                <hr className="mt-3"></hr>

                {/* reply */}
                <textarea className="w-full p-3 mt-2" placeholder="Post your topic title" value={topicName} onChange={(e) => setTopicName(e.target.value)} rows={1} />
                <textarea className="w-full p-3 mt-2" placeholder="Post your content" value={topicDescription} onChange={(e) => setTopicContent(e.target.value)} rows={4} />
                {topicError && <p className="text-red-500 mt-2">{topicError}</p>}
            </div>
          </div>
          )}

      {/* list of topic */}
      <div className="gap-6">
        {topics.length === 0 && !error ? (
          <p>No topics found.</p>
        ) : (
          <ul className="flex flex-col gap-4 my-10">
            {topics.map((topic) => (
              <li
                key={topic.topicID}
                onClick={() =>
                  router.push(`/projects/${projectId}/discussion/${topic.topicID}`)
                }
                className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition"
              >
                <p className="text-xs text-[var(--txt-gray)]">{topic.author?.displayName ?? "Unknown"} asked on 
                  {(() => {
                    const date = new Date(topic.dateCreated);
                    const month = date.toLocaleString("en-US", { month: "long" });
                    const day = date.getDate();
                    const year = date.getFullYear();
                    return ` ${month} ${day}, ${year}`;
                  })()}
                </p>
                <strong className="text-2xl">{topic.topicName}</strong>
                <p className="text-lg text-[var(--txt-gray)] mt-5 line-clamp-5">{topic.topicDescription}</p>
                <div className="flex flex-row items-center  mt-5 mx-5">
                  <img src="/reply.svg" width={35} />
                  <p className="text-lg px-3">{topic.replyCount}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
    </div>
  );
}