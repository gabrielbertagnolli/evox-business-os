# Análisis de Funciones del Menú del Panel (Evox Business OS)

Este informe detalla el propósito, el estado actual, el comportamiento esperado y los posibles solapamientos de cada una de las opciones del menú de navegación lateral de la aplicación.

---

## 1. Dashboard (`/dashboard`)
* **Para qué es:** Es el hub central o panel de control principal que da un vistazo general al estado del sistema operativo empresarial.
* **Qué hace actualmente:** Muestra tarjetas de estadísticas (Agentes, Workflows, Integraciones) y un log de actividad reciente. Se ha modificado para mostrar datos reales de `x7_agents`, mientras que los apartados que aún no tienen backend (Workflows, Integraciones) están marcados como "Próximamente".
* **Qué debería hacer:** Debería evolucionar para incluir métricas de uso de LLMs (tokens, costos) basándose en las tablas de OpenWebUI, así como el volumen de interacciones en los canales (WhatsApp, Email).
* **Solapamiento:** Ninguno. Funciona como un agregador.

---

## 2. Agents (`/dashboard/agents`)
* **Para qué es:** Interfaz pensada para crear automatizaciones de fondo (ej. Monitor de Meta Ads, Reportes CRM).
* **Qué hace actualmente:** Es una **maqueta (mockup)**. Permite ver una interfaz y crear registros mediante `/api/agents`, pero la tabla `agents` en la base de datos **no existe** (las migraciones de Supabase no la incluyen), por lo que las acciones fallan silenciosamente o arrojan errores en el backend.
* **Qué debería hacer:** Debería permitir configurar tareas programadas (CRON) o reactivas a webhooks. 
* **Solapamiento:** ⚠️ **ALTO SOLAPAMIENTO con "X7 Workspace" (`/dashboard/x7/workspace`)**. X7 Workspace es donde realmente se gestionan los agentes funcionales (tabla `x7_agents`), portados de OpenWebUI. 
* **Recomendación:** Eliminar `/dashboard/agents` y centralizar la creación de agentes en X7 Workspace, o bien rediseñarlo exclusivamente como un gestor de *Tareas en Segundo Plano* (cron jobs) desligado del chat conversacional.

---

## 3. X7 (`/dashboard/x7`)
* **Para qué es:** Es la interfaz conversacional principal (el "ChatGPT" interno) que permite interactuar con los agentes configurados y ejecutar la "Dual-Model Arena".
* **Qué hace actualmente:** Es **totalmente funcional**. Permite chatear, invocar comandos `/`, usar múltiples modelos de lenguaje, y realizar feedback (votos), apoyándose en la sólida estructura heredada de OpenWebUI (`x7_chats`, `x7_messages`).
* **Qué debería hacer:** Ya cumple su función principal. Faltaría la inyección en tiempo real de los resultados de las *Skills*.
* **Solapamiento:** Ninguno. Es la característica central del sistema.

---

## 4. Skills (`/dashboard/x7/skills` y `/dashboard/skills`)
* **Para qué es:** Un entorno para definir herramientas personalizadas (Tools) escritas en JavaScript que el LLM puede ejecutar de forma autónoma (ej. buscar en internet, acceder a bases de datos).
* **Qué hace actualmente:** Es **funcional**. Está conectado a la tabla `x7_skills` y cuenta con un seed robusto en base de datos. (Nota: el directorio `/dashboard/skills` estaba vacío y ha sido configurado para redirigir aquí).
* **Qué debería hacer:** Exactamente lo que hace, actuar como el gestor de herramientas (Tools en la terminología de OpenWebUI).
* **Solapamiento:** ⚠️ **CONFUSIÓN DE NOMENCLATURA con "Funciones" en X7 Workspace**. En X7 Workspace hay una pestaña de "Funciones" (tabla `x7_functions`) que sirven como interceptores o *Pipes/Valves* (ej. filtros de censura o rutas personalizadas). "Skills" son funciones que el LLM invoca a voluntad. Es vital clarificar esto en la UI para el usuario final.

---

## 5. Workflows (`/dashboard/workflows`)
* **Para qué es:** Interfaz para orquestar automatizaciones de múltiples pasos (estilo Zapier o Make).
* **Qué hace actualmente:** Es una **maqueta (mockup)**. Intenta consultar un endpoint `/api/workflows` que se enlaza a una tabla `workflows` inexistente. Muestra un estado de "Próximamente".
* **Qué debería hacer:** Debería permitir arrastrar y soltar nodos o definir un JSON que encadene la ejecución de varios "X7 Agents" y "Skills" en orden secuencial.
* **Solapamiento:** Moderado con **X7 Functions** (Pipes). Un Pipe puede actuar como un workflow. 
* **Recomendación:** Mantenerlo desactivado hasta que se decida si Evox usará un motor de flujos propio o si delegará los flujos a herramientas como n8n.

---

## 6. Integrations (`/dashboard/integrations`)
* **Para qué es:** Un gestor de conexiones con aplicaciones de terceros (OAuth para Slack, HubSpot, Meta, etc.).
* **Qué hace actualmente:** Es una **maqueta (mockup)**. No existe la tabla `integrations` en la base de datos.
* **Qué debería hacer:** Debería servir como un almacén de secretos (Vault) donde se guardan tokens de acceso de forma segura. Estos tokens luego serían inyectados como variables de entorno a las **Skills** (ej. una Skill de HubSpot lee el token guardado aquí).
* **Solapamiento:** Ninguno. Es un habilitador para las Skills, no compite con ellas. (Nota: No confundir con "Custom Providers" en Settings, que gestiona APIs de Inteligencia Artificial).

---

## 7. Settings (`/dashboard/settings`)
* **Para qué es:** Configuración global del usuario, perfil, facturación y proveedores de IA.
* **Qué hace actualmente:** Es **funcional**. Lee el balance de créditos de la tabla real `user_profiles`, gestiona integraciones de WhatsApp y gestiona las llaves de OpenAI/Anthropic en `x7_custom_providers`.
* **Solapamiento:** Ninguno.

---

## 🎯 Conclusión y Plan de Acción Sugerido

La interfaz actual mezcla la robusta infraestructura porteada de **OpenWebUI (X7)** con maquetas conceptuales (Agents antiguos, Workflows, Integrations) de un dashboard de automatización tradicional.

1. **Merge de Agentes:** El menú "Agents" (`/dashboard/agents`) debería desaparecer o redirigir a "X7 Workspace" (`/dashboard/x7/workspace`) para evitar crear un estado fantasma. X7 Workspace es donde los verdaderos agentes LLM viven en la base de datos (`x7_agents`).
2. **Clarificación Skills vs Functions:** Cambiar el nombre en la interfaz de "Funciones" (Pipes) a "Interceptors" o "Pipes", dejando "Skills" como la única palabra para referirse a código que el LLM puede ejecutar.
3. **Pausar Workflows:** Dejar "Workflows" como "Próximamente" hasta tener un motor de ejecución real, ya que requeriría construir un manejador de estado complejo.
4. **Transformar Integrations en un "Secret Vault":** Rediseñar la página de Integraciones para que simplemente inserte credenciales cifradas en una nueva tabla `x7_secrets`, la cual las Skills podrán consultar internamente.
