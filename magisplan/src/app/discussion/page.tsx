"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Topic = {
  topicID: number;
  topicName: string;
  topicDescription: string;
  dateCreated: string;
};

export default function DiscussionPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTopics = async () => {
      const res = await fetch("/api/discussion");
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setTopics(data);
    };
    fetchTopics();
  }, []);

  return (
    <div>
      <h1>Discussions</h1>
      <button onClick={() => router.push("/discussion/create")}>+ New Topic</button>
      {error && <p>{error}</p>}
      {topics.length === 0 && !error ? <p>No topics found.</p> : (
        <ul>
          {topics.map((topic) => (
            <li key={topic.topicID} onClick={() => router.push(`/discussion/${topic.topicID}`)}>
              <strong>{topic.topicName}</strong>
              <p>{topic.topicDescription}</p>
              <small>{topic.dateCreated}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}