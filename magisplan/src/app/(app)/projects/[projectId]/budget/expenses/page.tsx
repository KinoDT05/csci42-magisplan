"use client";

import { useState, useEffect} from "react";
import { createClient } from '@/lib/supabase/client'
import {useParams} from "next/navigation";
import { supabase } from "@/lib/supabaseClient"

type Expense = {
    transactionID: number;
    amount: number;
    description: string;
    dateRecorded: string; 
    paymentStatus: string;
    payee: string;
    expenseType: string
};

export default function RevenuePage() {
    const params = useParams();
    const projectID = params.projectId;
    const [projectName, setProjectName] = useState(""); 
    const [userID, setUserId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [totalExpenses, setTotalExpenses] = useState("");
    const [totalRevenue, setTotalRevenue] = useState("");
    const [netIncome, setNetIncome] = useState("");
    const [expenses, setExpenses] = useState<Expense[]>([]);

    //get user 
  
    useEffect(() => {
      const getUser = async () => {
        const { data } = await supabase.auth.getUser();
        setUserId(data.user?.id ?? null);
      };
  
      getUser();
    }, []);

    // get project name
    useEffect(() => {
        const fetchProject = async () => {
            const { data, error } = await supabase
                .from("projects")
                .select("projectName")
                .eq("projectID", projectID)
                .single();
            
            if (error) {
                console.error(error);
            } else {
                setProjectName(data.projectName);
            }
        };

        fetchProject();
    }, [projectID]);

    // get summary information
    useEffect(() => {
        const fetchSummary = async () => {
            const res = await fetch(`/api/projects/${projectID}/budget/summary`)
            const data = await res.json();
            if (!res.ok) {
                setError(data.error);
                return;
            }
            setTotalExpenses(data.totalExpenses);
            setTotalRevenue(data.totalRevenue);
            setNetIncome(data.netIncome);
        };

        if (projectID) fetchSummary();
    });

    // get expenses details
    useEffect(() => {
        const fetchExpenses = async () => {
            const res = await fetch(`/api/projects/${projectID}/budget/expenses`)
            const data = await res.json();
            if (!res.ok) {
                setError(data.error);
                return;
            }
            setExpenses(data);
        };
        fetchExpenses();
    }, [projectID])
    
    return (
        <div className="bg-[#f5f5f5] w-ful min-h-screen -mx-8 -my-4 p-7">
            <div className="text-5xl font-semibold text-[var(--main)] mb-7">{projectName} Budget Tracker</div>

            {/* summary information + expenses button */}
            <div className="grid grid-cols-4 gap-6 mb-7">
                <div className="bg-white shadow-lg p-2 rounded-lg">
                    <p className="text-sm">Total Revenue</p>
                    <p className="mt-3 font-bold text-4xl">P{totalRevenue}</p>
                </div>

                <div className="bg-white shadow-lg p-2 rounded-lg">
                    <p className="text-sm">Total Expenses</p>
                    <p className="mt-3 font-bold text-4xl">P{totalExpenses}</p>
                </div>

                <div className="bg-white shadow-lg p-2 rounded-lg">
                    <p className="text-sm">Net Income</p>
                    <p className="mt-3 font-bold text-4xl">P{netIncome}</p>
                </div>

                <div className="flex items-center">
                    <button className="btn-primary mt-auto cursor-pointer">Add an expense</button>
                </div>
            </div>

            {/* expenses table header */}
            <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_1fr_0.5fr] gap-4 bg-white shadow-lg p-4 rounded-lg">
                <div className="font-semibold text-sm">Payee</div>
                <div className="font-semibold text-sm">Type</div>
                <div className="font-semibold text-sm">Date</div>
                <div className="font-semibold text-sm">Transaction ID</div>
                <div className="font-semibold text-sm">Total</div>
                <div className="font-semibold text-sm">Status</div>
            </div>

            {/* expenses table details */}
            <div className="mt-5">
                {expenses.length === 0 && !error ? (
                    <p>No expenses listed.</p>
                ) : (
                    expenses.map((expense) => (
                        <div key={expense.transactionID} className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_1fr_0.5fr] gap-4 bg-white p-4 rounded-lg">
                            <p>{expense.payee}</p>
                            <p>{expense.expenseType}</p>
                            <p>{expense.dateRecorded}</p>
                            <p>{expense.transactionID}</p>
                            <p>{expense.amount}</p>
                            <p>{expense.paymentStatus}</p>
                            {/* {userID === expense.userID && (
                                <div className="flex gap-2 mt-2 ml-auto">
                                    <button className="cursor-pointer">
                                        <img src="/edit.svg" width={15} />
                                    </button>
                                </div>
                            )} */}
                        </div>
                    ))
                )}


            </div>
        </div>
    );
}