-- Migration: Add created_at column to otp_codes table
-- Date: 2026-05-07
-- Description: Add created_at timestamp to track when OTP was created for rate limiting

-- Add created_at column with default value
ALTER TABLE public.otp_codes
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW() NOT NULL;

-- Create index for better performance on rate limit queries
CREATE INDEX IF NOT EXISTS idx_otp_codes_created_at ON public.otp_codes(created_at);

-- Update existing records to set created_at from expires_at (subtract 5 minutes)
UPDATE public.otp_codes
SET created_at = expires_at - INTERVAL '5 minutes'
WHERE created_at IS NULL;

-- Add index on expires_at if not exists (for better query performance)
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);

-- Comments
COMMENT ON COLUMN public.otp_codes.created_at IS 'Timestamp when OTP code was generated';
