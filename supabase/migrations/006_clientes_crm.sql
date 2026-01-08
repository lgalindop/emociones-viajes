-- ============================================================================
-- Migration: 006_clientes_crm.sql
-- Description: Create CRM model with clientes, cliente_relaciones, and viajeros tables
-- ============================================================================

-- ============================================================================
-- 1. CREATE CLIENTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core Identity
  nombre_completo TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  telefono_secundario TEXT,

  -- Classification
  tipo TEXT DEFAULT 'individual' CHECK (tipo IN ('individual', 'corporate', 'agency')),
  etiquetas TEXT[] DEFAULT '{}',

  -- Contact Preferences
  preferencia_contacto TEXT DEFAULT 'whatsapp' CHECK (preferencia_contacto IN ('whatsapp', 'email', 'call', 'any')),
  mejor_horario TEXT CHECK (mejor_horario IN ('morning', 'afternoon', 'evening', 'any') OR mejor_horario IS NULL),

  -- Demographics (optional)
  fecha_nacimiento DATE,

  -- Address (optional, for invoicing)
  direccion TEXT,
  ciudad TEXT,
  estado TEXT,
  codigo_postal TEXT,
  pais TEXT DEFAULT 'México',

  -- Business Info (for corporate/invoicing)
  rfc TEXT,
  razon_social TEXT,

  -- Relationships
  referido_por UUID REFERENCES clientes(id) ON DELETE SET NULL,

  -- Notes
  notas TEXT,

  -- Metrics (denormalized for performance, updated via triggers)
  total_cotizaciones INTEGER DEFAULT 0,
  total_ventas INTEGER DEFAULT 0,
  total_ingresos NUMERIC DEFAULT 0,
  ultima_interaccion TIMESTAMP WITH TIME ZONE,

  -- Audit
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Indexes for clientes
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono) WHERE telefono IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes USING gin(nombre_completo gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clientes_is_active ON clientes(is_active);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo ON clientes(tipo);

-- ============================================================================
-- 2. CREATE CLIENTE_RELACIONES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cliente_relaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The two related customers
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  relacionado_con_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- Relationship type
  tipo_relacion TEXT NOT NULL CHECK (tipo_relacion IN (
    'esposo/a', 'familiar', 'asistente', 'empleador', 'colega', 'amigo', 'otro'
  )),
  descripcion TEXT, -- Free text for additional context

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Prevent duplicate relationships
  UNIQUE(cliente_id, relacionado_con_id, tipo_relacion),

  -- Prevent self-relationships
  CHECK (cliente_id != relacionado_con_id)
);

-- Indexes for cliente_relaciones
CREATE INDEX IF NOT EXISTS idx_cliente_relaciones_cliente ON cliente_relaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_relaciones_relacionado ON cliente_relaciones(relacionado_con_id);

-- ============================================================================
-- 3. CREATE VIAJEROS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS viajeros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to booking
  venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,

  -- Optional link to customer (if they're in the system)
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,

  -- Traveler Info (required even without cliente_id)
  nombre_completo TEXT NOT NULL,
  tipo_viajero TEXT NOT NULL CHECK (tipo_viajero IN ('adulto', 'menor', 'infante')),
  es_titular BOOLEAN DEFAULT false,

  -- Travel Documents (optional)
  fecha_nacimiento DATE,
  nacionalidad TEXT,
  pasaporte_numero TEXT,
  pasaporte_vencimiento DATE,

  -- Contact (for emergencies)
  telefono TEXT,
  email TEXT,

  -- Special Requirements
  requerimientos_especiales TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for viajeros
CREATE INDEX IF NOT EXISTS idx_viajeros_venta ON viajeros(venta_id);
CREATE INDEX IF NOT EXISTS idx_viajeros_cliente ON viajeros(cliente_id) WHERE cliente_id IS NOT NULL;

-- ============================================================================
-- 4. MODIFY COTIZACIONES TABLE
-- ============================================================================

-- Add cliente_id column (the "titular" - main customer responsible for booking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cotizaciones' AND column_name = 'cliente_id'
  ) THEN
    ALTER TABLE cotizaciones ADD COLUMN cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add solicitante_id column (who requested the quote, if different from titular)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cotizaciones' AND column_name = 'solicitante_id'
  ) THEN
    ALTER TABLE cotizaciones ADD COLUMN solicitante_id UUID REFERENCES clientes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON cotizaciones(cliente_id) WHERE cliente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cotizaciones_solicitante ON cotizaciones(solicitante_id) WHERE solicitante_id IS NOT NULL;

-- ============================================================================
-- 5. ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_relaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE viajeros ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. RLS POLICIES FOR CLIENTES
-- ============================================================================

-- SELECT: All authenticated users can view
CREATE POLICY "clientes_select_all" ON clientes
  FOR SELECT TO authenticated USING (true);

-- INSERT: Editors can insert
CREATE POLICY "clientes_insert_editors" ON clientes
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin', 'manager', 'agent')
    AND profiles.is_active = true
  ));

-- UPDATE: Editors can update
CREATE POLICY "clientes_update_editors" ON clientes
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin', 'manager', 'agent')
    AND profiles.is_active = true
  ));

-- DELETE: Admins only (soft delete preferred)
CREATE POLICY "clientes_delete_admin" ON clientes
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin')
    AND profiles.is_active = true
  ));

-- ============================================================================
-- 7. RLS POLICIES FOR CLIENTE_RELACIONES
-- ============================================================================

-- SELECT: All authenticated users can view
CREATE POLICY "cliente_relaciones_select_all" ON cliente_relaciones
  FOR SELECT TO authenticated USING (true);

-- INSERT: Editors can insert
CREATE POLICY "cliente_relaciones_insert_editors" ON cliente_relaciones
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin', 'manager', 'agent')
    AND profiles.is_active = true
  ));

-- UPDATE: Editors can update
CREATE POLICY "cliente_relaciones_update_editors" ON cliente_relaciones
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin', 'manager', 'agent')
    AND profiles.is_active = true
  ));

-- DELETE: Editors can delete
CREATE POLICY "cliente_relaciones_delete_editors" ON cliente_relaciones
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin', 'manager', 'agent')
    AND profiles.is_active = true
  ));

-- ============================================================================
-- 8. RLS POLICIES FOR VIAJEROS
-- ============================================================================

-- SELECT: All authenticated users can view
CREATE POLICY "viajeros_select_all" ON viajeros
  FOR SELECT TO authenticated USING (true);

-- INSERT: Editors can insert
CREATE POLICY "viajeros_insert_editors" ON viajeros
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin', 'manager', 'agent')
    AND profiles.is_active = true
  ));

-- UPDATE: Editors can update
CREATE POLICY "viajeros_update_editors" ON viajeros
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin', 'manager', 'agent')
    AND profiles.is_active = true
  ));

-- DELETE: Editors can delete
CREATE POLICY "viajeros_delete_editors" ON viajeros
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin', 'manager', 'agent')
    AND profiles.is_active = true
  ));

-- ============================================================================
-- 9. TRIGGERS FOR CLIENTES
-- ============================================================================

-- Trigger to update clientes.updated_at
CREATE OR REPLACE FUNCTION update_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clientes_updated_at ON clientes;
CREATE TRIGGER trigger_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_clientes_updated_at();

-- Trigger to update viajeros.updated_at
DROP TRIGGER IF EXISTS trigger_viajeros_updated_at ON viajeros;
CREATE TRIGGER trigger_viajeros_updated_at
  BEFORE UPDATE ON viajeros
  FOR EACH ROW
  EXECUTE FUNCTION update_clientes_updated_at();

-- ============================================================================
-- 10. FUNCTION TO UPDATE CLIENTE METRICS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_cliente_metrics()
RETURNS TRIGGER AS $$
DECLARE
  target_cliente_id UUID;
BEGIN
  -- Determine which cliente_id to update
  IF TG_OP = 'DELETE' THEN
    target_cliente_id := OLD.cliente_id;
  ELSE
    target_cliente_id := NEW.cliente_id;
  END IF;

  -- Skip if no cliente_id
  IF target_cliente_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Update metrics for cotizaciones
  IF TG_TABLE_NAME = 'cotizaciones' THEN
    UPDATE clientes
    SET
      total_cotizaciones = (
        SELECT COUNT(*) FROM cotizaciones WHERE cliente_id = target_cliente_id
      ),
      ultima_interaccion = now()
    WHERE id = target_cliente_id;
  END IF;

  -- Update metrics for ventas
  IF TG_TABLE_NAME = 'ventas' THEN
    UPDATE clientes
    SET
      total_ventas = (
        SELECT COUNT(*) FROM ventas v
        JOIN cotizaciones c ON v.cotizacion_id = c.id
        WHERE c.cliente_id = target_cliente_id
      ),
      total_ingresos = COALESCE((
        SELECT SUM(v.precio_total) FROM ventas v
        JOIN cotizaciones c ON v.cotizacion_id = c.id
        WHERE c.cliente_id = target_cliente_id
      ), 0),
      ultima_interaccion = now()
    WHERE id = target_cliente_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to cotizaciones for cliente metrics
DROP TRIGGER IF EXISTS trigger_update_cliente_metrics_cotizaciones ON cotizaciones;
CREATE TRIGGER trigger_update_cliente_metrics_cotizaciones
  AFTER INSERT OR UPDATE OF cliente_id OR DELETE ON cotizaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_cliente_metrics();

-- ============================================================================
-- 11. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE clientes IS 'Customer master table for CRM';
COMMENT ON COLUMN clientes.tipo IS 'Customer type: individual, corporate, or agency';
COMMENT ON COLUMN clientes.etiquetas IS 'Array of tags like VIP, frecuente, corporativo';
COMMENT ON COLUMN clientes.preferencia_contacto IS 'Preferred contact method';
COMMENT ON COLUMN clientes.total_cotizaciones IS 'Denormalized count of quotes (updated by trigger)';
COMMENT ON COLUMN clientes.total_ventas IS 'Denormalized count of sales (updated by trigger)';
COMMENT ON COLUMN clientes.total_ingresos IS 'Denormalized sum of sales revenue (updated by trigger)';

COMMENT ON TABLE cliente_relaciones IS 'Relationships between customers (spouse, assistant, etc.)';
COMMENT ON COLUMN cliente_relaciones.tipo_relacion IS 'Type: esposo/a, familiar, asistente, empleador, colega, amigo, otro';

COMMENT ON TABLE viajeros IS 'Travelers/passengers linked to a sale';
COMMENT ON COLUMN viajeros.tipo_viajero IS 'Type: adulto, menor, infante';
COMMENT ON COLUMN viajeros.es_titular IS 'Whether this traveler is the main booker/titular';
COMMENT ON COLUMN viajeros.cliente_id IS 'Optional link to clientes table if traveler is a registered customer';

COMMENT ON COLUMN cotizaciones.cliente_id IS 'The titular - main customer responsible for the booking';
COMMENT ON COLUMN cotizaciones.solicitante_id IS 'Who requested the quote (NULL = same as cliente_id)';
