import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function validateRevenueInput(body: {
  payer?: string;
  revenueType?: string;
  amount?: number | string;
  dateRecorded?: string;
  paymentStatus?: string;
}) {
  const { payer, revenueType, amount, dateRecorded, paymentStatus } = body;

  if (!payer?.trim()) {
    return "Payer is required";
  }

  if (!revenueType?.trim()) {
    return "Revenue type is required";
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

// updates an existing revenue
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
    const validationError = validateRevenueInput(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const {
      payer,
      revenueType,
      amount,
      description,
      dateRecorded,
      paymentStatus,
    } = body;

    console.log("PATCH revenue body:", body);
    console.log("PATCH parsedProjectId:", parsedProjectId);
    console.log("PATCH parsedTransactionId:", parsedTransactionId)

    const { data: updatedTransaction, error: transactionError } = await supabase
      .from("transactions")
      .update({
        amount: Number(amount),
        description: description?.trim() ? description.trim() : null,
        dateRecorded,
        paymentStatus: paymentStatus ?? "paid",
      })
      .eq("transactionID", parsedTransactionId)
      .eq("projectID", parsedProjectId)
      .eq("transactionType", "revenue")
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
        { error: "Revenue not found or Unauthorized" },
        { status: 404 }
      );
    }

    const { error: revenueError } = await supabase
      .from("revenues")
      .update({
        payer: payer.trim(),
        revenueType: revenueType.trim(),
      })
      .eq("transactionID", parsedTransactionId);

    if (revenueError) {
      return NextResponse.json(
        { error: revenueError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Revenue updated successfully" });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update revenue" },
      { status: 500 }
    );
  }
}

// deletes an existing revenue
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
      .eq("transactionType", "revenue")
      .eq("userID", authUser.id)
      .select("transactionID")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!deletedTransaction) {
      return NextResponse.json(
        { error: "Revenue not found or unauthorized"},
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Revenue deleted successfully" });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete revenue" },
      { status: 500 }
    );
  }
}
