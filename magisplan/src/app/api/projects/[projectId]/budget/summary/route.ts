import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  try {
    console.log("Summary route hit");

    const supabase = await createClient();
    const { projectId } = await context.params;

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("projectId:", projectId);

    // validates the project ID
    const parsedProjectId = Number(projectId);
    if (Number.isNaN(parsedProjectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("amount, transactionType")
      .eq("projectID", parsedProjectId);

    console.log("transactions:", transactions);
    console.log("error:", error);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // takes an array of revenues and combines in into one final sum
    const totalRevenue =
      transactions
        ?.filter((t) => t.transactionType === "revenue")
        .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

    // takes an array of expenses and combines in into one final sum
    const totalExpenses =
      transactions
        ?.filter((t) => t.transactionType === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

    const netIncome = totalRevenue - totalExpenses;

    return NextResponse.json({
      totalRevenue,
      totalExpenses,
      netIncome,
    });
  } catch (err) {
    console.error("Summary route failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch budget summary" },
      { status: 500 }
    );
  }
}
