"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from '@/lib/supabase/client'
import { useRouter } from "next/navigation";
import {useParams} from "next/navigation";
import { supabase } from "@/lib/supabaseClient"
import DashboardButton from "@/components/BackToDashboard";

type Revenue = {
    userID: string;
    transactionID: number;
    amount: string;
    description: string;
    dateRecorded: string; 
    paymentStatus: string;
    payer: string;
    revenueType: string
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
    const [revenues, setRevenue] = useState<Revenue[]>([]);
    const [showModal, setShowModal] = useState(false); 
    const [submitting, setSubmitting] = useState(false);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [paymentStatus, setPaymentStatus] = useState(""); 
    const [payer, setPayer] = useState("");
    const [revenueType, setPaymentType] = useState("");
    const [dateRecorded, setDateRecorded] = useState("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [statusFilter, setStatusFilter] = useState("all");
    const [editingTransactionID, setTransactionID] = useState<number | null>(null);


    const formatDate = (dateString) => {
        if (!dateString) return "None";

        const date = new Date(dateString + "T00:00:00");

        if (isNaN(date.getTime())) return "None"; 

        return new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(date);
    };
    
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
    const fetchSummary = async () => {
        const res = await fetch(`/api/projects/${projectID}/budget/summary`);
        const data = await res.json();

        if (!res.ok) {
            setError(data.error);
            return;
        }

        setTotalExpenses(data.totalExpenses);
        setTotalRevenue(data.totalRevenue);
        setNetIncome(data.netIncome);
    };

    useEffect(() => {fetchSummary();}, [projectID]);

    // get revenues details
    const fetchRevenue = async () => {
        const res = await fetch(`/api/projects/${projectID}/budget/revenues`);
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        setRevenue(data);
    };

    useEffect(() => {fetchRevenue();}, [projectID]);

    // add an revenue
    const handleAddExpense = async () => {
        setError("");
        if (!payer) {setError("Payer cannot be null"); return; }
        if (!revenueType) {setError("Payment type cannot be null"); return; }
        if (!paymentStatus) {setError("Payment status cannot be null"); return; }
        if (!amount) {setError("Amount cannot be null"); return; }

        setSubmitting(true);
        const res = await fetch(`/api/projects/${projectID}/budget/revenues`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payer, revenueType, paymentStatus, description, amount, dateRecorded})
        })
        const data = await res.json();
        setSubmitting(false);
        if (!res.ok) {setError(data.error); return; }
        setShowModal(false);
        setAmount("");
        setDescription("");
        setPaymentStatus("");
        setPayer("");
        setPaymentType("");
        setDateRecorded("");
        fetchRevenue();
        fetchSummary();
    };


    // sorting displayed rows depending on status and date order
    const displayedRevenues = useMemo(() => {
        let filtered = [...revenues];

        if (statusFilter !== "all") {
            filtered = filtered.filter(
                (item) => item.paymentStatus.toLowerCase() === statusFilter
            );
        }

        filtered.sort((a, b) => {
            const dateA = new Date(a.dateRecorded).getTime();
            const dateB = new Date(b.dateRecorded).getTime();

            return sortOrder === "asc"
                ? dateA - dateB
                : dateB - dateA;
        });

        return filtered;
    }, [revenues, sortOrder, statusFilter]);

    const toggleDateSort = () => {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    };

    //edit row data
    const saveEdit = async (transactionID:number) => {
        if (!editingTransactionID) return;

        const res = await fetch(
        `/api/projects/${projectID}/budget/revenues/${transactionID}`,
        {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({payer: payer, revenueType: revenueType, dateRecorded: dateRecorded, amount: amount, paymentStatus: paymentStatus}),
        }
        );
        const data = await res.json();
        if (!res.ok) {setError(data.error); return; }
        setTransactionID(null);
        setAmount("");
        setDescription("");
        setPaymentStatus("");
        setPayer("");
        setPaymentType("");
        setDateRecorded("");
        fetchRevenue();
        fetchSummary();
    }

    //delete row data
    async function handleDeleteRevenue(transactionID: number) {
        const res = await fetch(
        `/api/projects/${projectID}/budget/revenues/${transactionID}`,
        {
            method: "DELETE",
        }
        );

        if (!res.ok) {
        const err = await res.json();
        console.error(err)
        return;
        }

        console.log("Deleted successfully")
        fetchRevenue();
        fetchSummary();
    }
    
    return (
        <div className="bg-[#f5f5f5] w-ful min-h-screen -mx-8 -my-4 p-7">
            <div className="text-5xl font-semibold text-[var(--main)] mb-7">
                <DashboardButton projectID={projectID} />
                {projectName} Budget Tracker</div>

            {/* summary information + revenues button */}
            <div className="grid grid-cols-4 gap-6 mb-7">
                <div className="bg-[#dfebf6] shadow-lg p-2 rounded-lg cursor-pointer" onClick={() =>
                  router.push(`/projects/${projectID}/budget/revenues`)}>     
                    <p className="text-sm">Total Revenue</p>
                    <p className="mt-3 font-bold text-4xl">P{totalRevenue}</p>   
                </div>

                <div className="bg-white shadow-lg p-2 rounded-lg cursor-pointer" onClick={() =>
                  router.push(`/projects/${projectID}/budget/expenses`)}>
                    <p className="text-sm">Total Expenses</p>
                    <p className="mt-3 font-bold text-4xl">P{totalExpenses}</p>
                </div>

                <div className="bg-white shadow-lg p-2 rounded-lg">
                    <p className="text-sm">Net Income</p>
                    <p className="mt-3 font-bold text-4xl">P{netIncome}</p>
                </div>

                <div className="flex flex-col items-center gap-3">
                    <select className="bg-white px-3 py-2 rounded-lg shadow" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="outstanding">Outstanding</option>
                        <option value="overdue">Overdue</option>
                    </select>
                    <button className="btn-primary mt-auto cursor-pointer"  onClick={() => setShowModal(true)}>Add an revenue</button>
                </div>
            </div>

            {/* revenue table header */}
            <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_1fr_0.5fr] gap-4 bg-white shadow-lg p-4 rounded-xl text-center items-center font-semibold text-sm text-gray-700">
                <div className="font-semibold text-sm">Payer</div>
                <div className="font-semibold text-sm">Type</div>
                <div className="font-semibold text-sm">
                    <button onClick={toggleDateSort} className="font-semibold text-sm text-left cursor-pointer hover:text-blue-600">
                        Date {sortOrder === "asc" ? "↑" : "↓"}
                    </button>
                </div>
                <div className="font-semibold text-sm">Transaction ID</div>
                <div className="font-semibold text-sm">Total</div>
                <div className="font-semibold text-sm">Status</div>
            </div>

            {/* revenue table details */}
            <div className="mt-5">
                {revenues.length === 0 && !error ? (
                    <p>No revenues listed.</p>
                ) : (
                    displayedRevenues.map((revenue) => (
                        <div key={revenue.transactionID} className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_1fr_0.5fr] gap-4 bg-white p-4 rounded-xl items-center text-center shadow-sm hover:shadow-md transition mb-3">
                            <p>{revenue.payer}</p>
                            <p>{revenue.revenueType}</p>
                            <p>{formatDate(revenue.dateRecorded)}</p>
                            <p>{revenue.transactionID}</p>
                            <p>{revenue.amount}</p>
                            <p>{revenue.paymentStatus}</p>
                             {userID === revenue.userID && (
                                <div className="flex flex-row gap-5 ml-auto justify-center">
                                    <button className="cursor-pointer" onClick={() => { setTransactionID(revenue.transactionID); setPayer(revenue.payer); setPaymentType(revenue.revenueType); setDateRecorded(revenue.dateRecorded); setAmount(revenue.amount); setPaymentStatus(revenue.paymentStatus);}}>
                                        <img src="/edit.svg" width={20} />
                                    </button>
                                    <button className="cursor-pointer" onClick= {() => { handleDeleteRevenue(revenue.transactionID);}}>
                                        <img src="/delete.svg" width={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* add revenue modal  */}
            {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

                <h2 className="text-2xl font-semibold text-[var(--main)] mb-5">Add Revenue</h2>

                <div className="flex flex-col gap-4">

                    <input className="input-field" placeholder="Payer" value={payer} onChange={(e) => setPayer(e.target.value)} />
                    <input className="input-field" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <input className="input-field" placeholder="Revenue Type" value={revenueType} onChange={(e) => setPaymentType(e.target.value)} />
                    <input className="input-field" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />

                    <select className="input-field" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                    <option value="">Select Status</option>
                    <option value="paid">Paid</option>
                    <option value="outstanding">Outstanding</option>
                    <option value="overdue">Overdue</option>
                    </select>

                    <input className="input-field" type="date" value={dateRecorded} onChange={(e) => setDateRecorded(e.target.value)} />

                </div>

                <div className="flex gap-3 pt-5">
                    <button className="cursor-pointer" onClick={() => { setShowModal(false); setError(""); }}>Cancel</button>

                    <button className="btn-primary ml-auto" onClick={handleAddExpense} disabled={submitting}>
                    {submitting ? "Saving..." : "Add Revenue"}
                    </button>
                </div>

                </div>
            </div>
            )}

            {/* editing modal */}
            {editingTransactionID && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

                <h2 className="text-2xl font-semibold text-[var(--main)] mb-5">Edit Revenue</h2>

                <div className="flex flex-col gap-4">

                    <input className="input-field" value={payer} onChange={(e) => setPayer(e.target.value)} />
                    <input className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <input className="input-field" value={revenueType} onChange={(e) => setPaymentType(e.target.value)} />
                    <input className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} />

                    <select className="input-field" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                    <option value="paid">Paid</option>
                    <option value="outstanding">Outstanding</option>
                    <option value="overdue">Overdue</option>
                    </select>

                    <input className="input-field" type="date" value={dateRecorded} onChange={(e) => setDateRecorded(e.target.value)} />

                </div>

                <div className="flex gap-3 pt-5">
                    <button className="cursor-pointer" onClick={() => {
                    setTransactionID(null);
                    setPayer("");
                    setAmount("");
                    setPaymentType("");
                    setDescription("");
                    setPaymentStatus("");
                    setDateRecorded("");
                    }}>
                    Cancel
                    </button>

                    <button className="btn-primary ml-auto" onClick={() => saveEdit(editingTransactionID!)}>
                    Save Changes
                    </button>
                </div>

                </div>
            </div>
            )}
        </div>
    );
}