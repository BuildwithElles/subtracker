-- SubTracker Database Schema

-- Enable RLS (Row Level Security)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- User profiles table for storing user preferences
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  gmail_sync_enabled BOOLEAN DEFAULT false,
  gmail_access_token TEXT,
  gmail_refresh_token TEXT,
  preferred_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  frequency TEXT NOT NULL, -- 'monthly', 'yearly', 'weekly', etc.
  next_charge_date DATE,
  category TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'trial', 'cancelled', 'paused'
  trial_end_date DATE,
  description TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON subscriptions;

-- Users can only see and manage their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Budget profiles table
CREATE TABLE IF NOT EXISTS budget_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  monthly_income DECIMAL(10,2),
  fixed_costs DECIMAL(10,2),
  savings_target DECIMAL(10,2),
  discretionary_budget DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  spending_limit_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on budget_profiles
ALTER TABLE budget_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view own budget" ON budget_profiles;
DROP POLICY IF EXISTS "Users can insert own budget" ON budget_profiles;
DROP POLICY IF EXISTS "Users can update own budget" ON budget_profiles;
DROP POLICY IF EXISTS "Users can delete own budget" ON budget_profiles;

-- Users can only see and manage their own budget
CREATE POLICY "Users can view own budget" ON budget_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budget" ON budget_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budget" ON budget_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budget" ON budget_profiles FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist, then create new ones
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_budget_profiles_updated_at ON budget_profiles;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_profiles_updated_at BEFORE UPDATE ON budget_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end ON subscriptions(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_budget_profiles_user_id ON budget_profiles(user_id);

-- Add alert tables for trial and budget notifications
CREATE TABLE trial_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    trial_end_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    alert_type TEXT NOT NULL CHECK (alert_type IN ('7-day', '3-day', '1-day', 'expired')),
    sent_at TIMESTAMP WITH TIME ZONE,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE budget_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('approaching_limit', 'exceeded_limit', 'weekly_summary')),
    current_spending DECIMAL(10,2) NOT NULL,
    budget_limit DECIMAL(10,2) NOT NULL,
    percentage_used DECIMAL(5,2) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_trial_alerts_user_id ON trial_alerts(user_id);
CREATE INDEX idx_trial_alerts_subscription_id ON trial_alerts(subscription_id);
CREATE INDEX idx_trial_alerts_acknowledged ON trial_alerts(acknowledged);
CREATE INDEX idx_budget_alerts_user_id ON budget_alerts(user_id);
CREATE INDEX idx_budget_alerts_acknowledged ON budget_alerts(acknowledged);

-- RLS policies for trial_alerts
ALTER TABLE trial_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trial alerts" ON trial_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trial alerts" ON trial_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trial alerts" ON trial_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trial alerts" ON trial_alerts
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for budget_alerts
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budget alerts" ON budget_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget alerts" ON budget_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget alerts" ON budget_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget alerts" ON budget_alerts
    FOR DELETE USING (auth.uid() = user_id);

-- Add weekly digest table
CREATE TABLE weekly_digests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_charges DECIMAL(10,2) NOT NULL DEFAULT 0,
    new_subscriptions INTEGER NOT NULL DEFAULT 0,
    cancelled_subscriptions INTEGER NOT NULL DEFAULT 0,
    trial_conversions INTEGER NOT NULL DEFAULT 0,
    budget_usage_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    top_categories JSONB DEFAULT '[]',
    upcoming_trials_ending INTEGER NOT NULL DEFAULT 0,
    upcoming_charges INTEGER NOT NULL DEFAULT 0,
    recommendations JSONB DEFAULT '[]',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for weekly digests
CREATE INDEX idx_weekly_digests_user_id ON weekly_digests(user_id);
CREATE INDEX idx_weekly_digests_week_start ON weekly_digests(week_start);
CREATE INDEX idx_weekly_digests_viewed ON weekly_digests(viewed_at);
CREATE UNIQUE INDEX idx_weekly_digests_user_week ON weekly_digests(user_id, week_start);

-- RLS policies for weekly_digests
ALTER TABLE weekly_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weekly digests" ON weekly_digests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly digests" ON weekly_digests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly digests" ON weekly_digests
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly digests" ON weekly_digests
    FOR DELETE USING (auth.uid() = user_id);

-- Referrals table for tracking referrer codes
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referrer_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own referrals
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own referrals" ON referrals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own referrals" ON referrals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own referrals" ON referrals FOR DELETE USING (auth.uid() = user_id);

-- Index for faster referrer code lookups
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referrer_code);
CREATE INDEX IF NOT EXISTS idx_referrals_user_id ON referrals(user_id);
