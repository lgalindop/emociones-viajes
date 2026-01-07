-- ============================================
-- Migration 001: Enable Row Level Security
-- ============================================
-- SAFE: Enabling RLS when already enabled is a no-op
-- SAFE: Does not delete any data
-- ============================================

DO $$
BEGIN
    -- Enable RLS on all application tables (safe if already enabled)
    ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS cotizaciones ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS opciones_cotizacion ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS cotizacion_stage_history ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS ventas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS pagos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS receipts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS grupos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS operadores ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS hoteles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS company_settings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS landing_page_content ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS actividades ENABLE ROW LEVEL SECURITY;

    RAISE NOTICE 'RLS enabled on all tables';
END $$;
