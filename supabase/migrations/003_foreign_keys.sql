-- ============================================
-- Migration 003: Foreign Key Constraints
-- ============================================
-- IDEMPOTENT: Only adds constraints if they don't exist
-- SAFE: Does not delete any data
-- SAFE: Skips constraints if columns don't exist
-- ============================================

-- Helper function to safely add foreign key if it doesn't exist
CREATE OR REPLACE FUNCTION add_foreign_key_if_not_exists(
    p_table_name TEXT,
    p_constraint_name TEXT,
    p_column_name TEXT,
    p_ref_table TEXT,
    p_ref_column TEXT,
    p_on_delete TEXT DEFAULT 'SET NULL'
) RETURNS VOID AS $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = p_constraint_name
        AND table_name = p_table_name
    ) THEN
        -- Check if column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = p_table_name
            AND column_name = p_column_name
        ) THEN
            EXECUTE format(
                'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(%I) ON DELETE %s',
                p_table_name, p_constraint_name, p_column_name, p_ref_table, p_ref_column, p_on_delete
            );
            RAISE NOTICE 'Added constraint % on %.%', p_constraint_name, p_table_name, p_column_name;
        ELSE
            RAISE NOTICE 'Skipped % - column %.% does not exist', p_constraint_name, p_table_name, p_column_name;
        END IF;
    ELSE
        RAISE NOTICE 'Constraint % already exists', p_constraint_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COTIZACIONES TABLE
-- ============================================

SELECT add_foreign_key_if_not_exists('cotizaciones', 'fk_cotizaciones_created_by', 'created_by', 'profiles', 'id', 'SET NULL');
SELECT add_foreign_key_if_not_exists('cotizaciones', 'fk_cotizaciones_updated_by', 'updated_by', 'profiles', 'id', 'SET NULL');
SELECT add_foreign_key_if_not_exists('cotizaciones', 'fk_cotizaciones_assigned_to', 'assigned_to', 'profiles', 'id', 'SET NULL');
SELECT add_foreign_key_if_not_exists('cotizaciones', 'fk_cotizaciones_grupo', 'grupo_id', 'grupos', 'id', 'SET NULL');

-- ============================================
-- OPCIONES_COTIZACION TABLE
-- ============================================

SELECT add_foreign_key_if_not_exists('opciones_cotizacion', 'fk_opciones_cotizacion', 'cotizacion_id', 'cotizaciones', 'id', 'CASCADE');
SELECT add_foreign_key_if_not_exists('opciones_cotizacion', 'fk_opciones_operador', 'operador_id', 'operadores', 'id', 'SET NULL');

-- ============================================
-- COTIZACION_STAGE_HISTORY TABLE
-- ============================================

SELECT add_foreign_key_if_not_exists('cotizacion_stage_history', 'fk_stage_history_cotizacion', 'cotizacion_id', 'cotizaciones', 'id', 'CASCADE');
SELECT add_foreign_key_if_not_exists('cotizacion_stage_history', 'fk_stage_history_changed_by', 'changed_by', 'profiles', 'id', 'SET NULL');

-- ============================================
-- VENTAS TABLE
-- ============================================

SELECT add_foreign_key_if_not_exists('ventas', 'fk_ventas_cotizacion', 'cotizacion_id', 'cotizaciones', 'id', 'RESTRICT');
SELECT add_foreign_key_if_not_exists('ventas', 'fk_ventas_created_by', 'created_by', 'profiles', 'id', 'SET NULL');
SELECT add_foreign_key_if_not_exists('ventas', 'fk_ventas_selected_option', 'selected_option_id', 'opciones_cotizacion', 'id', 'SET NULL');
SELECT add_foreign_key_if_not_exists('ventas', 'fk_ventas_grupo', 'grupo_id', 'grupos', 'id', 'SET NULL');

-- ============================================
-- PAGOS TABLE
-- ============================================

SELECT add_foreign_key_if_not_exists('pagos', 'fk_pagos_venta', 'venta_id', 'ventas', 'id', 'CASCADE');
SELECT add_foreign_key_if_not_exists('pagos', 'fk_pagos_registrado_por', 'registrado_por', 'profiles', 'id', 'SET NULL');

-- ============================================
-- RECEIPTS TABLE
-- ============================================

SELECT add_foreign_key_if_not_exists('receipts', 'fk_receipts_venta', 'venta_id', 'ventas', 'id', 'SET NULL');
SELECT add_foreign_key_if_not_exists('receipts', 'fk_receipts_pago', 'pago_id', 'pagos', 'id', 'SET NULL');
SELECT add_foreign_key_if_not_exists('receipts', 'fk_receipts_created_by', 'created_by', 'profiles', 'id', 'SET NULL');

-- ============================================
-- ACTIVIDADES TABLE
-- ============================================

SELECT add_foreign_key_if_not_exists('actividades', 'fk_actividades_cotizacion', 'cotizacion_id', 'cotizaciones', 'id', 'CASCADE');
SELECT add_foreign_key_if_not_exists('actividades', 'fk_actividades_venta', 'venta_id', 'ventas', 'id', 'CASCADE');
SELECT add_foreign_key_if_not_exists('actividades', 'fk_actividades_created_by', 'created_by', 'profiles', 'id', 'SET NULL');

-- ============================================
-- LANDING_PAGE_CONTENT TABLE
-- ============================================

SELECT add_foreign_key_if_not_exists('landing_page_content', 'fk_landing_content_created_by', 'created_by', 'profiles', 'id', 'SET NULL');
SELECT add_foreign_key_if_not_exists('landing_page_content', 'fk_landing_content_approved_by', 'approved_by', 'profiles', 'id', 'SET NULL');

-- Clean up helper function (optional - you can keep it for future use)
-- DROP FUNCTION IF EXISTS add_foreign_key_if_not_exists;

-- Done!
DO $$ BEGIN RAISE NOTICE 'Foreign key migration completed'; END $$;
