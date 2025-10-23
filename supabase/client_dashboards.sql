-- Tabla para almacenar los dashboards de clientes
CREATE TABLE IF NOT EXISTS client_dashboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_period TEXT NOT NULL,
  description TEXT,
  metrics JSONB DEFAULT '[]'::jsonb,
  recommendation TEXT,
  chart_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id),

  -- Índices para mejorar rendimiento
  CONSTRAINT unique_client_period UNIQUE(client_id, report_period)
);

-- Crear índice para búsquedas rápidas por cliente
CREATE INDEX idx_client_dashboards_client_id ON client_dashboards(client_id);
CREATE INDEX idx_client_dashboards_created_at ON client_dashboards(created_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_client_dashboards_updated_at
    BEFORE UPDATE ON client_dashboards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Policies
ALTER TABLE client_dashboards ENABLE ROW LEVEL SECURITY;

-- Los clientes solo pueden ver sus propios dashboards
CREATE POLICY "Users can view their own dashboards"
  ON client_dashboards
  FOR SELECT
  USING (auth.uid() = client_id);

-- Los admins pueden ver todos los dashboards
CREATE POLICY "Admins can view all dashboards"
  ON client_dashboards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_plans
      WHERE user_id = auth.uid()
      AND plan_id IN (SELECT id FROM plans WHERE name = 'Admin')
      AND status = 'active'
    )
  );

-- Los admins pueden insertar dashboards
CREATE POLICY "Admins can insert dashboards"
  ON client_dashboards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_plans
      WHERE user_id = auth.uid()
      AND plan_id IN (SELECT id FROM plans WHERE name = 'Admin')
      AND status = 'active'
    )
  );

-- Los admins pueden actualizar dashboards
CREATE POLICY "Admins can update dashboards"
  ON client_dashboards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_plans
      WHERE user_id = auth.uid()
      AND plan_id IN (SELECT id FROM plans WHERE name = 'Admin')
      AND status = 'active'
    )
  );

-- Los admins pueden eliminar dashboards
CREATE POLICY "Admins can delete dashboards"
  ON client_dashboards
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_plans
      WHERE user_id = auth.uid()
      AND plan_id IN (SELECT id FROM plans WHERE name = 'Admin')
      AND status = 'active'
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE client_dashboards IS 'Almacena los dashboards/reportes mensuales de clientes';
COMMENT ON COLUMN client_dashboards.report_period IS 'Período del reporte, ej: "Octubre 2025"';
COMMENT ON COLUMN client_dashboards.metrics IS 'Array de métricas: [{"name": "...", "value": "...", "description": "..."}]';
COMMENT ON COLUMN client_dashboards.chart_data IS 'Datos para gráficos: [{"month": "...", "engagement": ...}]';
