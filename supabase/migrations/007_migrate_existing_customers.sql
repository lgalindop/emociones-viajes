-- ============================================================================
-- Migration: 007_migrate_existing_customers.sql
-- Description: Extract unique customers from cotizaciones and link them
-- Run this AFTER 006_clientes_crm.sql
-- ============================================================================

-- Step 1: Insert unique customers from cotizaciones
-- Deduplicates by phone number (primary) or email (secondary)
INSERT INTO clientes (nombre_completo, telefono, email, created_at)
SELECT DISTINCT ON (COALESCE(NULLIF(cliente_telefono, ''), cliente_email, cliente_nombre))
  cliente_nombre,
  NULLIF(cliente_telefono, ''),
  NULLIF(cliente_email, ''),
  MIN(created_at) OVER (PARTITION BY COALESCE(NULLIF(cliente_telefono, ''), cliente_email, cliente_nombre))
FROM cotizaciones
WHERE cliente_nombre IS NOT NULL
  AND cliente_nombre != ''
  AND NOT EXISTS (
    -- Skip if already migrated (phone or email match)
    SELECT 1 FROM clientes c
    WHERE (c.telefono IS NOT NULL AND c.telefono = cotizaciones.cliente_telefono)
       OR (c.email IS NOT NULL AND c.email = cotizaciones.cliente_email)
  )
ORDER BY COALESCE(NULLIF(cliente_telefono, ''), cliente_email, cliente_nombre), created_at ASC;

-- Step 2: Link cotizaciones to clientes by phone (most reliable)
UPDATE cotizaciones c
SET cliente_id = cl.id
FROM clientes cl
WHERE c.cliente_id IS NULL
  AND c.cliente_telefono IS NOT NULL
  AND c.cliente_telefono != ''
  AND cl.telefono = c.cliente_telefono;

-- Step 3: Link remaining cotizaciones by email
UPDATE cotizaciones c
SET cliente_id = cl.id
FROM clientes cl
WHERE c.cliente_id IS NULL
  AND c.cliente_email IS NOT NULL
  AND c.cliente_email != ''
  AND cl.email = c.cliente_email;

-- Step 4: Link remaining cotizaciones by exact name match (last resort)
UPDATE cotizaciones c
SET cliente_id = cl.id
FROM clientes cl
WHERE c.cliente_id IS NULL
  AND c.cliente_nombre IS NOT NULL
  AND cl.nombre_completo = c.cliente_nombre;

-- Step 5: Update cliente metrics based on linked cotizaciones
UPDATE clientes cl
SET
  total_cotizaciones = (
    SELECT COUNT(*) FROM cotizaciones WHERE cliente_id = cl.id
  ),
  ultima_interaccion = (
    SELECT MAX(created_at) FROM cotizaciones WHERE cliente_id = cl.id
  );

-- Step 6: Update cliente metrics for ventas (through cotizaciones)
UPDATE clientes cl
SET
  total_ventas = COALESCE((
    SELECT COUNT(*) FROM ventas v
    JOIN cotizaciones c ON v.cotizacion_id = c.id
    WHERE c.cliente_id = cl.id
  ), 0),
  total_ingresos = COALESCE((
    SELECT SUM(v.precio_total) FROM ventas v
    JOIN cotizaciones c ON v.cotizacion_id = c.id
    WHERE c.cliente_id = cl.id
  ), 0);

-- Report results
DO $$
DECLARE
  total_clientes INTEGER;
  linked_cotizaciones INTEGER;
  unlinked_cotizaciones INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_clientes FROM clientes;
  SELECT COUNT(*) INTO linked_cotizaciones FROM cotizaciones WHERE cliente_id IS NOT NULL;
  SELECT COUNT(*) INTO unlinked_cotizaciones FROM cotizaciones WHERE cliente_id IS NULL;

  RAISE NOTICE '=== Migration Complete ===';
  RAISE NOTICE 'Total clientes created: %', total_clientes;
  RAISE NOTICE 'Cotizaciones linked: %', linked_cotizaciones;
  RAISE NOTICE 'Cotizaciones unlinked: %', unlinked_cotizaciones;
END $$;
