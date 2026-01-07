# Database Migrations

These SQL files are **idempotent** and **safe** - you can run them multiple times without issues.

## Safety Guarantees

- **Will NOT delete any data**
- **Will NOT fail if run multiple times**
- **Will skip constraints that already exist**
- **Will skip if columns/tables don't exist**
- **Will report what it did via NOTICE messages**

## How to Run

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy/paste each file's contents
3. Click **Run**
4. Check the "Messages" tab for status

Run in order: `001` → `002` → `003` → `004` → `005`

> **Important:** Run `001` and `002` together - after enabling RLS, tables are locked until policies are added.

## Migration Files

| File | What it does | Safe to re-run? |
|------|--------------|-----------------|
| `001_enable_rls.sql` | Enables Row Level Security | Yes (no-op if already enabled) |
| `002_rls_policies.sql` | Creates access policies | Yes (drops and recreates) |
| `003_foreign_keys.sql` | Adds referential integrity | Yes (skips if exists) |
| `004_indexes.sql` | Creates performance indexes | Yes (IF NOT EXISTS) |
| `005_constraints.sql` | Adds validation rules | Yes (skips if exists, warns on violation) |

## What to Expect

### Success Messages
```
NOTICE: Added constraint fk_cotizaciones_grupo on cotizaciones.grupo_id
NOTICE: Constraint fk_ventas_cotizacion already exists
NOTICE: Set default 'lead' on cotizaciones.pipeline_stage
```

### Skip Messages
```
NOTICE: Skipped fk_xyz - column table.column does not exist
NOTICE: Column xyz does not exist, skipping default
```

### Warning Messages (data violates constraint)
```
NOTICE: Could not add constraint chk_pagos_monto on pagos:
        (existing data may violate constraint)
```
This means you have existing data with `monto <= 0`. You can either:
1. Fix the data: `UPDATE pagos SET monto = 1 WHERE monto <= 0`
2. Skip that constraint

## Verifying Results

After running, verify with:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies exist
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Check foreign keys
SELECT conname, conrelid::regclass FROM pg_constraint WHERE contype = 'f';

-- Check indexes
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';
```

## Rollback (if needed)

```sql
-- Disable RLS on a table
ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;

-- Remove a policy
DROP POLICY IF EXISTS "policy name" ON tablename;

-- Remove a foreign key
ALTER TABLE tablename DROP CONSTRAINT IF EXISTS constraint_name;

-- Remove an index
DROP INDEX IF EXISTS index_name;

-- Remove a check constraint
ALTER TABLE tablename DROP CONSTRAINT IF EXISTS constraint_name;
```
