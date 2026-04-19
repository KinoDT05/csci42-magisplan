"use client";

import { useState, useEffect} from "react";
import { createClient } from '@/lib/supabase/client'
import { useRouter } from "next/navigation";
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
    const router = useRouter();
    const projectID = params.projectId;
    const [projectName, setProjectName] = useState(""); 
    const [userID, setUserId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [totalExpenses, setTotalExpenses] = useState("");
    const [totalRevenue, setTotalRevenue] = useState("");
    const [netIncome, setNetIncome] = useState("");
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [showModal, setShowModal] = useState(false); 
    const [submitting, setSubmitting] = useState(false);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [paymentStatus, setPaymentStatus] = useState(""); 
    const [payee, setPayee] = useState("");
    const [expenseType, setPaymentType] = useState("");
    const [dateRecorded, setDateRecorded] = useState("");

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

    // add an expense
    const handleAddExpense = async () => {
        setError("");
        if (!payee) {setError("Payee cannot be null"); return; }
        if (!expenseType) {setError("Payment type cannot be null"); return; }
        if (!paymentStatus) {setError("Payment status cannot be null"); return; }
        if (!amount) {setError("Amount cannot be null"); return; }

        setSubmitting(true);
        const res = await fetch(`/api/projects/${projectID}/budget/expenses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payee, expenseType, paymentStatus, description, amount, dateRecorded})
        })
        const data = await res.json();
        setSubmitting(false);
        if (!res.ok) {setError(data.error); return; }
        setShowModal(false);
        setAmount("");
        setDescription("");
        setPaymentStatus("");
        setPayee("");
        setPaymentType("");
        setDateRecorded("");
    };
    
    return (
        <div className="bg-[#f5f5f5] w-ful min-h-screen -mx-8 -my-4 p-7">
            <div className="text-5xl font-semibold text-[var(--main)] mb-7">{projectName} Budget Tracker</div>

            {/* summary information + expenses button */}
            <div className="grid grid-cols-4 gap-6 mb-7">
                <div className="bg-white shadow-lg p-2 rounded-lg cursor-pointer" onClick={() =>
                  router.push(`/projects/${projectID}/budget/revenue`)}>     
                    <p className="text-sm">Total Revenue</p>
                    <p className="mt-3 font-bold text-4xl">P{totalRevenue}</p>   
                </div>

                <div className="bg-[#dfebf6] shadow-lg p-2 rounded-lg cursor-pointer" onClick={() =>
                  router.push(`/projects/${projectID}/budget/expenses`)}>
                    <p className="text-sm">Total Expenses</p>
                    <p className="mt-3 font-bold text-4xl">P{totalExpenses}</p>
                </div>

                <div className="bg-white shadow-lg p-2 rounded-lg">
                    <p className="text-sm">Net Income</p>
                    <p className="mt-3 font-bold text-4xl">P{netIncome}</p>
                </div>

                <div className="flex items-center">
                    <button className="btn-primary mt-auto cursor-pointer"  onClick={() => setShowModal(true)}>Add an expense</button>
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

            {/* add expense modal  */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white w-[500px] max-w-[90%] rounded-xl shadow-lg p-6">
                        {/* header */}
                        <div className="flex">
                        <button className="cursor-pointer font-semibold" onClick={() => { 
                            setShowModal(false);
                            setError("");
                            setAmount("");
                            setDescription("");
                            setPaymentStatus("");
                            setPayee("");
                            setPaymentType("");
                            setDateRecorded("");
                        }}>Cancel</button>
                        <button className="cursor-pointer btn-primary ml-auto" onClick={handleAddExpense} disabled={submitting}>{submitting ? "Submitting..." : "Add Expense"}</button>
                        </div>

                        <hr className="mt-3"></hr>
                        
                        {/* content */}
                        
                        <textarea className="w-full p-3 mt-2" placeholder="Enter payee" value={payee} onChange={(e) => setPayee(e.target.value)} rows={1} />
                        <textarea className="w-full p-3 mt-2" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} rows={1} />
                        <textarea className="w-full p-3 mt-2" placeholder="Enter description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={1} />
                        <select id="statusSelect" className="text-[var(--txt-gray)] w-full p-3 mt-2" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                            <option value="">Enter payment status</option>
                            <option className="text-black" value="paid">Paid</option>
                            <option className="text-black" value="outstanding">Outstanding</option>
                            <option className="text-black" value="overdue">Overdue</option>
                        </select>
                
                        <textarea className="w-full p-3 mt-2" placeholder="Enter payment type" value={expenseType} onChange={(e) => setPaymentType(e.target.value)} rows={1} />
                        
                        <div className="flex gap-6">
                            <p className="w-full p-3 mt-2 text-[var(--txt-gray)]">Place date recorded</p>
                            <input type="date" className="px-2" value={dateRecorded} onChange={(e) => setDateRecorded(e.target.value)} />
                        </div>
                        {error && <p className="text-red-500 mt-2">{error}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}