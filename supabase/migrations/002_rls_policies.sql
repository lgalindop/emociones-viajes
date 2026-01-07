-- ============================================
-- Migration 002: Row Level Security Policies
-- ============================================
-- IDEMPOTENT: Drops and recreates policies safely
-- SAFE: Does not delete any data
-- ============================================

-- ============================================
-- PROFILES TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles"
ON profiles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

-- ============================================
-- COTIZACIONES TABLE
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view cotizaciones" ON cotizaciones;
CREATE POLICY "Authenticated users can view cotizaciones"
ON cotizaciones FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Editors can insert cotizaciones" ON cotizaciones;
CREATE POLICY "Editors can insert cotizaciones"
ON cotizaciones FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  )
);

DROP POLICY IF EXISTS "Editors can update cotizaciones" ON cotizaciones;
CREATE POLICY "Editors can update cotizaciones"
ON cotizaciones FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  )
);

DROP POLICY IF EXISTS "Managers can delete cotizaciones" ON cotizaciones;
CREATE POLICY "Managers can delete cotizaciones"
ON cotizaciones FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager')
  )
);

-- ============================================
-- OPCIONES_COTIZACION TABLE
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view opciones" ON opciones_cotizacion;
CREATE POLICY "Authenticated users can view opciones"
ON opciones_cotizacion FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Editors can insert opciones" ON opciones_cotizacion;
CREATE POLICY "Editors can insert opciones"
ON opciones_cotizacion FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  )
);

DROP POLICY IF EXISTS "Editors can update opciones" ON opciones_cotizacion;
CREATE POLICY "Editors can update opciones"
ON opciones_cotizacion FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  )
);

DROP POLICY IF EXISTS "Editors can delete opciones" ON opciones_cotizacion;
CREATE POLICY "Editors can delete opciones"
ON opciones_cotizacion FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  )
);

-- ============================================
-- COTIZACION_STAGE_HISTORY TABLE
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view stage history" ON cotizacion_stage_history;
CREATE POLICY "Authenticated users can view stage history"
ON cotizacion_stage_history FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Editors can insert stage history" ON cotizacion_stage_history;
CREATE POLICY "Editors can insert stage history"
ON cotizacion_stage_history FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  )
);

-- ============================================
-- VENTAS TABLE
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view ventas" ON ventas;
CREATE POLICY "Authenticated users can view ventas"
ON ventas FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Editors can insert ventas" ON ventas;
CREATE POLICY "Editors can insert ventas"
ON ventas FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  )
);

DROP POLICY IF EXISTS "Editors can update ventas" ON ventas;
CREATE POLICY "Editors can update ventas"
ON ventas FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  )
);

DROP POLICY IF EXISTS "Managers can delete ventas" ON ventas;
CREATE POLICY "Managers can delete ventas"
ON ventas FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager')
  )
);

-- ============================================
-- PAGOS TABLE
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view pagos" ON pagos;
CREATE POLICY "Authenticated users can view pagos"
ON pagos FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Editors can insert pagos" ON pagos;
CREATE POLICY "Editors can insert pagos"
ON pagos FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  )
);

DROP POLICY IF EXISTS "Editors can update pagos" ON pagos;
CREATE POLICY "Editors can update pagos"
ON pagos FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  )
);

DROP POLICY IF EXISTS "Managers can delete pagos" ON pagos;
CREATE POLICY "Managers can delete pagos"
ON pagos FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager')
  )
);

-- ============================================
-- RECEIPTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view receipts" ON receipts;
CREATE POLICY "Authenticated users can view receipts"
ON receipts FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Editors can insert receipts" ON receipts;
CREATE POLICY "Editors can insert receipts"
ON receipts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  )
);

DROP POLICY IF EXISTS "Editors can update receipts" ON receipts;
CREATE POLICY "Editors can update receipts"
ON receipts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  )
);

DROP POLICY IF EXISTS "Managers can delete receipts" ON receipts;
CREATE POLICY "Managers can delete receipts"
ON receipts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager')
  )
);

-- ============================================
-- GRUPOS TABLE
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view grupos" ON grupos;
CREATE POLICY "Authenticated users can view grupos"
ON grupos FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Editors can insert grupos" ON grupos;
CREATE POLICY "Editors can insert grupos"
ON grupos FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  )
);

DROP POLICY IF EXISTS "Editors can update grupos" ON grupos;
CREATE POLICY "Editors can update grupos"
ON grupos FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  )
);

DROP POLICY IF EXISTS "Managers can delete grupos" ON grupos;
CREATE POLICY "Managers can delete grupos"
ON grupos FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager')
  )
);

-- ============================================
-- OPERADORES TABLE
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view operadores" ON operadores;
CREATE POLICY "Authenticated users can view operadores"
ON operadores FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage operadores" ON operadores;
CREATE POLICY "Admins can manage operadores"
ON operadores FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

-- ============================================
-- HOTELES TABLE
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view hoteles" ON hoteles;
CREATE POLICY "Authenticated users can view hoteles"
ON hoteles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Editors can insert hoteles" ON hoteles;
CREATE POLICY "Editors can insert hoteles"
ON hoteles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  )
);

-- ============================================
-- COMPANY_SETTINGS TABLE
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view company settings" ON company_settings;
CREATE POLICY "Authenticated users can view company settings"
ON company_settings FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage company settings" ON company_settings;
CREATE POLICY "Admins can manage company settings"
ON company_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

-- ============================================
-- LANDING_PAGE_CONTENT TABLE
-- ============================================

DROP POLICY IF EXISTS "Public can view published content" ON landing_page_content;
CREATE POLICY "Public can view published content"
ON landing_page_content FOR SELECT
USING (status = 'published');

DROP POLICY IF EXISTS "Authenticated users can view all content" ON landing_page_content;
CREATE POLICY "Authenticated users can view all content"
ON landing_page_content FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Editors can manage landing content" ON landing_page_content;
CREATE POLICY "Editors can manage landing content"
ON landing_page_content FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  )
);

-- ============================================
-- ACTIVIDADES TABLE
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view actividades" ON actividades;
CREATE POLICY "Authenticated users can view actividades"
ON actividades FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Editors can insert actividades" ON actividades;
CREATE POLICY "Editors can insert actividades"
ON actividades FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager', 'agent')
  )
);

-- Done!
DO $$ BEGIN RAISE NOTICE 'All RLS policies created successfully'; END $$;
