-- ============================================
-- Migration 004: Database Indexes
-- ============================================
-- IDEMPOTENT: Uses CREATE INDEX IF NOT EXISTS
-- SAFE: Does not delete any data
-- SAFE: Skips if table/column doesn't exist
-- ============================================

-- Enable trigram extension for fuzzy search (safe if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- PROFILES TABLE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_role
ON profiles(role);

CREATE INDEX IF NOT EXISTS idx_profiles_is_active
ON profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_profiles_email
ON profiles(email);

-- ============================================
-- COTIZACIONES TABLE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_cotizaciones_pipeline_stage
ON cotizaciones(pipeline_stage);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_created_by
ON cotizaciones(created_by);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_assigned_to
ON cotizaciones(assigned_to);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_grupo_id
ON cotizaciones(grupo_id);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_created_at
ON cotizaciones(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha_salida
ON cotizaciones(fecha_salida);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_stage_created
ON cotizaciones(pipeline_stage, created_at DESC);

-- ============================================
-- OPCIONES_COTIZACION TABLE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_opciones_cotizacion_id
ON opciones_cotizacion(cotizacion_id);

CREATE INDEX IF NOT EXISTS idx_opciones_operador_id
ON opciones_cotizacion(operador_id);

-- ============================================
-- COTIZACION_STAGE_HISTORY TABLE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_stage_history_cotizacion_id
ON cotizacion_stage_history(cotizacion_id);

CREATE INDEX IF NOT EXISTS idx_stage_history_changed_at
ON cotizacion_stage_history(changed_at DESC);

-- ============================================
-- VENTAS TABLE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ventas_cotizacion_id
ON ventas(cotizacion_id);

CREATE INDEX IF NOT EXISTS idx_ventas_created_by
ON ventas(created_by);

CREATE INDEX IF NOT EXISTS idx_ventas_estado_venta
ON ventas(estado_venta);

CREATE INDEX IF NOT EXISTS idx_ventas_grupo_id
ON ventas(grupo_id);

CREATE INDEX IF NOT EXISTS idx_ventas_created_at
ON ventas(created_at DESC);

-- ============================================
-- PAGOS TABLE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pagos_venta_id
ON pagos(venta_id);

CREATE INDEX IF NOT EXISTS idx_pagos_estado
ON pagos(estado);

CREATE INDEX IF NOT EXISTS idx_pagos_fecha_programada
ON pagos(fecha_programada);

-- ============================================
-- RECEIPTS TABLE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_receipts_venta_id
ON receipts(venta_id);

CREATE INDEX IF NOT EXISTS idx_receipts_pago_id
ON receipts(pago_id);

CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number
ON receipts(receipt_number);

CREATE INDEX IF NOT EXISTS idx_receipts_created_at
ON receipts(created_at DESC);

-- ============================================
-- GRUPOS TABLE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_grupos_fecha_evento
ON grupos(fecha_evento);

CREATE INDEX IF NOT EXISTS idx_grupos_tipo
ON grupos(tipo);

CREATE INDEX IF NOT EXISTS idx_grupos_created_at
ON grupos(created_at DESC);

-- ============================================
-- OPERADORES TABLE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_operadores_activo
ON operadores(activo);

-- ============================================
-- HOTELES TABLE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_hoteles_nombre
ON hoteles(nombre);

-- Trigram index for fuzzy search (requires pg_trgm extension)
-- This enables fast LIKE '%search%' queries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_hoteles_nombre_trgm'
    ) THEN
        CREATE INDEX idx_hoteles_nombre_trgm
        ON hoteles USING gin (nombre gin_trgm_ops);
        RAISE NOTICE 'Created trigram index on hoteles.nombre';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create trigram index: %', SQLERRM;
END $$;

-- ============================================
-- LANDING_PAGE_CONTENT TABLE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_landing_content_status
ON landing_page_content(status);

CREATE INDEX IF NOT EXISTS idx_landing_content_section
ON landing_page_content(section);

CREATE INDEX IF NOT EXISTS idx_landing_content_section_status
ON landing_page_content(section, status);

-- ============================================
-- ACTIVIDADES TABLE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_actividades_cotizacion_id
ON actividades(cotizacion_id);

CREATE INDEX IF NOT EXISTS idx_actividades_venta_id
ON actividades(venta_id);

CREATE INDEX IF NOT EXISTS idx_actividades_created_at
ON actividades(created_at DESC);

-- Done!
DO $$ BEGIN RAISE NOTICE 'All indexes created successfully'; END $$;
