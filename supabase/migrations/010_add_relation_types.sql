-- Migration: Add 'hijo/a' and 'padre/madre' to cliente_relaciones tipo_relacion constraint
-- This expands the allowed relationship types to include parent/child relationships
-- Also standardizes 'amigo' to 'amigo/a' for consistency with other gender-neutral types

-- First, update any existing 'amigo' values to 'amigo/a'
UPDATE cliente_relaciones SET tipo_relacion = 'amigo/a' WHERE tipo_relacion = 'amigo';

-- Drop the existing constraint
ALTER TABLE cliente_relaciones DROP CONSTRAINT IF EXISTS cliente_relaciones_tipo_relacion_check;

-- Add the new constraint with additional relationship types
ALTER TABLE cliente_relaciones ADD CONSTRAINT cliente_relaciones_tipo_relacion_check
  CHECK (tipo_relacion IN (
    'esposo/a',
    'familiar',
    'hijo/a',
    'padre/madre',
    'asistente',
    'empleador',
    'colega',
    'amigo/a',
    'otro'
  ));

-- Update the comment to reflect the new types
COMMENT ON COLUMN cliente_relaciones.tipo_relacion IS 'Type: esposo/a, familiar, hijo/a, padre/madre, asistente, empleador, colega, amigo/a, otro';
