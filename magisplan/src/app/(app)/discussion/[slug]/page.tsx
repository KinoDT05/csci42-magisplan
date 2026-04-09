"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Reply = { replyID: number; replyContent: string; dateCreated: string; };
type Topic = { topicID: number; topicName: string; topicDescription: string; isArchived: boolean; dateCreated: string; replies: Reply[]; };

export default function DiscussionDetailPage() {
  const { slug } = useParams();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyError, setReplyError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTopic = async () => {
    const res = await fetch(`/api/discussion/${slug}`);
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setTopic(data);
  };

  useEffect(() => { fetchTopic(); }, [slug]);

  const handleReplySubmit = async () => {
    setReplyError("");
    if (!replyContent.trim()) { setReplyError("Reply cannot be empty."); return; }
    setSubmitting(true);
    const res = await fetch(`/api/discussion/${slug}/reply`, {
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

  return (
    <div className="bg-[#FAF5F5]">
      <h1>{topic.topicName}</h1>
      <small>{topic.dateCreated}</small>
      <p>{topic.topicDescription}</p>
      <hr />
      <h2>Replies ({topic.replies.length})</h2>
      <button onClick={() => setShowModal(true)}>+ Add Reply</button>
      {topic.replies.length === 0 ? <p>No replies yet.</p> : (
        <ul>
          {topic.replies.map((reply) => (
            <li key={reply.replyID}>
              {reply.replyContent}
              <br />
              <small>{reply.dateCreated}</small>
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <dialog open>
          <h3>Add Reply</h3>
          <textarea placeholder="Write your reply..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)} rows={4} />
          {replyError && <p>{replyError}</p>}
          <br />
          <button onClick={() => { setShowModal(false); setReplyContent(""); setReplyError(""); }}>Cancel</button>
          <button onClick={handleReplySubmit} disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</button>
        </dialog>
      )}
    </div>
  );
}