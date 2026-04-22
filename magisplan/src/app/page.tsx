"use client";

import { useEffect, useState } from "react";
import List from "@/components/List.jsx";
import Button from "@/components/Button.jsx";
interface TestData {
    id: number;
    desc: string;
}

export default function TestPage() {
    const [data, setData] = useState<TestData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/test", {
                    method: "GET", 
                });

                if (!res.ok) {
                    throw new Error(`Error: ${res.status}`);
                }

                const json = await res.json();
                setData(json.test);
            } catch (err: any) {
                setError(err.message);
                console.log(err.message)
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return ( 
        <div className="min-h-screen bg-[var(--main)] text-white flex flex-col justify-center bg-cover">
            <div className="text-center space-y-20">
                <h1 className="text-5xl font-bold mb-4 ml-10">
                    Welcome to MagisPlan!
                </h1>
                <p className="text-md mx-100 pt-10">
                    MagisPlan is a digital project management planner designed for students, workers, and project managers who require a centralized platform for efficiently managing tasks across different individual and organizational projects. 
                    The platform centralizes task tracking, scheduling, managing essential documents, and team collaboration features, all within a single unified workspace.
                    <br></br>
                    <br></br>
                    This is brought to you by Jam Abarico, Francine Benito, Kino De Torres, Axel Fang, and Mady Young.
                </p>
                <div className="space-x-10">
                    <p className="btn bg-white text-[var(--main)] px-15"><a href="/signup">Sign Up</a></p>
                    <p className="btn bg-white text-[var(--main)] px-15"><a href="/login">Login</a></p>
                </div>
            </div>
            
        </div>
    );
}