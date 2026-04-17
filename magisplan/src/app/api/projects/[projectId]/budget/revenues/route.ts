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

// gets all revenue entries of the project
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
        revenues (
          payer,
          revenueType
        )
      `)
      .eq("projectID", parsedProjectId)
      .eq("transactionType", "revenue")
      .order("dateRecorded", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (data ?? []).map((row) => {
      const revenue = Array.isArray(row.revenues)
        ? row.revenues[0]
        : row.revenues;

      return {
        transactionID: row.transactionID,
        projectID: row.projectID,
        userID: row.userID,
        amount: row.amount,
        description: row.description,
        dateRecorded: row.dateRecorded,
        paymentStatus: row.paymentStatus,
        transactionType: row.transactionType,
        payer: revenue?.payer ?? null,
        revenueType: revenue?.revenueType ?? null,
      };
    });

    return NextResponse.json(formatted);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch revenues." },
      { status: 500 }
    );
  }
}

// adds a new revenue entry to the project
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
    const validationError = validateRevenueInput(body);

    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    const {
      payer,
      revenueType,
      amount,
      description,
      dateRecorded,
      paymentStatus,
    } = body;

    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        projectID: parsedProjectId,
        userID: authUser.id,
        amount: Number(amount),
        description: description?.trim() ? description.trim() : null,
        dateRecorded,
        paymentStatus: paymentStatus ?? "paid",
        transactionType: "revenue",
      })
      .select("transactionID")
      .single();

    if (transactionError) {
      return NextResponse.json(
        { error: transactionError.message },
        { status: 500 }
      );
    }

    const { error: revenueError } = await supabase
      .from("revenues")
      .insert({
        transactionID: transaction.transactionID,
        payer: payer.trim(),
        revenueType: revenueType.trim(),
      });

    if (revenueError) {
      await supabase
        .from("transactions")
        .delete()
        .eq("transactionID", transaction.transactionID)
        .eq("userID", authUser.id);

      return NextResponse.json(
        { error: revenueError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Revenue added successfully",
        transactionID: transaction.transactionID,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to add revenues" },
      { status: 500 }
    );
  }
}
