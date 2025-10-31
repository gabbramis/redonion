-- Create invoices table to store manual billing records
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),

  -- Plan details
  plan_name TEXT NOT NULL,
  plan_tier TEXT NOT NULL,
  billing_type TEXT NOT NULL CHECK (billing_type IN ('monthly', 'annual')),
  billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Payment details
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  payment_notes TEXT,

  -- Invoice notes
  notes TEXT,
  admin_notes TEXT, -- Private notes for admins

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date DESC);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own invoices
CREATE POLICY "Users can view their own invoices"
  ON invoices
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all invoices (for admin operations)
CREATE POLICY "Service role can manage all invoices"
  ON invoices
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE invoices IS 'Stores manual invoices/bills for client subscriptions';
COMMENT ON COLUMN invoices.invoice_number IS 'Unique invoice number (e.g., INV-2025-001)';
COMMENT ON COLUMN invoices.status IS 'Invoice status: pending, paid, overdue, cancelled';
COMMENT ON COLUMN invoices.billing_period_start IS 'Start date of the billing period';
COMMENT ON COLUMN invoices.billing_period_end IS 'End date of the billing period';
COMMENT ON COLUMN invoices.admin_notes IS 'Private notes visible only to admins';
