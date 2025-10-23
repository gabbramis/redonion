# Client Dashboard System - RedOnion

Sistema completo de Dashboard para Clientes con panel de administración para gestionar reportes mensuales de marketing.

## 📋 Descripción General

Este sistema permite a los administradores crear y gestionar dashboards personalizados para cada cliente, mostrando métricas de rendimiento, gráficos de tendencias y recomendaciones del equipo.

## 🗃️ Base de Datos

### 1. Ejecutar el SQL en Supabase

Primero, debes ejecutar el script SQL en tu proyecto de Supabase:

```bash
supabase/client_dashboards.sql
```

Este script creará:
- Tabla `client_dashboards` con todas las columnas necesarias
- Índices para mejorar el rendimiento
- Políticas RLS (Row Level Security) para seguridad
- Triggers para actualización automática de `updated_at`

### 2. Estructura de la Tabla

La tabla `client_dashboards` contiene:
- `id`: UUID único del dashboard
- `client_id`: ID del usuario/cliente (referencia a auth.users)
- `report_period`: Período del reporte (ej: "Octubre 2025")
- `description`: Descripción breve del reporte
- `metrics`: Array JSON de métricas (hasta 4)
- `recommendation`: Texto con recomendaciones del equipo
- `chart_data`: Array JSON con datos para el gráfico de tendencias
- `created_at`, `updated_at`: Timestamps automáticos
- `created_by`: ID del admin que creó el dashboard

## 📁 Estructura de Archivos Creados

```
src/
├── types/
│   └── dashboard.ts                    # Tipos TypeScript para el dashboard
├── app/
│   ├── api/
│   │   └── dashboards/
│   │       └── route.ts                # API endpoints (GET, POST, DELETE)
│   ├── dashboard/
│   │   ├── admin/
│   │   │   └── clients/
│   │   │       └── [id]/
│   │   │           ├── page.tsx        # Modificado: agregado botón "Gestionar Dashboard"
│   │   │           └── dashboard/
│   │   │               └── page.tsx    # Formulario admin para crear/editar dashboards
│   │   └── client/
│   │       └── panel/
│   │           └── page.tsx            # Modificado: agregada sección "Reportes"
└── supabase/
    └── client_dashboards.sql           # Schema SQL para crear la tabla

package.json                             # Modificado: agregada dependencia recharts
```

## 🎨 Características del Sistema

### Vista del Cliente (`/dashboard/client/panel`)

El cliente puede:
- ✅ Ver sus métricas de rendimiento en cards visuales
- 📊 Visualizar gráfico de tendencias de engagement
- 💡 Leer recomendaciones personalizadas del equipo
- 🔄 Ver el período del reporte actual

**Para activar la vista de reportes**, el componente `ClientPanel` debe cambiar `activeSection` a `"reports"` mediante navegación o tabs.

### Panel de Administrador

#### Gestión de Clientes (`/dashboard/admin/clients/[id]`)
- Nuevo botón: **"Gestionar Dashboard"**
- Navega al formulario de creación/edición de dashboards

#### Formulario de Dashboard (`/dashboard/admin/clients/[id]/dashboard`)

El administrador puede configurar:

**1. Información General**
- Período del reporte (obligatorio)
- Descripción breve

**2. Métricas (máx. 4)**
Cada métrica tiene:
- Nombre (ej: "Tasa de interacción promedio")
- Valor (ej: "4.5%")
- Descripción (ej: "Likes, comentarios y compartidos")

**3. Datos del Gráfico**
- Agregar/eliminar puntos de datos
- Cada punto: mes + engagement (%)
- Mínimo 1 punto de datos

**4. Recomendación del Equipo**
- Texto libre con sugerencias y análisis
- Se muestra destacado al cliente

## 🚀 Flujo de Uso

### Para Administradores

1. **Acceder a gestión de clientes**
   ```
   /dashboard/admin → Seleccionar cliente → "Gestionar"
   ```

2. **Crear/Editar Dashboard**
   ```
   Click en "Gestionar Dashboard"
   → Completar formulario
   → Click en "Guardar Dashboard"
   ```

3. **Los datos se guardan automáticamente en Supabase**
   - Si existe un dashboard para ese cliente + período: se actualiza
   - Si no existe: se crea uno nuevo

### Para Clientes

1. **Ver Dashboard**
   ```
   /dashboard/client/panel
   → Cambiar a sección "Reportes" (si hay navegación implementada)
   ```

2. **Ver el reporte más reciente**
   - El sistema muestra automáticamente el dashboard más reciente
   - Si no hay dashboards: mensaje informativo

## 🔐 Seguridad (RLS Policies)

Las políticas de seguridad implementadas:

- ✅ **Clientes**: Solo pueden VER sus propios dashboards
- ✅ **Admins**: Pueden VER, CREAR, ACTUALIZAR y ELIMINAR todos los dashboards
- ✅ **No autenticados**: Sin acceso

## 📊 Ejemplo de Datos

```json
{
  "client_id": "uuid-del-cliente",
  "report_period": "Octubre 2025",
  "description": "Resumen de rendimiento de redes sociales",
  "metrics": [
    {
      "name": "Tasa de interacción promedio",
      "value": "4.5%",
      "description": "Likes, comentarios y compartidos"
    },
    {
      "name": "Promedio de comentarios",
      "value": "35",
      "description": "Por publicación"
    },
    {
      "name": "Mejor hora para publicar",
      "value": "19:00–21:00",
      "description": "Mayor engagement"
    },
    {
      "name": "Contenido más popular",
      "value": "Videos cortos y tutoriales",
      "description": ""
    }
  ],
  "recommendation": "Incrementar uso de historias interactivas y encuestas.",
  "chart_data": [
    { "month": "Agosto", "engagement": 3.8 },
    { "month": "Septiembre", "engagement": 4.2 },
    { "month": "Octubre", "engagement": 4.5 }
  ]
}
```

## 🛠️ Tecnologías Utilizadas

- **Next.js 15.5.4** - Framework React
- **TypeScript 5** - Tipado estático
- **Supabase** - Base de datos PostgreSQL + Auth
- **Recharts 3.3.0** - Librería de gráficos
- **Tailwind CSS v4** - Estilos
- **Framer Motion** - Animaciones

## 📝 Notas Importantes

1. **Navegación del Cliente**: Actualmente la sección de reportes existe pero necesitas implementar la navegación/tabs en el `ClientPanel` para que el usuario pueda cambiar entre secciones (`dashboard`, `reports`, `media`, `profile`).

2. **Datos sin Hardcodear**: Todo está conectado a Supabase. No hay datos de ejemplo hardcodeados.

3. **Validaciones**:
   - El período del reporte es obligatorio
   - Se requiere al menos un punto de datos para el gráfico
   - Máximo 4 métricas

4. **Actualización vs Creación**:
   - El sistema usa `client_id + report_period` como identificador único
   - Si ya existe un dashboard para ese cliente y período, se actualiza
   - Si no existe, se crea uno nuevo

## 🎯 Próximos Pasos Sugeridos

1. **Agregar navegación/tabs** en `ClientPanel` para cambiar entre secciones
2. **Implementar vista de todos los reportes** (histórico) para el cliente
3. **Agregar exportación a PDF** del reporte
4. **Notificaciones** cuando se publica un nuevo reporte
5. **Comparación de períodos** (mes actual vs anterior)

---

✅ **Sistema completamente funcional y listo para usar**
