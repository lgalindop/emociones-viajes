-- ============================================================================
-- Migration: 008_hotel_crm.sql
-- Description: Extend hotels table to full CRM with contacts, rooms, operators, seasons
-- ============================================================================

-- =============================================================================
-- 1. EXTEND HOTELES TABLE
-- =============================================================================

-- Location info
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS ciudad TEXT;
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'México';
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS telefono_principal TEXT;
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS email_reservaciones TEXT;
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS website TEXT;

-- Business terms
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS comision_porcentaje NUMERIC(5,2);
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS dias_pago INTEGER DEFAULT 30;
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS politica_cancelacion TEXT;
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS politica_ninos TEXT;
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS check_in_hora TEXT DEFAULT '15:00';
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS check_out_hora TEXT DEFAULT '12:00';

-- Amenities (stored as array for flexibility)
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS amenidades TEXT[] DEFAULT '{}';

-- Classification
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'hotel';
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS estrellas INTEGER;
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS etiquetas TEXT[] DEFAULT '{}';

-- Metrics (denormalized for performance)
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS total_reservaciones INTEGER DEFAULT 0;
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS total_noches INTEGER DEFAULT 0;
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS total_ingresos NUMERIC DEFAULT 0;
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS ultima_reservacion TIMESTAMP WITH TIME ZONE;
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS calificacion_promedio NUMERIC(3,2);

-- Audit
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE hoteles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Indexes for hoteles
CREATE INDEX IF NOT EXISTS idx_hoteles_destino ON hoteles(destino);
CREATE INDEX IF NOT EXISTS idx_hoteles_categoria ON hoteles(categoria);
CREATE INDEX IF NOT EXISTS idx_hoteles_tipo ON hoteles(tipo);
CREATE INDEX IF NOT EXISTS idx_hoteles_is_active ON hoteles(is_active);

-- =============================================================================
-- 2. CREATE HOTEL_CONTACTOS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS hotel_contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hoteles(id) ON DELETE CASCADE,

  nombre TEXT NOT NULL,
  cargo TEXT, -- 'Gerente General', 'Ventas', 'Reservaciones', 'Grupos'
  telefono TEXT,
  celular TEXT,
  email TEXT,
  es_principal BOOLEAN DEFAULT false,

  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotel_contactos_hotel ON hotel_contactos(hotel_id);

-- =============================================================================
-- 3. CREATE HOTEL_HABITACIONES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS hotel_habitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hoteles(id) ON DELETE CASCADE,

  nombre TEXT NOT NULL, -- 'Standard', 'Deluxe', 'Suite Junior', 'Suite Master'
  codigo TEXT, -- Internal code like 'STD', 'DLX', 'SJR'
  capacidad_adultos INTEGER DEFAULT 2,
  capacidad_ninos INTEGER DEFAULT 2,
  capacidad_total INTEGER DEFAULT 4,

  descripcion TEXT,
  amenidades TEXT[] DEFAULT '{}', -- Room-specific amenities

  -- Rack rates (base reference)
  tarifa_rack_sencilla NUMERIC,
  tarifa_rack_doble NUMERIC,
  tarifa_rack_triple NUMERIC,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotel_habitaciones_hotel ON hotel_habitaciones(hotel_id);

-- =============================================================================
-- 4. CREATE HOTEL_OPERADORES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS hotel_operadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hoteles(id) ON DELETE CASCADE,
  operador_id UUID NOT NULL REFERENCES operadores(id) ON DELETE CASCADE,

  -- Negotiated terms with this operator
  comision_porcentaje NUMERIC(5,2),
  tarifa_neta BOOLEAN DEFAULT false, -- Net rate vs commissionable
  codigo_agencia TEXT, -- Agency code at this hotel

  contacto_nombre TEXT, -- Specific contact for this relationship
  contacto_email TEXT,

  notas TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  UNIQUE(hotel_id, operador_id)
);

CREATE INDEX IF NOT EXISTS idx_hotel_operadores_hotel ON hotel_operadores(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_operadores_operador ON hotel_operadores(operador_id);

-- =============================================================================
-- 5. CREATE HOTEL_TEMPORADAS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS hotel_temporadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hoteles(id) ON DELETE CASCADE,

  nombre TEXT NOT NULL, -- 'Alta', 'Baja', 'Semana Santa', 'Navidad'
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,

  -- Multiplier or fixed adjustment
  factor_precio NUMERIC(4,2) DEFAULT 1.00, -- 1.20 = 20% more, 0.80 = 20% less

  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotel_temporadas_hotel ON hotel_temporadas(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_temporadas_fechas ON hotel_temporadas(fecha_inicio, fecha_fin);

-- =============================================================================
-- 6. RLS POLICIES
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE hotel_contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_habitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_operadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_temporadas ENABLE ROW LEVEL SECURITY;

-- -------------------------
-- HOTEL_CONTACTOS POLICIES
-- -------------------------

-- SELECT: All authenticated users
CREATE POLICY "hotel_contactos_select_all" ON hotel_contactos
  FOR SELECT TO authenticated USING (true);

-- INSERT: Editors
CREATE POLICY "hotel_contactos_insert_editors" ON hotel_contactos
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  ));

-- UPDATE: Editors
CREATE POLICY "hotel_contactos_update_editors" ON hotel_contactos
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  ));

-- DELETE: Admins only
CREATE POLICY "hotel_contactos_delete_admin" ON hotel_contactos
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin')
  ));

-- -------------------------
-- HOTEL_HABITACIONES POLICIES
-- -------------------------

CREATE POLICY "hotel_habitaciones_select_all" ON hotel_habitaciones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "hotel_habitaciones_insert_editors" ON hotel_habitaciones
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  ));

CREATE POLICY "hotel_habitaciones_update_editors" ON hotel_habitaciones
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  ));

CREATE POLICY "hotel_habitaciones_delete_admin" ON hotel_habitaciones
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin')
  ));

-- -------------------------
-- HOTEL_OPERADORES POLICIES
-- -------------------------

CREATE POLICY "hotel_operadores_select_all" ON hotel_operadores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "hotel_operadores_insert_editors" ON hotel_operadores
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  ));

CREATE POLICY "hotel_operadores_update_editors" ON hotel_operadores
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  ));

CREATE POLICY "hotel_operadores_delete_admin" ON hotel_operadores
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin')
  ));

-- -------------------------
-- HOTEL_TEMPORADAS POLICIES
-- -------------------------

CREATE POLICY "hotel_temporadas_select_all" ON hotel_temporadas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "hotel_temporadas_insert_editors" ON hotel_temporadas
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  ));

CREATE POLICY "hotel_temporadas_update_editors" ON hotel_temporadas
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  ));

CREATE POLICY "hotel_temporadas_delete_admin" ON hotel_temporadas
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin')
  ));

-- =============================================================================
-- 7. TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for hoteles updated_at
DROP TRIGGER IF EXISTS update_hoteles_updated_at ON hoteles;
CREATE TRIGGER update_hoteles_updated_at
  BEFORE UPDATE ON hoteles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for hotel_contactos updated_at
DROP TRIGGER IF EXISTS update_hotel_contactos_updated_at ON hotel_contactos;
CREATE TRIGGER update_hotel_contactos_updated_at
  BEFORE UPDATE ON hotel_contactos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for hotel_habitaciones updated_at
DROP TRIGGER IF EXISTS update_hotel_habitaciones_updated_at ON hotel_habitaciones;
CREATE TRIGGER update_hotel_habitaciones_updated_at
  BEFORE UPDATE ON hotel_habitaciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
