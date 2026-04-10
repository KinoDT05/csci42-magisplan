"use client";

import { useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client'
import { useParams } from "next/navigation";

export default function Dashboard() {
    const params = useParams();
    const projectID = params.projectId;

    return <div>{projectID}</div>;
}