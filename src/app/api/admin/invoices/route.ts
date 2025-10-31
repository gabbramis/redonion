import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET - Fetch invoices for a user
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", userId)
      .order("invoice_date", { ascending: false });

    if (error) {
      console.error("❌ Error fetching invoices:", error);
      return NextResponse.json(
        { error: "Failed to fetch invoices", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("❌ GET invoices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new invoice
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      amount,
      planName,
      planTier,
      billingType,
      billingPeriodStart,
      billingPeriodEnd,
      dueDate,
      notes,
      adminNotes,
    } = body;

    // Validate required fields
    if (!userId || !amount || !planName || !planTier || !billingType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate invoice number (format: INV-YYYY-NNN)
    const year = new Date().getFullYear();
    const { data: latestInvoice } = await supabase
      .from("invoices")
      .select("invoice_number")
      .like("invoice_number", `INV-${year}-%`)
      .order("invoice_number", { ascending: false })
      .limit(1)
      .single();

    let invoiceNumber;
    if (latestInvoice) {
      const lastNumber = parseInt(latestInvoice.invoice_number.split("-")[2]);
      invoiceNumber = `INV-${year}-${String(lastNumber + 1).padStart(3, "0")}`;
    } else {
      invoiceNumber = `INV-${year}-001`;
    }

    const invoiceData = {
      user_id: userId,
      invoice_number: invoiceNumber,
      invoice_date: new Date().toISOString(),
      due_date: dueDate || billingPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Use billing period end or 30 days from now
      amount: parseFloat(amount),
      currency: "USD",
      status: "pending",
      plan_name: planName,
      plan_tier: planTier,
      billing_type: billingType,
      billing_period_start: billingPeriodStart || new Date().toISOString(),
      billing_period_end: billingPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: notes || null,
      admin_notes: adminNotes || null,
    };

    const { data: createdInvoice, error } = await supabase
      .from("invoices")
      .insert(invoiceData)
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating invoice:", error);
      return NextResponse.json(
        { error: "Failed to create invoice", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice: createdInvoice,
    });
  } catch (error) {
    console.error("❌ POST invoice error:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update invoice (mark as paid, etc.)
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { invoiceId, status, paymentDate, paymentMethod, paymentNotes } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoiceId is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, string | null> = {};

    if (status) updateData.status = status;
    if (paymentDate) updateData.payment_date = paymentDate;
    if (paymentMethod) updateData.payment_method = paymentMethod;
    if (paymentNotes !== undefined) updateData.payment_notes = paymentNotes;

    const { data: updatedInvoice, error } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", invoiceId)
      .select()
      .single();

    if (error) {
      console.error("❌ Error updating invoice:", error);
      return NextResponse.json(
        { error: "Failed to update invoice", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("❌ PATCH invoice error:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete an invoice
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId");

    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoiceId is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId);

    if (error) {
      console.error("❌ Error deleting invoice:", error);
      return NextResponse.json(
        { error: "Failed to delete invoice", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("❌ DELETE invoice error:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
