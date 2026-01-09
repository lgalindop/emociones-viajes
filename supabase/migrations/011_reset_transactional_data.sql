-- ============================================================================
-- Migration: 011_reset_transactional_data.sql
-- Description: Reset all transactional data to start fresh with clean counts
--
-- KEEPS: clientes, cliente_relaciones, operadores, hoteles, profiles,
--        grupos, landing_page_content, company_settings
--
-- DELETES: All cotizaciones, ventas, pagos, receipts, viajeros, actividades,
--          tareas, seguimiento_cotizaciones, cotizacion_stage_history,
--          hotel-related data (contactos, habitaciones, operadores, temporadas)
--
-- RESETS: Folio counters will restart from 0001 automatically
-- ============================================================================

-- Safety check: Display counts before deletion
DO $$
DECLARE
  v_cotizaciones_count INT;
  v_ventas_count INT;
  v_pagos_count INT;
  v_receipts_count INT;
  v_viajeros_count INT;
  v_actividades_count INT;
  v_tareas_count INT;
  v_hotel_contactos_count INT;
  v_hotel_habitaciones_count INT;
  v_hotel_operadores_count INT;
  v_hotel_temporadas_count INT;
BEGIN
  -- Count records before deletion
  SELECT COUNT(*) INTO v_cotizaciones_count FROM cotizaciones;
  SELECT COUNT(*) INTO v_ventas_count FROM ventas;
  SELECT COUNT(*) INTO v_pagos_count FROM pagos;
  SELECT COUNT(*) INTO v_receipts_count FROM receipts;
  SELECT COUNT(*) INTO v_viajeros_count FROM viajeros;
  SELECT COUNT(*) INTO v_actividades_count FROM actividades;
  SELECT COUNT(*) INTO v_tareas_count FROM tareas;
  SELECT COUNT(*) INTO v_hotel_contactos_count FROM hotel_contactos;
  SELECT COUNT(*) INTO v_hotel_habitaciones_count FROM hotel_habitaciones;
  SELECT COUNT(*) INTO v_hotel_operadores_count FROM hotel_operadores;
  SELECT COUNT(*) INTO v_hotel_temporadas_count FROM hotel_temporadas;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'DELETING TRANSACTIONAL DATA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Cotizaciones: %', v_cotizaciones_count;
  RAISE NOTICE 'Ventas: %', v_ventas_count;
  RAISE NOTICE 'Pagos: %', v_pagos_count;
  RAISE NOTICE 'Receipts: %', v_receipts_count;
  RAISE NOTICE 'Viajeros: %', v_viajeros_count;
  RAISE NOTICE 'Actividades: %', v_actividades_count;
  RAISE NOTICE 'Tareas: %', v_tareas_count;
  RAISE NOTICE 'Hotel Contactos: %', v_hotel_contactos_count;
  RAISE NOTICE 'Hotel Habitaciones: %', v_hotel_habitaciones_count;
  RAISE NOTICE 'Hotel Operadores: %', v_hotel_operadores_count;
  RAISE NOTICE 'Hotel Temporadas: %', v_hotel_temporadas_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 1. DELETE HOTEL-RELATED DATA
-- ============================================================================

-- Delete hotel seasons (no dependencies)
DELETE FROM hotel_temporadas;

-- Delete hotel operators (no dependencies)
DELETE FROM hotel_operadores;

-- Delete hotel rooms (no dependencies)
DELETE FROM hotel_habitaciones;

-- Delete hotel contacts (no dependencies)
DELETE FROM hotel_contactos;

-- ============================================================================
-- 2. DELETE TRANSACTIONAL DATA (in correct order)
-- ============================================================================

-- Delete receipts (depends on: pagos, ventas)
DELETE FROM receipts;

-- Delete pagos (depends on: ventas)
DELETE FROM pagos;

-- Delete viajeros (depends on: ventas)
DELETE FROM viajeros;

-- Delete actividades (depends on: cotizaciones, ventas)
DELETE FROM actividades;

-- Delete tareas (depends on: cotizaciones, ventas)
DELETE FROM tareas;

-- Delete ventas (depends on: cotizaciones, opciones_cotizacion)
DELETE FROM ventas;

-- Delete opciones_cotizacion (depends on: cotizaciones)
DELETE FROM opciones_cotizacion;

-- Delete seguimiento_cotizaciones (depends on: cotizaciones)
DELETE FROM seguimiento_cotizaciones;

-- Delete cotizacion_stage_history (depends on: cotizaciones)
DELETE FROM cotizacion_stage_history;

-- Delete cotizaciones (base table)
DELETE FROM cotizaciones;

-- ============================================================================
-- 3. VERIFICATION - Display final counts
-- ============================================================================

DO $$
DECLARE
  v_cotizaciones_count INT;
  v_ventas_count INT;
  v_pagos_count INT;
  v_receipts_count INT;
  v_viajeros_count INT;
  v_hotel_contactos_count INT;
  v_clientes_count INT;
  v_operadores_count INT;
  v_hoteles_count INT;
  v_profiles_count INT;
  v_grupos_count INT;
BEGIN
  -- Verify deletions
  SELECT COUNT(*) INTO v_cotizaciones_count FROM cotizaciones;
  SELECT COUNT(*) INTO v_ventas_count FROM ventas;
  SELECT COUNT(*) INTO v_pagos_count FROM pagos;
  SELECT COUNT(*) INTO v_receipts_count FROM receipts;
  SELECT COUNT(*) INTO v_viajeros_count FROM viajeros;
  SELECT COUNT(*) INTO v_hotel_contactos_count FROM hotel_contactos;

  -- Verify preserved data
  SELECT COUNT(*) INTO v_clientes_count FROM clientes;
  SELECT COUNT(*) INTO v_operadores_count FROM operadores;
  SELECT COUNT(*) INTO v_hoteles_count FROM hoteles;
  SELECT COUNT(*) INTO v_profiles_count FROM profiles;
  SELECT COUNT(*) INTO v_grupos_count FROM grupos;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'DELETED (should all be 0):';
  RAISE NOTICE '  Cotizaciones: %', v_cotizaciones_count;
  RAISE NOTICE '  Ventas: %', v_ventas_count;
  RAISE NOTICE '  Pagos: %', v_pagos_count;
  RAISE NOTICE '  Receipts: %', v_receipts_count;
  RAISE NOTICE '  Viajeros: %', v_viajeros_count;
  RAISE NOTICE '  Hotel Contactos: %', v_hotel_contactos_count;
  RAISE NOTICE '';
  RAISE NOTICE 'PRESERVED:';
  RAISE NOTICE '  Clientes: %', v_clientes_count;
  RAISE NOTICE '  Operadores: %', v_operadores_count;
  RAISE NOTICE '  Hoteles: %', v_hoteles_count;
  RAISE NOTICE '  Usuarios (Profiles): %', v_profiles_count;
  RAISE NOTICE '  Grupos: %', v_grupos_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Next folio numbers will start at:';
  RAISE NOTICE '  COT-0001 (Cotizaciones)';
  RAISE NOTICE '  V-2026-0001 (Ventas, year-based)';
  RAISE NOTICE '  REC-2026-00001 (Receipts, year-based)';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 4. REFRESH MATERIALIZED VIEWS (if they exist)
-- ============================================================================

-- Refresh views to reflect the reset data
DO $$
BEGIN
  -- Refresh agent_performance if it exists
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'agent_performance') THEN
    REFRESH MATERIALIZED VIEW agent_performance;
  END IF;

  -- Refresh pipeline_summary if it exists
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'pipeline_summary') THEN
    REFRESH MATERIALIZED VIEW pipeline_summary;
  END IF;

  -- Refresh sales_performance if it exists
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'sales_performance') THEN
    REFRESH MATERIALIZED VIEW sales_performance;
  END IF;
END $$;

-- ============================================================================
-- NOTES:
--
-- 1. Folio Generation:
--    - cotizaciones.folio: Auto-generated by generate_folio() trigger (COT-0001)
--    - ventas.folio_venta: Auto-generated by generate_folio_venta() trigger (V-YYYY-0001)
--    - receipts.receipt_number: Auto-generated by generate_receipt_number() (REC-YYYY-00001)
--    - All will start from 0001 after this reset
--
-- 2. Foreign Key Constraints:
--    - Deletion order respects all foreign key dependencies
--    - No CASCADE needed as we delete in correct order
--
-- 3. Preserved Data:
--    - clientes and cliente_relaciones (customer data)
--    - operadores (tour operators)
--    - hoteles (hotel base data, but contacts/rooms/seasons deleted)
--    - profiles (users)
--    - grupos (groups)
--    - landing_page_content (CMS content)
--    - company_settings (company configuration)
--
-- 4. Safety:
--    - This migration can be run multiple times safely
--    - All DELETE operations are unconditional (delete all)
--    - No data is modified, only deleted
--
-- ============================================================================
