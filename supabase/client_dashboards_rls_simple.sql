-- Primero, habilitar RLS en la tabla
ALTER TABLE client_dashboards ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Users can view their own dashboards" ON client_dashboards;
DROP POLICY IF EXISTS "Admins can view all dashboards" ON client_dashboards;
DROP POLICY IF EXISTS "Admins can insert dashboards" ON client_dashboards;
DROP POLICY IF EXISTS "Admins can update dashboards" ON client_dashboards;
DROP POLICY IF EXISTS "Admins can delete dashboards" ON client_dashboards;

-- Política 1: Los clientes pueden VER solo sus propios dashboards
CREATE POLICY "Clients can view own dashboards"
ON client_dashboards
FOR SELECT
TO authenticated
USING (auth.uid() = client_id);

-- Política 2: Los admins pueden VER todos los dashboards
-- (Usamos service_role bypass, los admins autenticados tendrán acceso completo vía API)
CREATE POLICY "Service role full access"
ON client_dashboards
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Política 3: Permitir INSERT desde el servidor (authenticated users con rol service)
CREATE POLICY "Allow insert from server"
ON client_dashboards
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política 4: Permitir UPDATE desde el servidor
CREATE POLICY "Allow update from server"
ON client_dashboards
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política 5: Permitir DELETE desde el servidor
CREATE POLICY "Allow delete from server"
ON client_dashboards
FOR DELETE
TO authenticated
USING (true);
