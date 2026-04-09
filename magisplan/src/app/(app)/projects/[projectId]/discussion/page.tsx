"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"

type Topic = {
  topicID: number;
  topicName: string;
  topicDescription: string;
  dateCreated: string;
};

export default function DiscussionPage({ params }: { params: Promise<{ projectId: string }> } ) {
  const { projectId } = use(params);
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [error, setError] = useState("");
  const [projectName, setProjectName] = useState("");

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
  }, []);

  // get poster
  // useEffect(() => {
  //   const fetchPoster = async () => {
  //     const { data, error } = await supabase
  //       .from("users")
  //       .select("firstName, lastName, contactNumber")
  //       .eq("userID", id)
  //       .single();
      
  //     if (error) {
  //       console.error(error);
  //     } else {
  //       setProjectName(data.projectName);
  //     }
  //   };

  //   fetchPoster();
  // }, []);

  return (
    <div className="bg-[#f5f5f5] w-ful min-h-screen -mx-8 -my-4 p-7">
      <h1 className="text-5xl font-semibold text-[var(--main)]">{projectName} Discussion Page</h1>

      {/* create new topic */}
      <div className="flex bg-[var(--background)] px-5 py-3 rounded-xl items-center text-[var(--txt-gray)] my-10">
        Add a new thread
        <div className="ml-auto">
          <button className="bg-[var(--accent)] px-3 py-1 text-white rounded-md ml-auto hover:opacity-90 transition cursor-pointer" onClick={() => router.push(`/projects/${projectId}/discussion/create`)}>+</button>
        {error && <p>{error}</p>}
        </div>
      </div>
    

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
                <p className="text-xs text-[var(--txt-gray)]">temp asked on 
                  {(() => {
                    const date = new Date(topic.dateCreated);
                    const month = date.toLocaleString("en-US", { month: "long" });
                    const day = date.getDate();
                    const year = date.getFullYear();
                    return ` ${month} ${day}, ${year}`;
                  })()}
                </p>
                <strong className="text-2xl">{topic.topicName}</strong>
                <p className="text-lg text-[var(--txt-gray)] mt-5">{topic.topicDescription}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      
    </div>
  );
}