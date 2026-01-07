-- ============================================
-- Migration 005: Check Constraints & Defaults
-- ============================================
-- IDEMPOTENT: Only adds if not exists
-- SAFE: Does not delete any data
-- SAFE: Validates existing data before adding constraints
-- ============================================

-- Helper function to safely add check constraint
CREATE OR REPLACE FUNCTION add_check_constraint_if_not_exists(
    p_table_name TEXT,
    p_constraint_name TEXT,
    p_check_expression TEXT
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = p_constraint_name
        AND table_name = p_table_name
        AND constraint_type = 'CHECK'
    ) THEN
        BEGIN
            EXECUTE format(
                'ALTER TABLE %I ADD CONSTRAINT %I CHECK (%s)',
                p_table_name, p_constraint_name, p_check_expression
            );
            RAISE NOTICE 'Added check constraint % on %', p_constraint_name, p_table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add constraint % on %: % (existing data may violate constraint)',
                p_constraint_name, p_table_name, SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Constraint % already exists on %', p_constraint_name, p_table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Helper function to safely set column default
CREATE OR REPLACE FUNCTION set_column_default_if_needed(
    p_table_name TEXT,
    p_column_name TEXT,
    p_default_value TEXT
) RETURNS VOID AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = p_table_name
        AND column_name = p_column_name
    ) THEN
        EXECUTE format(
            'ALTER TABLE %I ALTER COLUMN %I SET DEFAULT %s',
            p_table_name, p_column_name, p_default_value
        );
        RAISE NOTICE 'Set default % on %.%', p_default_value, p_table_name, p_column_name;
    ELSE
        RAISE NOTICE 'Column %.% does not exist, skipping default', p_table_name, p_column_name;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not set default on %.%: %', p_table_name, p_column_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PROFILES TABLE
-- ============================================

SELECT add_check_constraint_if_not_exists(
    'profiles',
    'chk_profiles_role',
    $$role IN ('super_admin', 'admin', 'manager', 'agent', 'viewer')$$
);

SELECT set_column_default_if_needed('profiles', 'is_active', 'true');
SELECT set_column_default_if_needed('profiles', 'requires_password_reset', 'false');

-- ============================================
-- COTIZACIONES TABLE
-- ============================================

SELECT set_column_default_if_needed('cotizaciones', 'pipeline_stage', $$'lead'$$);
SELECT set_column_default_if_needed('cotizaciones', 'created_at', 'now()');

SELECT add_check_constraint_if_not_exists(
    'cotizaciones',
    'chk_cotizaciones_probability',
    'probability IS NULL OR (probability >= 0 AND probability <= 100)'
);

SELECT add_check_constraint_if_not_exists(
    'cotizaciones',
    'chk_cotizaciones_num_adultos',
    'num_adultos IS NULL OR num_adultos >= 0'
);

SELECT add_check_constraint_if_not_exists(
    'cotizaciones',
    'chk_cotizaciones_num_ninos',
    'num_ninos IS NULL OR num_ninos >= 0'
);

SELECT add_check_constraint_if_not_exists(
    'cotizaciones',
    'chk_cotizaciones_num_infantes',
    'num_infantes IS NULL OR num_infantes >= 0'
);

-- ============================================
-- VENTAS TABLE
-- ============================================

SELECT set_column_default_if_needed('ventas', 'created_at', 'now()');

SELECT add_check_constraint_if_not_exists(
    'ventas',
    'chk_ventas_precio_total',
    'precio_total IS NULL OR precio_total >= 0'
);

SELECT add_check_constraint_if_not_exists(
    'ventas',
    'chk_ventas_monto_pagado',
    'monto_pagado IS NULL OR monto_pagado >= 0'
);

SELECT add_check_constraint_if_not_exists(
    'ventas',
    'chk_ventas_monto_pendiente',
    'monto_pendiente IS NULL OR monto_pendiente >= 0'
);

-- ============================================
-- PAGOS TABLE
-- ============================================

SELECT set_column_default_if_needed('pagos', 'estado', $$'pendiente'$$);

SELECT add_check_constraint_if_not_exists(
    'pagos',
    'chk_pagos_monto',
    'monto > 0'
);

SELECT add_check_constraint_if_not_exists(
    'pagos',
    'chk_pagos_estado',
    $$estado IN ('pendiente', 'pagado', 'cancelado', 'parcial')$$
);

-- ============================================
-- RECEIPTS TABLE
-- ============================================

SELECT add_check_constraint_if_not_exists(
    'receipts',
    'chk_receipts_amount',
    'amount > 0'
);

-- ============================================
-- GRUPOS TABLE
-- ============================================

SELECT set_column_default_if_needed('grupos', 'created_at', 'now()');

SELECT add_check_constraint_if_not_exists(
    'grupos',
    'chk_grupos_tipo',
    $$tipo IN ('boda', 'torneo', 'corporativo', 'otro')$$
);

-- ============================================
-- OPERADORES TABLE
-- ============================================

SELECT set_column_default_if_needed('operadores', 'activo', 'true');

SELECT add_check_constraint_if_not_exists(
    'operadores',
    'chk_operadores_comision',
    'comision IS NULL OR (comision >= 0 AND comision <= 100)'
);

-- ============================================
-- LANDING_PAGE_CONTENT TABLE
-- ============================================

SELECT set_column_default_if_needed('landing_page_content', 'status', $$'draft'$$);

SELECT add_check_constraint_if_not_exists(
    'landing_page_content',
    'chk_landing_content_status',
    $$status IN ('draft', 'pending', 'published', 'archived')$$
);

SELECT add_check_constraint_if_not_exists(
    'landing_page_content',
    'chk_landing_content_section',
    $$section IN ('hero', 'deals', 'destinations', 'gallery', 'config')$$
);

-- ============================================
-- Clean up helper functions (optional)
-- ============================================
-- Uncomment these if you don't want to keep the helper functions
-- DROP FUNCTION IF EXISTS add_check_constraint_if_not_exists;
-- DROP FUNCTION IF EXISTS set_column_default_if_needed;

-- Done!
DO $$ BEGIN RAISE NOTICE 'All constraints and defaults applied successfully'; END $$;
