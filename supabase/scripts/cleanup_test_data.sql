-- ============================================================================
-- Script: cleanup_test_data.sql
-- Description: Clean up test data while preserving master data
-- Keeps: clientes, cliente_relaciones, hoteles, grupos, operadores
-- Removes: cotizaciones, ventas, viajeros, pagos, receipts, etc.
--
-- WARNING: This will DELETE data permanently. Run with caution!
-- ============================================================================

-- IMPORTANT: Run this in order due to foreign key constraints

-- 1. Delete receipts (depends on ventas/pagos)
DELETE FROM receipts;

-- 2. Delete viajeros (depends on ventas)
DELETE FROM viajeros;

-- 3. Delete pagos (depends on ventas)
DELETE FROM pagos;

-- 4. Delete ventas (depends on cotizaciones)
DELETE FROM ventas;

-- 5. Delete cotizacion_stage_history (depends on cotizaciones)
DELETE FROM cotizacion_stage_history;

-- 6. Delete cotizacion_options (depends on cotizaciones)
DELETE FROM cotizacion_options;

-- 7. Delete cotizaciones
DELETE FROM cotizaciones;

-- 8. Reset cliente metrics (since we deleted their cotizaciones/ventas)
UPDATE clientes SET
  total_cotizaciones = 0,
  total_ventas = 0,
  total_ingresos = 0,
  ultima_interaccion = NULL;

-- 9. Clear any orphaned cliente_id references on clientes table
-- (referido_por stays since it points to other clientes)

-- Verify what remains
SELECT 'clientes' as table_name, COUNT(*) as count FROM clientes
UNION ALL SELECT 'cliente_relaciones', COUNT(*) FROM cliente_relaciones
UNION ALL SELECT 'hoteles', COUNT(*) FROM hoteles
UNION ALL SELECT 'grupos', COUNT(*) FROM grupos
UNION ALL SELECT 'operadores', COUNT(*) FROM operadores
UNION ALL SELECT 'cotizaciones', COUNT(*) FROM cotizaciones
UNION ALL SELECT 'ventas', COUNT(*) FROM ventas
UNION ALL SELECT 'viajeros', COUNT(*) FROM viajeros
UNION ALL SELECT 'pagos', COUNT(*) FROM pagos
UNION ALL SELECT 'receipts', COUNT(*) FROM receipts;
