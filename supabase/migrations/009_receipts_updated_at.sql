-- ============================================
-- Migration 009: Add updated_at to receipts table
-- ============================================
-- This fixes the error: record "new" has no field "updated_at"
-- which occurs when a trigger references updated_at but the column doesn't exist
-- ============================================

-- Add updated_at column to receipts
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger to auto-update updated_at on receipts
DROP TRIGGER IF EXISTS update_receipts_updated_at ON receipts;
CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Done
DO $$ BEGIN RAISE NOTICE 'Added updated_at column and trigger to receipts table'; END $$;
