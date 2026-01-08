# Database Schema Documentation

Generated: 2025-01-07

## Table of Contents
1. [Tables](#tables)
2. [Enums](#enums)
3. [RLS Policies](#rls-policies)
4. [Functions](#functions)
5. [Triggers](#triggers)

---

## Tables

| table_name               | column_name             | data_type                   | is_nullable | column_default                     |
| ------------------------ | ----------------------- | --------------------------- | ----------- | ---------------------------------- |
| actividades              | id                      | uuid                        | NO          | gen_random_uuid()                  |
| actividades              | cotizacion_id           | uuid                        | YES         | null                               |
| actividades              | venta_id                | uuid                        | YES         | null                               |
| actividades              | tipo                    | activity_type               | NO          | null                               |
| actividades              | asunto                  | text                        | NO          | null                               |
| actividades              | descripcion             | text                        | YES         | null                               |
| actividades              | resultado               | text                        | YES         | null                               |
| actividades              | requiere_seguimiento    | boolean                     | YES         | false                              |
| actividades              | fecha_seguimiento       | date                        | YES         | null                               |
| actividades              | created_by              | uuid                        | YES         | null                               |
| actividades              | created_at              | timestamp with time zone    | YES         | now()                              |
| actividades              | duracion_minutos        | integer                     | YES         | null                               |
| agent_performance        | id                      | uuid                        | YES         | null                               |
| agent_performance        | full_name               | text                        | YES         | null                               |
| agent_performance        | email                   | text                        | YES         | null                               |
| agent_performance        | total_quotes            | bigint                      | YES         | null                               |
| agent_performance        | total_bookings          | bigint                      | YES         | null                               |
| agent_performance        | total_revenue           | numeric                     | YES         | null                               |
| agent_performance        | conversion_rate         | numeric                     | YES         | null                               |
| company_settings         | id                      | uuid                        | NO          | gen_random_uuid()                  |
| company_settings         | company_name            | text                        | NO          | 'Emociones Viajes by Fraveo'::text |
| company_settings         | legal_name              | text                        | YES         | null                               |
| company_settings         | email                   | text                        | NO          | null                               |
| company_settings         | phone                   | text                        | NO          | null                               |
| company_settings         | whatsapp                | text                        | YES         | null                               |
| company_settings         | address                 | text                        | NO          | null                               |
| company_settings         | city                    | text                        | YES         | null                               |
| company_settings         | state                   | text                        | YES         | null                               |
| company_settings         | postal_code             | text                        | YES         | null                               |
| company_settings         | country                 | text                        | YES         | 'México'::text                     |
| company_settings         | rnt                     | text                        | NO          | null                               |
| company_settings         | rfc                     | text                        | YES         | null                               |
| company_settings         | website                 | text                        | YES         | null                               |
| company_settings         | logo_url                | text                        | YES         | null                               |
| company_settings         | facebook_url            | text                        | YES         | null                               |
| company_settings         | instagram_url           | text                        | YES         | null                               |
| company_settings         | created_at              | timestamp with time zone    | YES         | now()                              |
| company_settings         | updated_at              | timestamp with time zone    | YES         | now()                              |
| cotizacion_stage_history | id                      | uuid                        | NO          | gen_random_uuid()                  |
| cotizacion_stage_history | cotizacion_id           | uuid                        | YES         | null                               |
| cotizacion_stage_history | from_stage              | text                        | YES         | null                               |
| cotizacion_stage_history | to_stage                | text                        | YES         | null                               |
| cotizacion_stage_history | changed_by              | uuid                        | YES         | null                               |
| cotizacion_stage_history | changed_at              | timestamp with time zone    | YES         | now()                              |
| cotizacion_stage_history | notes                   | text                        | YES         | null                               |
| cotizaciones             | id                      | uuid                        | NO          | gen_random_uuid()                  |
| cotizaciones             | folio                   | text                        | NO          | null                               |
| cotizaciones             | cliente_nombre          | text                        | NO          | null                               |
| cotizaciones             | cliente_telefono        | text                        | YES         | null                               |
| cotizaciones             | cliente_email           | text                        | YES         | null                               |
| cotizaciones             | origen_lead             | text                        | YES         | null                               |
| cotizaciones             | destino                 | text                        | NO          | null                               |
| cotizaciones             | fecha_salida            | date                        | NO          | null                               |
| cotizaciones             | fecha_regreso           | date                        | NO          | null                               |
| cotizaciones             | num_adultos             | integer                     | YES         | 0                                  |
| cotizaciones             | num_ninos               | integer                     | YES         | 0                                  |
| cotizaciones             | presupuesto_aprox       | numeric                     | YES         | null                               |
| cotizaciones             | notas                   | text                        | YES         | null                               |
| cotizaciones             | created_at              | timestamp with time zone    | NO          | now()                              |
| cotizaciones             | updated_at              | timestamp with time zone    | NO          | timezone('utc'::text, now())       |
| cotizaciones             | divisa                  | text                        | YES         | 'MXN'::text                        |
| cotizaciones             | created_by              | uuid                        | YES         | null                               |
| cotizaciones             | updated_by              | uuid                        | YES         | null                               |
| cotizaciones             | pipeline_stage          | pipeline_stage              | YES         | 'lead'::pipeline_stage             |
| cotizaciones             | conversion_date         | timestamp with time zone    | YES         | null                               |
| cotizaciones             | expected_close_date     | date                        | YES         | null                               |
| cotizaciones             | probability             | integer                     | YES         | 25                                 |
| cotizaciones             | lost_reason             | text                        | YES         | null                               |
| cotizaciones             | assigned_to             | uuid                        | YES         | null                               |
| cotizaciones             | is_manual               | boolean                     | YES         | false                              |
| cotizaciones             | last_stage_change_by    | uuid                        | YES         | null                               |
| cotizaciones             | last_stage_change_at    | timestamp with time zone    | YES         | null                               |
| cotizaciones             | num_infantes            | integer                     | YES         | null                               |
| cotizaciones             | vigente_hasta           | date                        | YES         | null                               |
| cotizaciones             | disclaimer_green        | text                        | YES         | null                               |
| cotizaciones             | disclaimer_blue         | text                        | YES         | null                               |
| cotizaciones             | grupo_id                | uuid                        | YES         | null                               |
| cotizaciones             | num_habitaciones        | integer                     | YES         | 1                                  |
| cotizaciones             | tipo_habitacion         | text                        | YES         | null                               |
| cotizaciones             | personas_por_habitacion | text                        | YES         | null                               |
| grupos                   | id                      | uuid                        | NO          | uuid_generate_v4()                 |
| grupos                   | nombre                  | text                        | NO          | null                               |
| grupos                   | tipo                    | text                        | YES         | null                               |
| grupos                   | fecha_evento            | date                        | YES         | null                               |
| grupos                   | coordinador_nombre      | text                        | YES         | null                               |
| grupos                   | coordinador_telefono    | text                        | YES         | null                               |
| grupos                   | coordinador_email       | text                        | YES         | null                               |
| grupos                   | notas                   | text                        | YES         | null                               |
| grupos                   | created_at              | timestamp without time zone | YES         | now()                              |
| grupos                   | created_by              | uuid                        | YES         | null                               |
| hoteles                  | id                      | uuid                        | NO          | gen_random_uuid()                  |
| hoteles                  | nombre                  | character varying           | NO          | null                               |
| hoteles                  | destino                 | character varying           | YES         | null                               |
| hoteles                  | categoria               | character varying           | YES         | null                               |
| hoteles                  | created_at              | timestamp with time zone    | YES         | timezone('utc'::text, now())       |
| landing_page_content     | id                      | uuid                        | NO          | gen_random_uuid()                  |
| landing_page_content     | section                 | text                        | NO          | null                               |
| landing_page_content     | content                 | jsonb                       | NO          | null                               |
| landing_page_content     | status                  | text                        | YES         | 'draft'::text                      |
| landing_page_content     | version                 | integer                     | YES         | 1                                  |
| landing_page_content     | created_by              | uuid                        | YES         | null                               |
| landing_page_content     | created_at              | timestamp with time zone    | YES         | now()                              |
| landing_page_content     | updated_at              | timestamp with time zone    | YES         | now()                              |
| landing_page_content     | approved_by             | uuid                        | YES         | null                               |
| landing_page_content     | approved_at             | timestamp with time zone    | YES         | null                               |
| landing_page_content     | published_at            | timestamp with time zone    | YES         | null                               |
| landing_page_content     | change_notes            | text                        | YES         | null                               |
| landing_page_content     | rejection_reason        | text                        | YES         | null                               |
| opciones_cotizacion      | id                      | uuid                        | NO          | gen_random_uuid()                  |
| opciones_cotizacion      | cotizacion_id           | uuid                        | YES         | null                               |
| opciones_cotizacion      | operador_id             | uuid                        | YES         | null                               |
| opciones_cotizacion      | nombre_paquete          | text                        | NO          | null                               |
| opciones_cotizacion      | precio_total            | numeric                     | NO          | null                               |
| opciones_cotizacion      | incluye                 | text[]                      | YES         | '{}'::text[]                       |
| opciones_cotizacion      | no_incluye              | text[]                      | YES         | '{}'::text[]                       |
| opciones_cotizacion      | link_paquete            | text                        | YES         | null                               |
| opciones_cotizacion      | created_at              | timestamp with time zone    | NO          | timezone('utc'::text, now())       |
| opciones_cotizacion      | precio_adulto           | numeric                     | YES         | null                               |
| opciones_cotizacion      | precio_menor            | numeric                     | YES         | null                               |
| opciones_cotizacion      | precio_infante          | numeric                     | YES         | null                               |
| opciones_cotizacion      | servicio_descripcion    | text                        | YES         | null                               |
| opciones_cotizacion      | hotel_nombre            | character varying           | YES         | null                               |
| opciones_cotizacion      | ocupacion               | character varying           | YES         | null                               |
| opciones_cotizacion      | vuelo_ida_fecha         | date                        | YES         | null                               |
| opciones_cotizacion      | vuelo_ida_horario       | character varying           | YES         | null                               |
| opciones_cotizacion      | vuelo_ida_ruta          | character varying           | YES         | null                               |
| opciones_cotizacion      | vuelo_regreso_fecha     | date                        | YES         | null                               |
| opciones_cotizacion      | vuelo_regreso_horario   | character varying           | YES         | null                               |
| opciones_cotizacion      | vuelo_regreso_ruta      | character varying           | YES         | null                               |
| opciones_cotizacion      | tour_link               | character varying           | YES         | null                               |
| opciones_cotizacion      | vuelo_ida_directo       | boolean                     | YES         | false                              |
| opciones_cotizacion      | vuelo_regreso_directo   | boolean                     | YES         | false                              |
| opciones_cotizacion      | hotel_id                | uuid                        | YES         | null                               |
| operadores               | id                      | uuid                        | NO          | gen_random_uuid()                  |
| operadores               | nombre                  | text                        | NO          | null                               |
| operadores               | contacto                | text                        | YES         | null                               |
| operadores               | sitio_web               | text                        | YES         | null                               |
| operadores               | comision                | numeric                     | YES         | null                               |
| operadores               | notas                   | text                        | YES         | null                               |
| operadores               | activo                  | boolean                     | YES         | true                               |
| operadores               | created_at              | timestamp with time zone    | NO          | timezone('utc'::text, now())       |
| pagos                    | id                      | uuid                        | NO          | gen_random_uuid()                  |
| pagos                    | venta_id                | uuid                        | YES         | null                               |
| pagos                    | numero_pago             | integer                     | NO          | null                               |
| pagos                    | monto                   | numeric                     | NO          | null                               |
| pagos                    | fecha_programada        | date                        | NO          | null                               |
| pagos                    | fecha_pagado            | timestamp with time zone    | YES         | null                               |
| pagos                    | metodo_pago             | text                        | YES         | null                               |
| pagos                    | referencia              | text                        | YES         | null                               |
| pagos                    | comprobante_url         | text                        | YES         | null                               |
| pagos                    | estado                  | text                        | YES         | 'pendiente'::text                  |
| pagos                    | created_at              | timestamp with time zone    | YES         | now()                              |
| pagos                    | updated_at              | timestamp with time zone    | YES         | now()                              |
| pagos                    | registrado_por          | uuid                        | YES         | null                               |
| pagos                    | notas                   | text                        | YES         | null                               |
| pipeline_summary         | pipeline_stage          | pipeline_stage              | YES         | null                               |
| pipeline_summary         | count                   | bigint                      | YES         | null                               |
| pipeline_summary         | total_value             | numeric                     | YES         | null                               |
| pipeline_summary         | avg_probability         | numeric                     | YES         | null                               |
| pipeline_summary         | avg_days_in_stage       | numeric                     | YES         | null                               |
| profiles                 | id                      | uuid                        | NO          | null                               |
| profiles                 | email                   | text                        | YES         | null                               |
| profiles                 | full_name               | text                        | YES         | null                               |
| profiles                 | preferred_language      | text                        | YES         | 'es'::text                         |
| profiles                 | created_at              | timestamp with time zone    | YES         | now()                              |
| profiles                 | updated_at              | timestamp with time zone    | YES         | now()                              |
| profiles                 | role                    | user_role                   | YES         | 'agent'::user_role                 |
| profiles                 | is_active               | boolean                     | YES         | true                               |
| profiles                 | last_login              | timestamp with time zone    | YES         | null                               |
| profiles                 | phone                   | text                        | YES         | null                               |
| profiles                 | avatar_url              | text                        | YES         | null                               |
| profiles                 | content_manager         | boolean                     | YES         | false                              |
| profiles                 | requires_password_reset | boolean                     | YES         | false                              |
| receipts                 | id                      | uuid                        | NO          | gen_random_uuid()                  |
| receipts                 | receipt_number          | text                        | NO          | null                               |
| receipts                 | venta_id                | uuid                        | YES         | null                               |
| receipts                 | pago_id                 | uuid                        | YES         | null                               |
| receipts                 | template_type           | text                        | NO          | null                               |
| receipts                 | custom_text             | text                        | YES         | null                               |
| receipts                 | amount                  | numeric                     | NO          | null                               |
| receipts                 | payment_date            | date                        | NO          | null                               |
| receipts                 | payment_method          | text                        | YES         | null                               |
| receipts                 | total_price             | numeric                     | YES         | null                               |
| receipts                 | previous_payments       | numeric                     | YES         | null                               |
| receipts                 | balance                 | numeric                     | YES         | null                               |
| receipts                 | client_name             | text                        | YES         | null                               |
| receipts                 | client_phone            | text                        | YES         | null                               |
| receipts                 | folio_venta             | text                        | YES         | null                               |
| receipts                 | image_url               | text                        | NO          | null                               |
| receipts                 | pdf_url                 | text                        | YES         | null                               |
| receipts                 | sent_via_whatsapp       | boolean                     | YES         | false                              |
| receipts                 | sent_at                 | timestamp with time zone    | YES         | null                               |
| receipts                 | created_by              | uuid                        | YES         | null                               |
| receipts                 | created_at              | timestamp with time zone    | YES         | now()                              |
| receipts                 | notes                   | text                        | YES         | null                               |
| receipts                 | receipt_stage           | text                        | YES         | 'draft'::text                      |
| receipts                 | client_email            | text                        | YES         | null                               |
| receipts                 | destination             | text                        | YES         | null                               |
| receipts                 | travelers               | integer                     | YES         | null                               |
| sales_performance        | month                   | timestamp with time zone    | YES         | null                               |
| sales_performance        | total_bookings          | bigint                      | YES         | null                               |
| sales_performance        | total_revenue           | numeric                     | YES         | null                               |
| sales_performance        | avg_deal_size           | numeric                     | YES         | null                               |
| sales_performance        | collected_amount        | numeric                     | YES         | null                               |
| sales_performance        | pending_amount          | numeric                     | YES         | null                               |
| sales_performance        | active_agents           | bigint                      | YES         | null                               |
| seguimiento_cotizaciones | id                      | uuid                        | NO          | gen_random_uuid()                  |
| seguimiento_cotizaciones | cotizacion_id           | uuid                        | YES         | null                               |
| seguimiento_cotizaciones | nota                    | text                        | NO          | null                               |
| seguimiento_cotizaciones | created_at              | timestamp with time zone    | NO          | timezone('utc'::text, now())       |
| tareas                   | id                      | uuid                        | NO          | gen_random_uuid()                  |
| tareas                   | cotizacion_id           | uuid                        | YES         | null                               |
| tareas                   | venta_id                | uuid                        | YES         | null                               |
| tareas                   | titulo                  | text                        | NO          | null                               |
| tareas                   | descripcion             | text                        | YES         | null                               |
| tareas                   | prioridad               | text                        | YES         | 'media'::text                      |
| tareas                   | asignado_a              | uuid                        | YES         | null                               |
| tareas                   | fecha_vencimiento       | date                        | YES         | null                               |
| tareas                   | fecha_completada        | timestamp with time zone    | YES         | null                               |
| tareas                   | completada              | boolean                     | YES         | false                              |
| tareas                   | created_by              | uuid                        | YES         | null                               |
| tareas                   | created_at              | timestamp with time zone    | YES         | now()                              |
| ventas                   | id                      | uuid                        | NO          | gen_random_uuid()                  |
| ventas                   | cotizacion_id           | uuid                        | YES         | null                               |
| ventas                   | folio_venta             | text                        | YES         | null                               |
| ventas                   | selected_option_id      | uuid                        | YES         | null                               |
| ventas                   | precio_total            | numeric                     | NO          | null                               |
| ventas                   | divisa                  | text                        | YES         | 'MXN'::text                        |
| ventas                   | monto_pagado            | numeric                     | YES         | 0                                  |
| ventas                   | monto_pendiente         | numeric                     | YES         | null                               |
| ventas                   | fecha_reserva           | timestamp with time zone    | YES         | now()                              |
| ventas                   | fecha_viaje             | date                        | NO          | null                               |
| ventas                   | fecha_vencimiento_pago  | date                        | YES         | null                               |
| ventas                   | estado_venta            | text                        | YES         | 'confirmada'::text                 |
| ventas                   | created_by              | uuid                        | YES         | null                               |
| ventas                   | created_at              | timestamp with time zone    | YES         | now()                              |
| ventas                   | updated_at              | timestamp with time zone    | YES         | now()                              |
| ventas                   | notas                   | text                        | YES         | null                               |
| ventas                   | is_manual               | boolean                     | YES         | false                              |
| ventas                   | fecha_limite_pago       | date                        | YES         | null                               |
| ventas                   | grupo_id                | uuid                        | YES         | null                               |
| ventas                   | updated_by              | uuid                        | YES         | null                               |

### CRM Tables (Added by Migration 006)

| table_name               | column_name             | data_type                   | is_nullable | column_default                     |
| ------------------------ | ----------------------- | --------------------------- | ----------- | ---------------------------------- |
| clientes                 | id                      | uuid                        | NO          | gen_random_uuid()                  |
| clientes                 | nombre_completo         | text                        | NO          | null                               |
| clientes                 | telefono                | text                        | YES         | null                               |
| clientes                 | email                   | text                        | YES         | null                               |
| clientes                 | telefono_secundario     | text                        | YES         | null                               |
| clientes                 | tipo                    | text                        | YES         | 'individual'::text                 |
| clientes                 | etiquetas               | text[]                      | YES         | '{}'::text[]                       |
| clientes                 | preferencia_contacto    | text                        | YES         | 'whatsapp'::text                   |
| clientes                 | mejor_horario           | text                        | YES         | null                               |
| clientes                 | fecha_nacimiento        | date                        | YES         | null                               |
| clientes                 | direccion               | text                        | YES         | null                               |
| clientes                 | ciudad                  | text                        | YES         | null                               |
| clientes                 | estado                  | text                        | YES         | null                               |
| clientes                 | codigo_postal           | text                        | YES         | null                               |
| clientes                 | pais                    | text                        | YES         | 'México'::text                     |
| clientes                 | rfc                     | text                        | YES         | null                               |
| clientes                 | razon_social            | text                        | YES         | null                               |
| clientes                 | referido_por            | uuid                        | YES         | null                               |
| clientes                 | notas                   | text                        | YES         | null                               |
| clientes                 | total_cotizaciones      | integer                     | YES         | 0                                  |
| clientes                 | total_ventas            | integer                     | YES         | 0                                  |
| clientes                 | total_ingresos          | numeric                     | YES         | 0                                  |
| clientes                 | ultima_interaccion      | timestamp with time zone    | YES         | null                               |
| clientes                 | created_by              | uuid                        | YES         | null                               |
| clientes                 | created_at              | timestamp with time zone    | YES         | now()                              |
| clientes                 | updated_at              | timestamp with time zone    | YES         | now()                              |
| clientes                 | is_active               | boolean                     | YES         | true                               |
| cliente_relaciones       | id                      | uuid                        | NO          | gen_random_uuid()                  |
| cliente_relaciones       | cliente_id              | uuid                        | NO          | null                               |
| cliente_relaciones       | relacionado_con_id      | uuid                        | NO          | null                               |
| cliente_relaciones       | tipo_relacion           | text                        | NO          | null                               |
| cliente_relaciones       | descripcion             | text                        | YES         | null                               |
| cliente_relaciones       | created_at              | timestamp with time zone    | YES         | now()                              |
| viajeros                 | id                      | uuid                        | NO          | gen_random_uuid()                  |
| viajeros                 | venta_id                | uuid                        | NO          | null                               |
| viajeros                 | cliente_id              | uuid                        | YES         | null                               |
| viajeros                 | nombre_completo         | text                        | NO          | null                               |
| viajeros                 | tipo_viajero            | text                        | NO          | null                               |
| viajeros                 | es_titular              | boolean                     | YES         | false                              |
| viajeros                 | fecha_nacimiento        | date                        | YES         | null                               |
| viajeros                 | nacionalidad            | text                        | YES         | null                               |
| viajeros                 | pasaporte_numero        | text                        | YES         | null                               |
| viajeros                 | pasaporte_vencimiento   | date                        | YES         | null                               |
| viajeros                 | telefono                | text                        | YES         | null                               |
| viajeros                 | email                   | text                        | YES         | null                               |
| viajeros                 | requerimientos_especiales | text                      | YES         | null                               |
| viajeros                 | created_at              | timestamp with time zone    | YES         | now()                              |
| viajeros                 | updated_at              | timestamp with time zone    | YES         | now()                              |
| cotizaciones             | cliente_id              | uuid                        | YES         | null                               |
| cotizaciones             | solicitante_id          | uuid                        | YES         | null                               |

---

## Enums

### user_role
Used in: `profiles.role`

| Value       | Description                    |
|-------------|--------------------------------|
| super_admin | Full system access             |
| admin       | Administrative access          |
| manager     | Team management access         |
| agent       | Sales agent access             |
| viewer      | Read-only access               |

### pipeline_stage
Used in: `cotizaciones.pipeline_stage`

| Value             | Description                    |
|-------------------|--------------------------------|
| lead              | New lead                       |
| qualification     | Qualifying the lead            |
| quote_sent        | Quote sent to client           |
| negotiation       | In negotiation                 |
| booking_confirmed | Booking confirmed              |
| payment_pending   | Awaiting payment               |
| fully_paid        | Fully paid                     |
| delivered         | Trip delivered                 |
| lost              | Deal lost                      |
| cancelled         | Cancelled                      |

### activity_type
Used in: `actividades.tipo`

| Value         | Description                    |
|---------------|--------------------------------|
| email         | Email communication            |
| call          | Phone call                     |
| whatsapp      | WhatsApp message               |
| meeting       | Meeting                        |
| note          | Internal note                  |
| status_change | Pipeline status change         |
| payment       | Payment activity               |
| follow_up     | Follow-up task                 |

---

## RLS Policies

### actividades
| Policy Name                              | Command | Description                                      |
|------------------------------------------|---------|--------------------------------------------------|
| Authenticated users can view actividades | SELECT  | All authenticated users can view                 |
| Editors can insert actividades           | INSERT  | super_admin, admin, manager, agent can insert    |
| actividades_insert_all                   | INSERT  | Active users can insert                          |
| actividades_select_all                   | SELECT  | All authenticated can select                     |
| actividades_update_own                   | UPDATE  | Users can update their own activities            |
| actividades_delete_own_or_admin          | DELETE  | Creator or admin can delete                      |

### company_settings
| Policy Name                                   | Command | Description                           |
|-----------------------------------------------|---------|---------------------------------------|
| Authenticated users can view company settings | SELECT  | All authenticated users can view      |
| Admins can manage company settings            | ALL     | super_admin, admin can manage         |

### cotizacion_stage_history
| Policy Name                                | Command | Description                                   |
|--------------------------------------------|---------|-----------------------------------------------|
| Authenticated users can view stage history | SELECT  | All authenticated users can view              |
| Editors can insert stage history           | INSERT  | super_admin, admin, manager, agent can insert |
| Users can insert stage history             | INSERT  | All authenticated can insert                  |
| Users can view stage history               | SELECT  | All authenticated can view                    |

### cotizaciones
| Policy Name                               | Command | Description                                   |
|-------------------------------------------|---------|-----------------------------------------------|
| Authenticated users can view cotizaciones | SELECT  | All authenticated users can view              |
| Admins and agents can create cotizaciones | INSERT  | admin, agent (active) can insert              |
| Editors can insert cotizaciones           | INSERT  | super_admin, admin, manager, agent can insert |
| Editors can update cotizaciones           | UPDATE  | super_admin, admin, manager, agent can update |
| Everyone can view all cotizaciones        | SELECT  | All authenticated can view                    |
| Correct edit permissions                  | UPDATE  | Admin or own cotizacion creator               |
| Managers can delete cotizaciones          | DELETE  | super_admin, admin, manager can delete        |
| Only admins can delete cotizaciones       | DELETE  | Admin (active) can delete                     |

### grupos
| Policy Name                          | Command | Description                                   |
|--------------------------------------|---------|-----------------------------------------------|
| Authenticated users can view grupos  | SELECT  | All authenticated users can view              |
| Editors can insert grupos            | INSERT  | super_admin, admin, manager, agent can insert |
| Editors can update grupos            | UPDATE  | super_admin, admin, manager, agent can update |
| Managers can delete grupos           | DELETE  | super_admin, admin, manager can delete        |

### hoteles
| Policy Name                          | Command | Description                                   |
|--------------------------------------|---------|-----------------------------------------------|
| Authenticated users can view hoteles | SELECT  | All authenticated users can view              |
| Editors can insert hoteles           | INSERT  | super_admin, admin, manager, agent can insert |

### landing_page_content
| Policy Name                             | Command | Description                                   |
|-----------------------------------------|---------|-----------------------------------------------|
| Authenticated users can view all content| SELECT  | All authenticated users can view              |
| Editors can manage landing content      | ALL     | super_admin, admin, manager, agent can manage |
| Public can view published content       | SELECT  | Public can view published status              |
| landing_content_manager_all             | ALL     | content_manager or admin can manage           |
| landing_content_manager_edit            | ALL     | content_manager or admin can manage           |
| landing_public_view                     | SELECT  | anon, authenticated can view published        |

### opciones_cotizacion
| Policy Name                          | Command | Description                                   |
|--------------------------------------|---------|-----------------------------------------------|
| Authenticated users can view opciones| SELECT  | All authenticated users can view              |
| Editors can insert opciones          | INSERT  | super_admin, admin, manager, agent can insert |
| Editors can update opciones          | UPDATE  | super_admin, admin, manager, agent can update |
| Editors can delete opciones          | DELETE  | super_admin, admin, manager, agent can delete |

### operadores
| Policy Name                            | Command | Description                           |
|----------------------------------------|---------|---------------------------------------|
| Authenticated users can view operadores| SELECT  | All authenticated users can view      |
| Admins can manage operadores           | ALL     | super_admin, admin can manage         |

### pagos
| Policy Name                        | Command | Description                                   |
|------------------------------------|---------|-----------------------------------------------|
| Authenticated users can view pagos | SELECT  | All authenticated users can view              |
| Editors can insert pagos           | INSERT  | super_admin, admin, manager, agent can insert |
| Editors can update pagos           | UPDATE  | super_admin, admin, manager, agent can update |
| Managers can delete pagos          | DELETE  | super_admin, admin, manager can delete        |
| pagos_delete_admin_only            | DELETE  | Admin (active) can delete                     |
| pagos_insert_agents_admins         | INSERT  | admin, agent (active) can insert              |
| pagos_select_all                   | SELECT  | All authenticated can view                    |
| pagos_update_agents_admins         | UPDATE  | admin, agent (active) can update              |

### profiles
| Policy Name              | Command | Description                           |
|--------------------------|---------|---------------------------------------|
| Admins can insert profiles| INSERT | super_admin, admin can insert         |
| delete_profiles          | DELETE  | super_admin can delete                |
| insert_profiles          | INSERT  | All authenticated can insert          |
| profiles_select_admin    | SELECT  | Admin or super can view all           |
| profiles_select_own      | SELECT  | Users can view own profile            |
| profiles_update_admin    | UPDATE  | Admin or super can update all         |
| profiles_update_own      | UPDATE  | Users can update own profile          |
| select_profiles          | SELECT  | All authenticated can view            |
| update_profiles          | UPDATE  | Own profile or admin/super            |

### receipts
| Policy Name                          | Command | Description                                   |
|--------------------------------------|---------|-----------------------------------------------|
| Authenticated users can view receipts| SELECT  | All authenticated users can view              |
| Editors can insert receipts          | INSERT  | super_admin, admin, manager, agent can insert |
| Editors can update receipts          | UPDATE  | super_admin, admin, manager, agent can update |
| Managers can delete receipts         | DELETE  | super_admin, admin, manager can delete        |
| receipts_create_auth                 | INSERT  | All authenticated can insert                  |
| receipts_delete_admin                | DELETE  | Admin can delete                              |
| receipts_update_auth                 | UPDATE  | All authenticated can update                  |
| receipts_view_all                    | SELECT  | All authenticated can view                    |

### seguimiento_cotizaciones
| Policy Name                                | Command | Description                   |
|--------------------------------------------|---------|-------------------------------|
| Authenticated users can view seguimiento   | SELECT  | All authenticated can view    |
| Authenticated users can insert seguimiento | INSERT  | All authenticated can insert  |
| Authenticated users can update seguimiento | UPDATE  | All authenticated can update  |
| Authenticated users can delete seguimiento | DELETE  | All authenticated can delete  |

### tareas
| Policy Name                       | Command | Description                           |
|-----------------------------------|---------|---------------------------------------|
| tareas_insert_all                 | INSERT  | Active users can insert               |
| tareas_select_assigned_or_all     | SELECT  | Assigned user or admin/agent can view |
| tareas_update_assigned_or_creator | UPDATE  | Assigned, creator, or admin can update|
| tareas_delete_creator_or_admin    | DELETE  | Creator or admin can delete           |

### ventas
| Policy Name                        | Command | Description                                   |
|------------------------------------|---------|-----------------------------------------------|
| Authenticated users can view ventas| SELECT  | All authenticated users can view              |
| Editors can insert ventas          | INSERT  | super_admin, admin, manager, agent can insert |
| Editors can update ventas          | UPDATE  | super_admin, admin, manager, agent can update |
| Managers can delete ventas         | DELETE  | super_admin, admin, manager can delete        |
| ventas_delete_admin_only           | DELETE  | Admin (active) can delete                     |
| ventas_insert_agents_admins        | INSERT  | admin, agent (active) can insert              |
| ventas_select_all                  | SELECT  | All authenticated can view                    |
| ventas_update_own_or_admin         | UPDATE  | Admin or own venta creator                    |

---

## Functions

### Business Logic Functions
| Function Name              | Return Type | Description                                      |
|----------------------------|-------------|--------------------------------------------------|
| generate_folio             | trigger     | Auto-generates folio for cotizaciones            |
| generate_folio_venta       | trigger     | Auto-generates folio_venta for ventas            |
| generate_receipt_number    | trigger     | Auto-generates receipt_number for receipts       |
| handle_new_user            | trigger     | Creates profile when new auth user is created    |
| is_admin_or_super          | boolean     | Checks if current user is admin or super_admin   |
| mark_overdue_payments      | void        | Marks payments as overdue                        |
| prevent_cotizacion_delete  | trigger     | Prevents deletion of cotizacion with ventas      |
| prevent_venta_delete       | trigger     | Prevents deletion of venta with pagos            |
| set_created_by             | trigger     | Sets created_by to current user                  |
| set_updated_by             | trigger     | Sets updated_by to current user                  |
| update_last_login          | trigger     | Updates last_login timestamp                     |
| update_monto_pendiente     | trigger     | Updates monto_pendiente on venta                 |
| update_receipt_timestamp   | trigger     | Updates receipt timestamp                        |
| update_updated_at_column   | trigger     | Updates updated_at timestamp                     |
| update_venta_monto_pagado  | trigger     | Updates monto_pagado on venta from pagos         |
| update_venta_totals        | trigger     | Updates venta totals when pago changes           |

### Utility Functions (pg_trgm extension)
| Function Name                   | Description                              |
|---------------------------------|------------------------------------------|
| similarity                      | Text similarity comparison               |
| word_similarity                 | Word-based similarity                    |
| strict_word_similarity          | Strict word-based similarity             |
| show_trgm                       | Shows trigrams for text                  |
| set_limit / show_limit          | Sets/shows similarity threshold          |
| gin_extract_*                   | GIN index support functions              |
| gtrgm_*                         | GiST trigram index functions             |

### Migration Helper Functions
| Function Name                        | Description                          |
|--------------------------------------|--------------------------------------|
| add_check_constraint_if_not_exists   | Adds check constraint if not exists  |
| add_foreign_key_if_not_exists        | Adds foreign key if not exists       |
| set_column_default_if_needed         | Sets column default if needed        |

---

## Triggers

### cotizaciones
| Trigger Name                          | Event  | Function                       |
|---------------------------------------|--------|--------------------------------|
| prevent_cotizacion_with_ventas_delete | DELETE | prevent_cotizacion_delete()    |
| set_created_by_trigger                | INSERT | set_created_by()               |
| set_folio                             | INSERT | generate_folio()               |
| set_updated_by_trigger                | UPDATE | set_updated_by()               |
| update_cotizaciones_updated_at        | UPDATE | update_updated_at_column()     |

### pagos
| Trigger Name                        | Event  | Function                       |
|-------------------------------------|--------|--------------------------------|
| sync_venta_pagado                   | INSERT | update_venta_monto_pagado()    |
| sync_venta_pagado                   | UPDATE | update_venta_monto_pagado()    |
| sync_venta_pagado                   | DELETE | update_venta_monto_pagado()    |
| trigger_update_venta_on_pago_insert | INSERT | update_venta_totals()          |
| trigger_update_venta_on_pago_update | UPDATE | update_venta_totals()          |
| trigger_update_venta_on_pago_delete | DELETE | update_venta_totals()          |

### receipts
| Trigger Name                    | Event  | Function                       |
|---------------------------------|--------|--------------------------------|
| set_receipt_number              | INSERT | generate_receipt_number()      |
| update_receipt_timestamp_trigger| UPDATE | update_receipt_timestamp()     |

### ventas
| Trigger Name                 | Event  | Function                       |
|------------------------------|--------|--------------------------------|
| prevent_venta_with_pagos_delete | DELETE | prevent_venta_delete()       |
| set_folio_venta              | INSERT | generate_folio_venta()         |
| update_venta_pendiente       | UPDATE | update_monto_pendiente()       |

---

## Views (Materialized)

| View Name         | Description                                    |
|-------------------|------------------------------------------------|
| agent_performance | Agent sales performance metrics                |
| pipeline_summary  | Pipeline stage counts and values               |
| sales_performance | Monthly sales performance metrics              |

---

## Foreign Key Relationships

### Main Relationships
```
cotizaciones.created_by      → profiles.id
cotizaciones.updated_by      → profiles.id
cotizaciones.assigned_to     → profiles.id
cotizaciones.grupo_id        → grupos.id

opciones_cotizacion.cotizacion_id → cotizaciones.id
opciones_cotizacion.operador_id   → operadores.id
opciones_cotizacion.hotel_id      → hoteles.id

ventas.cotizacion_id      → cotizaciones.id
ventas.selected_option_id → opciones_cotizacion.id
ventas.created_by         → profiles.id
ventas.updated_by         → profiles.id
ventas.grupo_id           → grupos.id

pagos.venta_id         → ventas.id
pagos.registrado_por   → profiles.id

receipts.venta_id   → ventas.id
receipts.pago_id    → pagos.id
receipts.created_by → profiles.id

actividades.cotizacion_id → cotizaciones.id
actividades.venta_id      → ventas.id
actividades.created_by    → profiles.id

tareas.cotizacion_id → cotizaciones.id
tareas.venta_id      → ventas.id
tareas.asignado_a    → profiles.id
tareas.created_by    → profiles.id

grupos.created_by → profiles.id

cotizacion_stage_history.cotizacion_id → cotizaciones.id
cotizacion_stage_history.changed_by    → profiles.id

seguimiento_cotizaciones.cotizacion_id → cotizaciones.id

landing_page_content.created_by  → profiles.id
landing_page_content.approved_by → profiles.id
```

---

## Notes

- All `id` columns use UUID with auto-generation
- Timestamps use `timestamp with time zone` except `grupos.created_at`
- RLS is enabled on all tables
- The `pg_trgm` extension is installed for text search functionality
- Views (agent_performance, pipeline_summary, sales_performance) are likely materialized views for reporting
