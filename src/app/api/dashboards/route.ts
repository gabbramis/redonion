import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ADMIN_EMAILS } from '@/defs/admins';

// GET - Obtener dashboards (admin ve todos, cliente solo los suyos)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    let query = supabase
      .from('client_dashboards')
      .select('*')
      .order('created_at', { ascending: false });

    // Si se especifica un cliente, filtrar por ese cliente
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching dashboards:', error);
      return NextResponse.json(
        { error: 'Error al obtener dashboards' },
        { status: 500 }
      );
    }

    return NextResponse.json({ dashboards: data || [] });
  } catch (error) {
    console.error('Error in GET /api/dashboards:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear o actualizar dashboard (solo admin)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que sea admin
    const isAdmin = user.email && ADMIN_EMAILS.some(email => email.toLowerCase() === user.email!.toLowerCase());

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { client_id, report_period, description, metrics, recommendation, chart_data } = body;

    // Validar datos requeridos
    if (!client_id || !report_period) {
      return NextResponse.json(
        { error: 'client_id y report_period son requeridos' },
        { status: 400 }
      );
    }

    // Usar cliente admin para bypasear RLS
    const adminClient = createAdminClient();

    // Verificar si ya existe un dashboard para este cliente y período
    const { data: existing } = await adminClient
      .from('client_dashboards')
      .select('id')
      .eq('client_id', client_id)
      .eq('report_period', report_period)
      .single();

    let result;

    if (existing) {
      // Actualizar dashboard existente
      const { data, error } = await adminClient
        .from('client_dashboards')
        .update({
          description,
          metrics,
          recommendation,
          chart_data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating dashboard:', error);
        return NextResponse.json(
          { error: 'Error al actualizar dashboard' },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Crear nuevo dashboard
      const { data, error } = await adminClient
        .from('client_dashboards')
        .insert({
          client_id,
          report_period,
          description,
          metrics,
          recommendation,
          chart_data,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating dashboard:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        return NextResponse.json(
          { error: `Error al crear dashboard: ${error.message || error.code || 'Unknown'}` },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({ dashboard: result }, { status: 200 });
  } catch (error) {
    console.error('Error in POST /api/dashboards:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar dashboard (solo admin)
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const dashboardId = searchParams.get('id');

    if (!dashboardId) {
      return NextResponse.json(
        { error: 'ID del dashboard es requerido' },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que sea admin
    const isAdmin = user.email && ADMIN_EMAILS.some(email => email.toLowerCase() === user.email!.toLowerCase());

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores.' },
        { status: 403 }
      );
    }

    // Usar cliente admin para bypasear RLS
    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('client_dashboards')
      .delete()
      .eq('id', dashboardId);

    if (error) {
      console.error('Error deleting dashboard:', error);
      return NextResponse.json(
        { error: 'Error al eliminar dashboard' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/dashboards:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
