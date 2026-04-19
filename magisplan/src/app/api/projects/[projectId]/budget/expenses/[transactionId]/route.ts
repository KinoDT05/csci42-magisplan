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

// updates an existing expense
export async function PATCH(request: NextRequest, context: { params: Promise<{ projectId: string; transactionId: string }> }) {
  try {
    const supabase = await createClient();
    const { projectId, transactionId } = await context.params;

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
    const parsedTransactionId = Number(transactionId);

    if (Number.isNaN(parsedProjectId) || Number.isNaN(parsedTransactionId)) {
      return NextResponse.json(
        { error: "Invalid project or transaction ID" },
        { status: 400 }
      );
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

    const { data: updatedTransaction, error: transactionError } = await supabase
      .from("transactions")
      .update({
        amount: parsedAmount,
        description: description?.trim() ? description.trim() : null,
        dateRecorded,
        paymentStatus: paymentStatus ?? "paid",
      })
      .eq("transactionID", parsedTransactionId)
      .eq("projectID", parsedProjectId)
      .eq("transactionType", "expense")
      .eq("userID", authUser.id)
      .select("transactionID")
      .maybeSingle();

    if (transactionError) {
      return NextResponse.json(
        { error: transactionError.message },
        { status: 500 }
      );
    }

    if (!updatedTransaction) {
      return NextResponse.json(
        { error: "Expense not found or unauthorized" },
        { status: 404 }
      );
    }

    const { error: expenseError } = await supabase
      .from("expenses")
      .update({
        payee: payee.trim(),
        expenseType: expenseType.trim(),
      })
      .eq("transactionID", parsedTransactionId);

    if (expenseError) {
      return NextResponse.json(
        { error: expenseError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Expense updated successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

// deletes an existing expense
export async function DELETE(_request: NextRequest, context: { params: Promise<{ projectId: string; transactionId: string }> }) {
  try {
    const supabase = await createClient();
    const { projectId, transactionId } = await context.params;

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
    const parsedTransactionId = Number(transactionId);

    if (Number.isNaN(parsedProjectId) || Number.isNaN(parsedTransactionId)) {
      return NextResponse.json(
        { error: "Invalid project or transaction ID" },
        { status: 400 }
      );
    }

    const { data: deletedTransaction, error } = await supabase
      .from("transactions")
      .delete()
      .eq("transactionID", parsedTransactionId)
      .eq("projectID", parsedProjectId)
      .eq("transactionType", "expense")
      .eq("userID", authUser.id)
      .select("transactionID")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!deletedTransaction) {
      return NextResponse.json(
        { error: "Expense not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
