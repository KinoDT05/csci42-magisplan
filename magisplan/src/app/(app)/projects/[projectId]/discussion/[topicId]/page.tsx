"use client";

import { use, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Reply = { replyID: number; replyContent: string; dateCreated: string; displayName: string; };
type Topic = { topicID: number; topicName: string; topicDescription: string; isArchived: boolean; dateCreated: string; replies: Reply[]; };

export default function DiscussionDetailPage({ params }: { params: Promise<{ projectId: string; topicId: string }> } ) {
  const { projectId, topicId } = use(params);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyError, setReplyError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTopic = async () => {
    const res = await fetch(`/api/projects/${projectId}/discussion/${topicId}`);
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setTopic(data);
  };

  useEffect(() => { fetchTopic(); }, [topicId]);

  const handleReplySubmit = async () => {
    setReplyError("");
    if (!replyContent.trim()) { setReplyError("Reply cannot be empty."); return; }
    setSubmitting(true);
    const res = await fetch(`/api/projects/${projectId}/discussion/${topicId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ replyContent }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setReplyError(data.error); return; }
    setShowModal(false);
    setReplyContent("");
    fetchTopic();
  };

  if (error) return <p>{error}</p>;
  if (!topic) return <p>Loading...</p>;
  console.log(topic.replies);

  return (
    <div className="bg-[#f5f5f5] w-ful min-h-screen -mx-8 -my-4 p-7 flex flex-col">
      <div className="mx-10">
        <Link href={`/projects/${projectId}/discussion`}>
          <img src="/back.svg" width={50} />
        </Link>
      </div>
      
      
      
      <div className="rounded-md shadow bg-white items-center mx-20 ml-30 p-7">

        {/*topic information */}
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
                <p className="text-lg text-[var(--txt-gray)] mt-3">{topic.topicDescription}</p>
        
        <div className="flex flex-row items-center  mt-5 mx-2">
          <img src="/reply.svg" width={35} />
          <p className="text-lg px-3">{topic.replies.length}</p>
        </div>

        <div className = "px-5">
           {/*add reply */}
          <button className="w-full border px-2 py-1 my-5 rounded-md text-[var(--txt-gray)] text-left" onClick={() => setShowModal(true)}>Post your reply</button>

          {/*list of replies */}
          {topic.replies.length === 0 ? <p>No replies yet.</p> : (
            <ul>
              {topic.replies.map((reply) => (
                <li key={reply.replyID}>
                  <div className="flex flex-row items-center gap-6">
                    <p className="font-semibold text-sm">{reply.author?.displayName ?? "Unknown"}</p>
                    <p className="text-xs text-[var(--txt-gray)]">{(() => {
                      const date = new Date(reply.dateCreated);
                      const month = date.toLocaleString("en-US", { month: "long" });
                      const day = date.getDate();
                      const year = date.getFullYear();
                      return ` ${month} ${day}, ${year}`;
                    })()}</p>
                  </div>
                  
                  <div className="text-lg text-[var(--txt-gray)]">{reply.replyContent}</div>
                  <br />
                  
          
                </li>
              ))}
            </ul>
          )}

          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
              <div className="bg-white w-[500px] max-w-[90%] rounded-xl shadow-lg p-6">
                {/* header */}
                <div className="flex">
                  <button className="cursor-pointer font-semibold" onClick={() => { setShowModal(false); setReplyContent(""); setReplyError(""); }}>Cancel</button>
                  <button className="cursor-pointer btn-primary ml-auto" onClick={handleReplySubmit} disabled={submitting}>{submitting ? "Submitting..." : "Post"}</button>
                </div>

                <hr className="mt-3"></hr>

                {/* reply */}
                <textarea className="w-full p-3 mt-2" placeholder="Post your reply" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} rows={4} />
                {replyError && <p className="text-red-500 mt-2">{replyError}</p>}
            </div>
          </div>
          )}
        </div>
       
      </div>
    </div>
    
  );
}