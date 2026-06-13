# Registro de Migraciones (Supabase)

Este documento mantiene un control actualizado de todas las migraciones aplicadas a la base de datos remota de Supabase, para evitar conflictos de estado entre el desarrollo local y el entorno remoto.

## Estado de la Base de Datos

Actualmente, el sistema automatizado está reparando el historial de migraciones (`supabase migration repair --status applied`) para sincronizar las tablas ya existentes con el registro local, y luego aplicar las nuevas.

## Historial de Migraciones

| Migración | Propósito / Cambios Principales | Estado |
| :--- | :--- | :--- |
| `20240001_core_schema.sql` | Integraciones base | Sincronizado |
| `20240002_credits_schema.sql` | Sistema de créditos | Sincronizado |
| `20240003_x7_agent_schema.sql` | Memoria y Skills de X7 | Sincronizado |
| `20240004_x7_seed_tools.sql` | Semilla de herramientas iniciales | Sincronizado |
| `20240005_x7_settings_schema.sql` | Configuración de usuario | Sincronizado |
| `20240006_x7_massive_tools_seed.sql`| Herramientas masivas | Sincronizado |
| `20240007_x7_custom_providers.sql` | Proveedores LLM personalizados | Sincronizado |
| `20240008_x7_rag_schema.sql` | Documentos y Chunks para RAG | Sincronizado |
| `20240009_x7_sandbox_tools_seed.sql`| Herramientas experimentales/sandbox | Sincronizado |
| `20240010_x7_chats_schema.sql` | Chats e hilos de conversación | Sincronizado |
| `20240011_x7_functions_schema.sql` | Funciones/Tools adicionales | Sincronizado |
| `20240012_x7_channels_schema.sql` | Canales y espacios de trabajo | Sincronizado |
| `20240013_x7_organization_schema.sql`| Organizaciones y permisos | Sincronizado |
| `20240014_x7_feedbacks_schema.sql` | Feedback de mensajes | Sincronizado |
| `20240015_x7_notes_schema.sql` | Notas dinámicas | Sincronizado |
| `20240016_x7_seed_image_tool.sql` | Herramienta de imágenes | Sincronizado |
| `20240017_x7_seed_terminal_tool.sql`| Herramienta de terminal | Sincronizado |
| `20240018_x7_channel_messages.sql` | Mensajes dentro de canales | Sincronizado |
| `20240019_x7_seed_web_search.sql` | Funciones nativas de búsqueda | Sincronizado |
| `20240020_x7_agents_schema.sql` | Agentes personalizados y enrutamiento | Sincronizado |
| `20240021_user_profiles_settings.sql`| Ajustes avanzados de perfiles | Sincronizado |
| `20240022_x7_agents_gpt_features.sql`| Características GPT para agentes | Sincronizado |
| `20240023_x7_mcp_servers.sql` | Servidores MCP (Integración OpenClaude)| **NUEVA (Aplicada Hoy)** |
| `20240024_x7_tasks.sql` | Tareas en segundo plano (Autonomous) | **NUEVA (Aplicada Hoy)** |
| `20240025_x7_agent_runtimes.sql`| Runtimes externos para Agentes (Control Plane) | **NUEVA (Aplicada Hoy)** |

## Protocolo Futuro de Migraciones

> **Importante:** Cualquier tabla nueva o política de RLS que deba añadirse, debe hacerse generando un archivo SQL mediante `npx supabase migration new <nombre>`. El contenido se anota en ese archivo y luego se sube con `npx supabase db push`. Ya **no** se deben pegar consultas SQL directamente en el SQL Editor de Supabase web, para evitar desincronización.

*Documento autogenerado para mantener el orden de infraestructura de Evox OS.*
