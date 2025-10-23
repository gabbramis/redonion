-- Create user_plans table to store client subscription/plan information
CREATE TABLE IF NOT EXISTS user_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  plan_tier TEXT NOT NULL,
  billing_type TEXT NOT NULL CHECK (billing_type IN ('monthly', 'annual')),
  price NUMERIC(10, 2) NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'cancelled', 'pending')),
  subscription_id TEXT,
  subscription_start TIMESTAMP WITH TIME ZONE,
  subscription_end TIMESTAMP WITH TIME ZONE,
  billing_frequency INTEGER DEFAULT 1,
  billing_period TEXT DEFAULT 'months' CHECK (billing_period IN ('months', 'years')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Each user can only have one active plan (enforce with unique constraint)
  CONSTRAINT unique_user_plan UNIQUE(user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX idx_user_plans_status ON user_plans(status);
CREATE INDEX idx_user_plans_subscription_id ON user_plans(subscription_id);

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_user_plans_updated_at
    BEFORE UPDATE ON user_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own plan
CREATE POLICY "Users can view their own plan"
  ON user_plans
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert/update plans (for webhooks and admin operations)
-- This allows the webhook to create/update plans using the service role key
CREATE POLICY "Service role can manage all plans"
  ON user_plans
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE user_plans IS 'Stores client subscription and plan information';
COMMENT ON COLUMN user_plans.plan_tier IS 'Plan tier identifier (basico, estandar, premium, test)';
COMMENT ON COLUMN user_plans.billing_type IS 'Billing frequency (monthly or annual)';
COMMENT ON COLUMN user_plans.features IS 'Array of plan features';
COMMENT ON COLUMN user_plans.subscription_id IS 'MercadoPago subscription/payment ID';
COMMENT ON COLUMN user_plans.billing_frequency IS 'Number of billing periods (1 for monthly, 12 for annual)';
