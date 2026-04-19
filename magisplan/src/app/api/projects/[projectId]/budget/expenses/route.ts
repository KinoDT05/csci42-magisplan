import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function validateExpenseInput(body: {
  payee?: string;
  expenseType?: string;
  amount?: number | string;
  dateRecorded?: string;
  paymentStatus?: string;
}) {
  const { payee, expenseType, amount, dateRecorded, paymentStatus } = body;

  if (!payee?.trim()) {
    return "Payee is required";
  }

  if (!expenseType?.trim()) {
    return "Expense type is required";
  }

  if (!dateRecorded) {
    return "Date recorded is required";
  }

  if (amount == null || amount === "") {
    return "Amount is required";
  }

  const parsedAmount = Number(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
    return "Amount must be a valid non-negative number";
  }

  if (
    paymentStatus &&
    !["outstanding", "paid", "overdue"].includes(paymentStatus)
  ) {
    return "Invalid payment status";
  }

  return null;
}

// gets all expense entries of the project
export async function GET(_request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  try {
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

    const parsedProjectId = Number(projectId);
    if (Number.isNaN(parsedProjectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("transactions")
      .select(`
        transactionID,
        projectID,
        userID,
        amount,
        description,
        dateRecorded,
        paymentStatus,
        transactionType,
        expenses (
          payee,
          expenseType
        )
      `)
      .eq("projectID", parsedProjectId)
      .eq("transactionType", "expense")
      .order("dateRecorded", { ascending: false });
    
    console.log("expenses route error:", error);
    console.log("raw expenses query result:", JSON.stringify(data, null, 2));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (data ?? []).map((row) => {
      const expense = Array.isArray(row.expenses)
        ? row.expenses[0]
        : row.expenses;

      return {
        transactionID: row.transactionID,
        projectID: row.projectID,
        userID: row.userID,
        amount: row.amount,
        description: row.description,
        dateRecorded: row.dateRecorded,
        paymentStatus: row.paymentStatus,
        transactionType: row.transactionType,
        payee: expense?.payee ?? null,
        expenseType: expense?.expenseType ?? null,
      };
    });

    return NextResponse.json(formatted);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch expenses." },
      { status: 500 }
    );
  }
}

// adds a new expense entry to the project
export async function POST(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  try {
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

    const parsedProjectId = Number(projectId);
    if (Number.isNaN(parsedProjectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const body = await request.json();
    const validationError = validateExpenseInput(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const {
      payee,
      expenseType,
      amount,
      description,
      dateRecorded,
      paymentStatus,
    } = body;

    const parsedAmount = Number(amount);

    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        projectID: parsedProjectId,
        userID: authUser.id,
        amount: parsedAmount,
        description: description?.trim() ? description.trim() : null,
        dateRecorded,
        paymentStatus: paymentStatus ?? "paid",
        transactionType: "expense",
      })
      .select("transactionID")
      .single();

    if (transactionError) {
      return NextResponse.json(
        { error: transactionError.message },
        { status: 500 }
      );
    }

    const { error: expenseError } = await supabase.from("expenses").insert({
      transactionID: transaction.transactionID,
      payee: payee.trim(),
      expenseType: expenseType.trim(),
    });

    if (expenseError) {
      await supabase
        .from("transactions")
        .delete()
        .eq("transactionID", transaction.transactionID)
        .eq("userID", authUser.id);

      return NextResponse.json(
        { error: expenseError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Expense added successfully",
        transactionID: transaction.transactionID,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to add expense" },
      { status: 500 }
    );
  }
}
