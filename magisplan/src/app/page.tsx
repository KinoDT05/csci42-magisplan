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
        <div>
            <h1>Test Data</h1>
            <List data={data}/>

            <Button label="This content" />
            <Button label="This Hello" />
        </div>
    );
}