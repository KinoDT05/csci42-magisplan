"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateDiscussionPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const [topicName, setTopicName] = useState("");
  const [topicDescription, setTopicDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/projects/${projectId}/discussion/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicName, topicDescription }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    router.push(`/projects/${projectId}/discussion`);
  };

  return (
    <div>
      <h1>Create Discussion</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Topic Name</label><br />
          <input value={topicName} onChange={(e) => setTopicName(e.target.value)} />
        </div>
        <div>
          <label>Body</label><br />
          <textarea value={topicDescription} onChange={(e) => setTopicDescription(e.target.value)} rows={5} />
        </div>
        <button type="submit">Create</button>
        {error && <p>{error}</p>}
      </form>
    </div>
  );
}
