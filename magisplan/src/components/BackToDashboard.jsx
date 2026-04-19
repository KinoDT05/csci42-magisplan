"use client";

import { useRouter } from "next/navigation";

export default function BackToDashboard({ projectID }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/projects/${projectID}/dashboard`)}
      className="p-2 rounded-full hover:bg-gray-200 transition cursor-pointer"
    >
      <img src="/back.svg" alt="Back" width={30} />
    </button>
  );
}