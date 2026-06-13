# 📚 Open WebUI - Documentación Completa (Granularidad Máxima)

> **Nota:** Este archivo contiene la documentación técnica completa de Open WebUI extraída de https://docs.openwebui.com/ con el máximo nivel de detalle posible. Guarda este archivo con extensión `.md` para visualizarlo correctamente en cualquier editor Markdown.

---

## 📋 Índice General

```markdown
1. Introducción
2. Inicio Rápido (Quick Start)
   2.1 Docker
   2.2 Docker Compose
   2.3 Python (pip/uv/conda/venv)
   2.4 Kubernetes/Helm
   2.5 Podman
   2.6 Desktop App
   2.7 WSL
3. Variables de Entorno (Referencia Completa)
   3.1 General/Backend
   3.2 Base de Datos
   3.3 Redis
   3.4 Uvicorn
   3.5 Cache
   3.6 Proxy
   3.7 Seguridad
   3.8 Vector Databases
   3.9 RAG
   3.10 Web Search
   3.11 Audio
   3.12 Generación de Imágenes
   3.13 OAuth/SSO/LDAP/SCIM
   3.14 Permisos de Usuario
4. Características Principales
   4.1 Chat y Conversaciones
   4.2 Conocimiento y RAG
   4.3 Modelos y Agentes
   4.4 Notas
   4.5 Canales
   4.6 Open Terminal
   4.7 Extensibilidad (Plugins, Tools, MCP, OpenAPI)
5. Autenticación y Acceso
   5.1 RBAC
   5.2 SSO/OIDC/LDAP
   5.3 API Keys
   5.4 SCIM 2.0
6. Administración
   6.1 Analytics
   6.2 Evaluación de Modelos
   6.3 Banners y Webhooks
7. Escalado y Alta Disponibilidad
8. Troubleshooting (Guía Completa)
9. FAQ (Preguntas Frecuentes)
10. Referencia de API
11. Actualización y Mantenimiento
12. Desarrollo y Contribución
```

---

## 1. 🎯 Introducción

**Open WebUI** es una plataforma de IA autoalojada, extensible, rica en funciones y amigable para el usuario, diseñada para operar **completamente offline**.

### Características Clave:
- ✅ Soporte nativo para **Ollama** y **APIs compatibles con OpenAI**
- ✅ Solución agnóstica al proveedor para modelos locales y en la nube
- ✅ Multi-usuario desde el primer día con RBAC completo
- ✅ Arquitectura contenedor-first para despliegues en cualquier entorno
- ✅ Extensible mediante Python tools, pipelines, MCP y servidores OpenAPI

### Plataformas Soportadas:
| Sistema | Arquitectura | Notas |
|---------|-------------|-------|
| **Linux** | x86_64, ARM64 | Incluye Raspberry Pi, NVIDIA DGX Spark |
| **macOS** | Intel, Apple Silicon | Nativo vía Docker Desktop |
| **Windows** | x86_64 | Vía WSL2 o Docker Desktop |

---

## 2. 🚀 Inicio Rápido (Quick Start)

### 2.1 🐳 Docker (Recomendado)

#### Comando Básico:
```bash
docker run -d -p 3000:8080 \
  --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data \
  --name open-webui \
  --restart always \
  ghcr.io/open-webui/open-webui:main
```

#### Acceso:
```
http://localhost:3000
```

#### Variantes de Imagen:
| Tag | Caso de Uso |
|-----|-------------|
| `:main` | Imagen estándar (recomendada) |
| `:main-slim` | Imagen más pequeña, descarga modelos Whisper/embedding bajo demanda |
| `:cuda` | Soporte GPU Nvidia (añadir `--gpus all`) |
| `:ollama` | Incluye Ollama dentro del contenedor (setup todo-en-uno) |
| `:dev` | Rama de desarrollo con últimas características (NO para producción) |

#### Versiones Específicas (Producción):
```bash
# Pin a versión específica
docker pull ghcr.io/open-webui/open-webui:v0.9.6
docker pull ghcr.io/open-webui/open-webui:v0.9.6-cuda
docker pull ghcr.io/open-webui/open-webui:v0.9.6-ollama
```

### 2.2 🐙 Docker Compose

#### `docker-compose.yml` Básico:
```yaml
services:
  openwebui:
    image: ghcr.io/open-webui/open-webui:main
    ports:
      - "3000:8080"
    volumes:
      - open-webui:/app/backend/data
    restart: always

volumes:
  open-webui:
```

#### Con Imagen Slim:
```yaml
services:
  openwebui:
    image: ghcr.io/open-webui/open-webui:main-slim
    ports:
      - "3000:8080"
    volumes:
      - open-webui:/app/backend/data
volumes:
  open-webui:
```
> ⚠️ Las imágenes slim descargan modelos requeridos (whisper, embedding) en el primer uso, lo que puede aumentar el tiempo de inicio inicial.

#### Con Soporte GPU Nvidia:
```yaml
services:
  openwebui:
    image: ghcr.io/open-webui/open-webui:cuda
    ports:
      - "3000:8080"
    volumes:
      - open-webui:/app/backend/data
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    restart: always
```

### 2.3 🐍 Python (pip/uv/conda/venv)

#### Compatibilidad de Python:
- ✅ **Python 3.11** (Recomendado para producción)
- ✅ **Python 3.12** (Funciona, pero reportes raros de comportamiento inesperado)
- ❌ **Python 3.13** (NO soportado aún - dependencias no compatibles)

#### Instalación con pip:
```bash
# 1. Instalar
pip install open-webui

# 2. Iniciar servidor
open-webui serve

# 3. Acceder
# http://localhost:8080
```

#### Instalación con uv:
```bash
# 1. Instalar uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Ejecutar Open WebUI (macOS/Linux)
DATA_DIR=~/.open-webui uvx --python 3.11 open-webui@latest serve

# Windows (PowerShell)
$env:DATA_DIR="C:\open-webui\data"; uvx --python 3.11 open-webui@latest serve
```

#### Instalación con Conda:
```bash
# 1. Crear entorno
conda create -n open-webui python=3.11

# 2. Activar
conda activate open-webui

# 3. Instalar
pip install open-webui

# 4. Iniciar
open-webui serve
```

#### Instalación con venv:
```bash
# 1. Crear entorno virtual
python3 -m venv venv

# 2. Activar (Linux/macOS)
source venv/bin/activate
# Windows: venv\Scripts\activate

# 3. Instalar
pip install open-webui

# 4. Iniciar
open-webui serve
```

> ⚠️ Si recibes `'open-webui: command not found'`:
> 1. Asegúrate de que el entorno virtual/conda está activado
> 2. Prueba ejecutar directamente: `python -m open_webui serve`
> 3. Para almacenar datos en ubicación específica: `DATA_DIR=./data open-webui serve`

### 2.4 ☸️ Kubernetes/Helm

#### Prerrequisitos:
- Cluster Kubernetes configurado
- Helm instalado

#### Pasos Helm:
```bash
# 1. Añadir repositorio
helm repo add open-webui https://open-webui.github.io/helm-charts
helm repo update

# 2. Instalar chart
helm install openwebui open-webui/open-webui

# 3. Verificar instalación
kubectl get pods
```

#### ⚠️ Importante para Escalado:
Si planeas escalar Open WebUI con múltiples pods/replicas:
- **Redis es obligatorio** para gestión de sesiones
- **ChromaDB por defecto NO es seguro para multi-replica** (usa SQLite local no fork-safe)
- Debes usar: `VECTOR_DB=pgvector` (o Milvus/Qdrant) O ejecutar ChromaDB como servidor HTTP separado con `CHROMA_HTTP_HOST`

#### Configuración de Ingress (Nginx):
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/affinity: "cookie"
    nginx.ingress.kubernetes.io/session-cookie-name: "open-webui-session"
    nginx.ingress.kubernetes.io/session-cookie-expires: "172800"
    nginx.ingress.kubernetes.io/session-cookie-max-age: "172800"
```

### 2.5 🦭 Podman

#### Comando Básico:
```bash
podman run -d --name openwebui \
  -p 3000:8080 \
  -v open-webui:/app/backend/data \
  ghcr.io/open-webui/open-webui:main
```

#### Networking con Podman:
> ⚠️ `slirp4netns` está siendo deprecado y será eliminado en Podman 6. Usa **pasta** (default en Podman 5+).

##### Acceso a Servicios del Host:
```bash
# Dentro de Open WebUI, configura Ollama en:
# Settings > Admin Settings > Connections
http://host.containers.internal:11434
```

##### Legacy (slirp4netns - Podman antiguo):
```bash
podman run -d \
  --network=slirp4netns:allow_host_loopback=true \
  --name openwebui \
  -p 3000:8080 \
  -v open-webui:/app/backend/data \
  ghcr.io/open-webui/open-webui:main
```

### 2.6 🖥️ Desktop App

Descarga la aplicación de escritorio desde:
```
https://github.com/open-webui/desktop
```

- Ejecuta Open WebUI nativamente en tu sistema
- Sin Docker ni configuración manual
- Ideal para uso personal/local

> ⚠️ Para despliegues de producción, usa **Docker** o **Python**.

### 2.7 🪟 Docker con WSL (Windows Subsystem for Linux)

#### Pasos:
1. **Instalar WSL** siguiendo la documentación oficial de Microsoft
2. **Instalar Docker Desktop**: https://www.docker.com/products/docker-desktop/
3. **Configurar integración WSL** en Docker Desktop:
   - Settings > Resources > WSL Integration
   - Activar "Enable integration with my default WSL distro"
4. **Ejecutar desde terminal WSL**:
```bash
docker pull ghcr.io/open-webui/open-webui:main
docker run -d -p 3000:8080 -v open-webui:/app/backend/data --name open-webui ghcr.io/open-webui/open-webui:main
```

> ⚠️ Ejecuta siempre comandos `docker` desde la terminal WSL, no desde PowerShell/CMD.

---

## 3. ⚙️ Variables de Entorno (Referencia Completa)

### 3.1 📦 General/Backend

#### `WEBUI_URL`
- **Tipo:** `str`
- **Default:** `http://localhost:3000`
- **Descripción:** URL donde tu instalación de Open WebUI es accesible. Requerido para búsqueda y OAuth/SSO.
- **Persistencia:** ✅ ConfigVar (se almacena en BD tras primer inicio)

> ⚠️ Debe establecerse ANTES de usar OAuth/SSO. Para cambiarlo después, usa el Admin Panel o desactiva `ENABLE_PERSISTENT_CONFIG` temporalmente.

#### `ENABLE_SIGNUP`
- **Tipo:** `bool`
- **Default:** `True`
- **Descripción:** Activa/desactiva creación de cuentas de usuario.
- **Persistencia:** ✅ ConfigVar

#### `ENABLE_SIGNUP_PASSWORD_CONFIRMATION`
- **Tipo:** `bool`
- **Default:** `False`
- **Descripción:** Si es True, añade campo "Confirmar Contraseña" en el registro para evitar errores tipográficos.

#### `WEBUI_ADMIN_EMAIL` / `WEBUI_ADMIN_PASSWORD` / `WEBUI_ADMIN_NAME`
- **Descripción:** Crean automáticamente una cuenta admin en el primer inicio si no existen usuarios.
- **Uso:** Despliegues headless/automatizados sin creación manual de cuentas.
- **Seguridad:**
  ```bash
  # Usa secrets management en producción, NO texto plano
  # Docker secrets, Kubernetes secrets, o inyección de variables
  ```

#### `ENABLE_LOGIN_FORM`
- **Tipo:** `bool`
- **Default:** `True`
- **Descripción:** Muestra/oculta formulario de login con email/contraseña.
- **Persistencia:** ✅ ConfigVar

#### `ENABLE_PASSWORD_AUTH`
- **Tipo:** `bool`
- **Default:** `True`
- **Descripción:** Permite coexistencia de autenticación por contraseña y SSO.
- **⚠️ Crítico:** Establecer a `False` SOLO si usas SSO/OAuth y expones Open WebUI públicamente. **Nunca desactivar si no usas SSO.**

#### `DEFAULT_LOCALE`
- **Tipo:** `str`
- **Default:** `en`
- **Descripción:** Locale por defecto de la aplicación.

#### `DEFAULT_MODELS`
- **Tipo:** `str`
- **Default:** `""` (None)
- **Descripción:** Establece modelo de lenguaje por defecto.

#### `DEFAULT_PINNED_MODELS`
- **Tipo:** `str`
- **Default:** `""`
- **Ejemplo:** `gpt-4,claude-3-opus,llama-3-70b`
- **Descripción:** Lista de modelos a fijar por defecto para nuevos usuarios.

#### `DEFAULT_MODEL_METADATA`
- **Tipo:** `dict` (JSON)
- **Default:** `{}`
- **Ejemplo:** `{"capabilities":{"vision":true,"web_search":true}}`
- **Descripción:** Metadata global por defecto para todos los modelos (capacidades, etc.)

#### `DEFAULT_MODEL_PARAMS`
- **Tipo:** `dict` (JSON)
- **Default:** `{}`
- **Ejemplo:** `{"temperature":0.7,"function_calling":"native"}`
- **Descripción:** Parámetros globales por defecto (temperature, top_p, max_tokens, etc.)

#### `DEFAULT_USER_ROLE`
- **Tipo:** `str`
- **Opciones:** `pending` | `user` | `admin`
- **Default:** `pending`
- **Descripción:** Rol asignado por defecto a nuevos usuarios.

#### `ENABLE_CALENDAR` / `ENABLE_CHANNELS` / `ENABLE_FOLDERS` / `ENABLE_AUTOMATIONS`
- **Tipo:** `bool`
- **Descripción:** Activan/desactivan características específicas de la plataforma.

#### `AUTOMATION_MAX_COUNT` / `AUTOMATION_MIN_INTERVAL`
- **Descripción:** Límites para creación de automatizaciones por usuarios no-admin.

### 3.2 🗄️ Base de Datos

#### `DATABASE_URL`
- **Tipo:** `str`
- **Default:** `sqlite:///./data/webui.db`
- **Descripción:** URL completa de conexión a base de datos.
- **Ejemplos:**
  ```bash
  # PostgreSQL
  postgresql+asyncpg://user:pass@host:5432/dbname
  
  # MySQL
  mysql+aiomysql://user:pass@host:3306/dbname
  
  # SQLite (default)
  sqlite:///./data/webui.db
  ```

#### Construcción Automática de DATABASE_URL:
Si NO estableces `DATABASE_URL` explícitamente, Open WebUI lo construye usando:
```bash
DATABASE_TYPE=postgresql  # o mysql, sqlite
DATABASE_USER=usuario
DATABASE_PASSWORD=contraseña
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=webui
```
> ⚠️ **Todos** los parámetros deben estar definidos para que funcione la construcción automática.

#### `DATABASE_USER_ACTIVE_STATUS_UPDATE_INTERVAL`
- **Tipo:** `float` (segundos)
- **Default:** `None` (sin throttling)
- **Descripción:** Intervalo mínimo entre actualizaciones del timestamp `last_active_at` del usuario.
- **⚠️ Crítico para producción:** Sin este valor, CADA petición autenticada escribe en la BD. Establecer a `300-500` segundos reduce drásticamente la carga.

#### `DATABASE_ENABLE_SESSION_SHARING`
- **Tipo:** `bool`
- **Default:** `False`
- **Recomendación:**
  - SQLite: Mantener `False` (puede causar problemas en hardware limitado)
  - PostgreSQL: Considerar `True` para mejor rendimiento en alta concurrencia

### 3.2.1 🔐 SQLite con SQLCipher (Encriptación)

#### Prerrequisitos:
```bash
# Sistema: libsqlcipher-dev (Debian/Ubuntu) o sqlcipher (macOS Homebrew)
# Python: pip install sqlcipher3-wheels
```

#### Configuración:
```bash
DATABASE_TYPE="sqlite+sqlcipher"
DATABASE_PASSWORD="tu-contraseña-segura"
```

> ⚠️ **No hay migración automática** desde SQLite no encriptado. Debes:
> 1. Empezar desde cero, o
> 2. Migrar manualmente con herramientas externas, o
> 3. Usar encriptación a nivel de filesystem (LUKS/BitLocker), o
> 4. Migrar a PostgreSQL

### 3.2.2 📊 Pool de Conexiones

#### `DATABASE_POOL_SIZE`
- **Tipo:** `int`
- **Default:** `None` (pero en SQLite usa fallback interno de **512** conexiones)
- **⚠️ Crítico en hardware limitado:** Cada conexión SQLite lleva ~64MB de cache + ~256MB de mmap. Con pool grande puede causar OOM.
- **Recomendación para Raspberry Pi/low-spec:** `DATABASE_POOL_SIZE=8`

#### `DATABASE_POOL_MAX_OVERFLOW`
- **Tipo:** `int`
- **Default:** `0`
- **Descripción:** Conexiones adicionales permitidas durante picos de tráfico.

#### `DATABASE_POOL_TIMEOUT` / `DATABASE_POOL_RECYCLE`
- **Descripción:** Timeout para obtener conexión y tiempo de reciclado de conexiones.

#### `DATABASE_ENABLE_SQLITE_WAL`
- **Tipo:** `bool`
- **Default:** `False`
- **Descripción:** Activa modo Write-Ahead Logging para mejor concurrencia en SQLite.

#### PRAGMAs de SQLite (Solo aplica a SQLite):
| Variable | Default | Descripción |
|----------|---------|-------------|
| `DATABASE_SQLITE_PRAGMA_SYNCHRONOUS` | `NORMAL` | Nivel de sincronización (OFF/NORMAL/FULL/EXTRA) |
| `DATABASE_SQLITE_PRAGMA_BUSY_TIMEOUT` | `5000` | Timeout en ms para esperar lock de escritura |
| `DATABASE_SQLITE_PRAGMA_CACHE_SIZE` | `-65536` | Tamaño de cache en KiB (negativo = KiB) |
| `DATABASE_SQLITE_PRAGMA_TEMP_STORE` | `MEMORY` | Almacenamiento de tablas temporales (MEMORY/FILE) |
| `DATABASE_SQLITE_PRAGMA_MMAP_SIZE` | `268435456` | Tamaño de memoria mapeada en bytes (~256MB) |
| `DATABASE_SQLITE_PRAGMA_JOURNAL_SIZE_LIMIT` | `67108864` | Límite de tamaño del WAL file (~64MB) |

> ⚠️ **Cache y MMAP son POR CONEXIÓN**, no globales. El consumo real = valor × conexiones activas simultáneas.

### 3.3 🗝️ Redis

#### `REDIS_URL`
- **Tipo:** `str`
- **Ejemplos:**
  ```bash
  redis://localhost:6379/0
  rediss://:password@localhost:6379/0  # con password y TLS
  rediss://redis-cluster:6379/0?ssl_cert_reqs=required&ssl_certfile=/tls/redis/tls.crt&ssl_keyfile=/tls/redis/tls.key&ssl_ca_certs=/tls/redis/ca.crt  # mTLS
  ```

> ⚠️ **OBLIGATORIO para:**
> - `UVICORN_WORKERS > 1`
> - Despliegues multi-nodo/multi-replica
> - Sin Redis: sesiones inconsistentes, websockets rotos, fallos de autenticación

#### Configuración CRÍTICA del Servidor Redis (NO variables de Open WebUI):
```conf
# redis.conf
maxclients 10000          # Default 1000 es insuficiente para producción
timeout 1800              # 30 min: cierra conexiones idle para evitar agotamiento
```

#### `REDIS_CLUSTER`
- **Tipo:** `bool`
- **Default:** `False`
- **Descripción:** Conectar a Redis Cluster en lugar de instancia única.

#### `REDIS_KEY_PREFIX`
- **Tipo:** `str`
- **Default:** `open-webui`
- **Descripción:** Prefijo para keys de Redis, permite múltiples instancias compartiendo mismo Redis.

#### `REDIS_SOCKET_CONNECT_TIMEOUT`
- **Tipo:** `float` (segundos)
- **Default:** `None`
- **⚠️ Crítico para Sentinel:** Sin timeout, failover puede colgar la aplicación indefinidamente.
- **Recomendación:** `REDIS_SOCKET_CONNECT_TIMEOUT=5`

#### `REDIS_HEALTH_CHECK_INTERVAL`
- **Tipo:** `int` (segundos)
- **Default:** `None` (desactivado)
- **Descripción:** Frecuencia de PING a conexiones idle para detectar sockets muertos antes de usarlos.
- **Recomendación:** `60` (menor que timeout del servidor Redis y firewalls)

#### Variables para WebSockets con Redis:
| Variable | Descripción |
|----------|-------------|
| `WEBSOCKET_MANAGER` | Manager para websockets: `redis` |
| `WEBSOCKET_REDIS_URL` | URL de Redis para websockets (puede diferir de REDIS_URL) |
| `WEBSOCKET_REDIS_OPTIONS` | JSON con opciones avanzadas: `{"retry_on_timeout": true, "socket_connect_timeout": 5}` |
| `WEBSOCKET_SERVER_PING_INTERVAL` / `WEBSOCKET_SERVER_PING_TIMEOUT` | Heartbeat de websockets |

### 3.4 ⚡ Uvicorn Settings

#### `UVICORN_WORKERS`
- **Tipo:** `int`
- **Default:** `1`
- **⚠️ ChromaDB NO compatible con >1 worker:** SQLite no es fork-safe. Si usas `UVICORN_WORKERS > 1`:
  - Usa `VECTOR_DB=pgvector` (o Milvus/Qdrant), O
  - Ejecuta ChromaDB como servidor HTTP separado: `CHROMA_HTTP_HOST=chromadb`

#### Migraciones de BD con Múltiples Workers/Pods:
```bash
# Opción 1: Designar un "master" para migraciones
ENABLE_DB_MIGRATIONS=True   # en UNA sola instancia
ENABLE_DB_MIGRATIONS=False  # en el resto

# Opción 2: Escalar a 1 durante actualización, luego escalar de nuevo
```

### 3.5 🔄 Cache Settings

#### `CACHE_CONTROL`
- **Tipo:** `str`
- **Default:** No establecido
- **Ejemplos:**
  ```bash
  "private, max-age=86400"              # Cache privado 24h
  "public, max-age=3600, must-revalidate"  # Cache público 1h con revalidación
  "no-cache, no-store, must-revalidate"    # Sin cache
  ```

### 3.6 🌐 Proxy Settings

```bash
http_proxy=http://proxy.example.com:8080
https_proxy=https://proxy.example.com:8080
no_proxy=localhost,127.0.0.1,.mit.edu
```

### 3.7 🔐 Security Variables

#### `WEBUI_SECRET_KEY`
- **Descripción:** Clave para encriptación de sesiones y tokens JWT.
- **⚠️ Crítico:** Sin esta variable persistente, serás deslogueado en cada reinicio y fallará la desencriptación de secrets.
- **Generación:**
  ```bash
  openssl rand -hex 32
  ```

#### `ENABLE_PERSISTENT_CONFIG`
- **Tipo:** `bool`
- **Default:** `True`
- **Descripción:** Si `False`, Open WebUI ignora valores almacenados en BD y usa SIEMPRE variables de entorno.
- **⚠️ Advertencia:** Con `False`, cambios en Admin UI NO se persisten tras reinicio.

### 3.8 🧭 Vector Databases

#### Opciones Soportadas:
| Database | Variable | Notas |
|----------|----------|-------|
| **ChromaDB** (default) | `VECTOR_DB=chroma` | SQLite local, NO seguro para multi-worker |
| **PGVector** | `VECTOR_DB=pgvector` | ✅ Recomendado para producción |
| **Milvus** | `VECTOR_DB=milvus` | ✅ Escalable |
| **Qdrant** | `VECTOR_DB=qdrant` | ✅ Escalable |
| **Elasticsearch** | `VECTOR_DB=elasticsearch` | ✅ Búsqueda híbrida |
| **OpenSearch** | `VECTOR_DB=opensearch` | ✅ Búsqueda híbrida |
| **MariaDB Vector** | `VECTOR_DB=mariadb` | ✅ |
| **Pinecone** | `VECTOR_DB=pinecone` | ✅ Cloud |
| **Weaviate** | `VECTOR_DB=weaviate` | ✅ |
| **Oracle 23ai** | `VECTOR_DB=oracle23ai` | ✅ |
| **S3 Vector** | `VECTOR_DB=s3` | ✅ Cloud storage |
| **Valkey** | `VECTOR_DB=valkey` | ✅ Redis-compatible |

#### Configuración ChromaDB como Servidor HTTP (para multi-worker):
```bash
CHROMA_HTTP_HOST=chromadb
CHROMA_HTTP_PORT=8000
CHROMA_TENANT=default_tenant
```

### 3.9 📚 RAG (Retrieval-Augmented Generation)

#### Core Configuration:
| Variable | Default | Descripción |
|----------|---------|-------------|
| `RAG_TOP_K` | `3` | Número de documentos a recuperar |
| `RAG_RELEVANCE_THRESHOLD` | `0.0` | Umbral mínimo de relevancia para incluir documento |
| `RAG_EMBEDDING_ENGINE` | `""` | Motor de embeddings: `ollama`, `openai`, `huggingface`, etc. |
| `RAG_EMBEDDING_MODEL` | `""` | Modelo específico para embeddings |
| `RAG_RERANKING_MODEL` | `""` | Modelo para re-ranking de resultados |
| `RAG_TEXT_SPLITTER` | `""` | Estrategia de chunking de documentos |

#### Document Processing:
| Variable | Descripción |
|----------|-------------|
| `RAG_CONTENT_EXTRACTION_ENGINE` | Motor para extraer texto: `tika`, `docling`, `azure`, `mistral-ocr`, `custom` |
| `RAG_FILE_MAX_COUNT` | Límite de archivos por procesamiento |
| `RAG_FILE_MAX_SIZE` | Tamaño máximo por archivo (bytes) |

#### Embedding Engines:
```bash
# Ollama
RAG_EMBEDDING_ENGINE=ollama
RAG_EMBEDDING_MODEL=nomic-embed-text-v1.5

# OpenAI
RAG_EMBEDDING_ENGINE=openai
OPENAI_API_KEY=sk-xxx
RAG_EMBEDDING_MODEL=text-embedding-3-small

# HuggingFace (local)
RAG_EMBEDDING_ENGINE=huggingface
RAG_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

#### Reranking:
```bash
# Cross-encoder para mejorar relevancia
RAG_RERANKING_MODEL=cross-encoder/ms-marco-MiniLM-L-6-v2
RAG_RERANKING_TOP_N=10  # Re-rankear top-N antes de enviar al modelo
```

### 3.10 🔍 Web Search

#### Configuración:
| Variable | Descripción |
|----------|-------------|
| `ENABLE_WEB_SEARCH` | Activa/desactiva búsqueda web |
| `WEB_SEARCH_ENGINE` | Motor: `searxng`, `google`, `bing`, `duckduckgo`, `serpapi`, `serper`, `jina`, `tavily`, `exa` |
| `WEB_SEARCH_RESULT_COUNT` | Número de resultados a recuperar |
| `WEB_SEARCH_DOMAIN_FILTER` | Dominios a incluir/excluir |

#### SearXNG (Recomendado para privacidad):
```bash
WEB_SEARCH_ENGINE=searxng
SEARXNG_QUERY_URL=http://searxng:8080/search?q=<query>&format=json
```

### 3.11 🎙️ Audio

#### Speech-to-Text (STT):
| Variable | Motor | Notas |
|----------|-------|-------|
| `WHISPER_MODEL` | Whisper local | Modelos: `tiny`, `base`, `small`, `medium`, `large` |
| `STT_OPENAI_API_KEY` | OpenAI Whisper | Requiere API key |
| `STT_AZURE_API_KEY` | Azure Speech | Requiere configuración Azure |
| `STT_DEEPGRAM_API_KEY` | Deepgram | Alta precisión, pago |
| `STT_MISTRAL_API_KEY` | Mistral | Nuevo soporte |

#### Text-to-Speech (TTS):
| Variable | Motor | Notas |
|----------|-------|-------|
| `TTS_OPENAI_API_KEY` | OpenAI TTS | Voces: `alloy`, `echo`, `fable`, etc. |
| `TTS_AZURE_API_KEY` | Azure TTS | Voces neuronales de alta calidad |
| `TTS_ELEVENLABS_API_KEY` | ElevenLabs | Voces ultra-realistas, pago |
| `TTS_MISTRAL_API_KEY` | Mistral TTS | Nuevo soporte |

#### Voice Mode:
```bash
ENABLE_VOICE_MODE=True  # Activa modo de conversación por voz
VOICE_MODE_MODEL=llama-3-70b  # Modelo para procesamiento de voz
```

### 3.12 🖼️ Image Generation

#### Configuración General:
| Variable | Descripción |
|----------|-------------|
| `ENABLE_IMAGE_GENERATION` | Activa/desactiva generación de imágenes |
| `IMAGE_GENERATION_MODEL` | Modelo por defecto: `dall-e-3`, `gemini`, `comfyui`, `automatic1111` |
| `IMAGE_SIZE` | Tamaño: `256x256`, `512x512`, `1024x1024` |

#### OpenAI DALL-E:
```bash
IMAGE_GENERATION_MODEL=dall-e-3
OPENAI_API_KEY=sk-xxx
```

#### ComfyUI:
```bash
COMFYUI_BASE_URL=http://comfyui:8188
COMFYUI_WORKFLOW_ID=default_workflow
```

#### AUTOMATIC1111:
```bash
AUTO1111_BASE_URL=http://auto1111:7860
AUTO1111_API_AUTH=user:pass  # si tiene auth
```

### 3.13 🔐 OAuth/SSO/LDAP/SCIM

#### OAuth General:
```bash
ENABLE_OAUTH_SIGNUP=True
OAUTH_MERGE_ACCOUNTS_BY_EMAIL=True  # Fusionar cuentas si email coincide
```

#### Google OAuth:
```bash
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_OAUTH_SCOPE=openid email profile
```

#### Microsoft OAuth:
```bash
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx
MICROSOFT_TENANT_ID=common  # o tenant específico
```

#### GitHub OAuth:
```bash
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

#### OpenID Connect (OIDC):
```bash
OIDC_CLIENT_ID=xxx
OIDC_CLIENT_SECRET=xxx
OIDC_PROVIDER_URL=https://auth.example.com/.well-known/openid-configuration
OIDC_REDIRECT_URI=https://webui.example.com/oauth/callback
```

#### LDAP:
```bash
ENABLE_LDAP=True
LDAP_SERVER=ldap://ldap.example.com
LDAP_BIND_DN=cn=admin,dc=example,dc=com
LDAP_BIND_PASSWORD=secret
LDAP_USER_FILTER=(uid=%(username)s)
LDAP_USER_BASE=ou=users,dc=example,dc=com
```

#### SCIM 2.0:
```bash
ENABLE_SCIM=True
SCIM_BASE_URL=https://scim.example.com
SCIM_API_KEY=xxx
```

### 3.14 👥 Permisos de Usuario

#### Chat Permissions:
```bash
# Controlar qué pueden hacer los usuarios en chats
features.chats.create
features.chats.edit
features.chats.delete
features.chats.share
```

#### Feature Permissions:
```bash
features.memories          # Acceso a memoria del usuario
features.web_search        # Búsqueda web
features.image_generation  # Generación de imágenes
features.code_interpreter  # Ejecución de código
features.notes             # Notas
features.channels          # Canales
features.automations       # Automatizaciones
features.calendar          # Calendario
```

#### Workspace Permissions:
```bash
workspace.models.create    # Crear modelos personalizados
workspace.models.edit      # Editar modelos
workspace.knowledge.create # Crear bases de conocimiento
workspace.functions.create # Crear funciones/tools
```

#### Sharing Permissions:
```bash
sharing.private  # Compartir con usuarios/grupos específicos
sharing.public   # Compartir públicamente (con enlace)
```

---

## 4. ✨ Características Principales

### 4.1 💬 Chat y Conversaciones

#### Funcionalidades:
| Feature | Descripción |
|---------|-------------|
| 🔀 **Multi-model chats** | Ejecutar dos modelos lado a lado y comparar respuestas |
| 📎 **File & image uploads** | Adjuntar documentos, imágenes y código para análisis |
| 🔍 **Web search** | IA busca en web y cita fuentes en tiempo real |
| 🐍 **Code execution** | Ejecutar Python directamente en navegador o vía Open Terminal |
| 📝 **Message queue** | Seguir escribiendo mientras la IA responde - mensajes se envían automáticamente |
| 🧠 **Memory** | La IA recuerda hechos sobre ti entre conversaciones |
| 🗂️ **Folders, tags, pins** | Organizar conversaciones como prefieras |
| 🎤 **Voice & audio** | Speech-to-text, text-to-speech, llamadas de voz/video manos libres |
| 🖼️ **Image generation** | Crear/editar imágenes con DALL-E, Gemini, ComfyUI, etc. |
| ⏱️ **Automations** | Programar prompts para ejecutarse automáticamente |
| ✅ **Task management** | Modelos mantienen listas de tareas estructuradas para workflows multi-paso |

### 4.2 📚 Conocimiento y RAG

#### Capacidades:
| Feature | Descripción |
|---------|-------------|
| 📄 **9 vector databases** | ChromaDB y PGVector (oficiales), + Qdrant, Milvus, Elasticsearch, etc. |
| 🔍 **Hybrid search** | BM25 + vector search con re-ranking por cross-encoder |
| 📑 **5 extraction engines** | Tika, Docling, Azure, Mistral OCR, loaders personalizados |
| 🤖 **Agentic retrieval** | Modelos buscan y leen documentos autónomamente |
| 📄 **Full context mode** | Inyectar documentos completos - sin chunking, sin adivinar |
| 🔄 **Knowledge Base sync** | Mantener KB actualizada con carpeta, repo Git, wiki, o bucket via `oikb` |

#### Modos de Recuperación:
1. **Vector Search (RAG)**: Para colecciones grandes, búsqueda semántica
2. **Full-Content Injection**: Para precisión máxima, inyecta documento completo
3. **Hybrid**: Combina ambos para equilibrio relevancia/precisión

### 4.3 🤖 Modelos y Agentes

#### Model Presets:
```yaml
# Ejemplo de configuración de modelo personalizado
model:
  id: "python-tutor"
  base_model: "llama-3-70b"
  system_prompt: |
    Eres un tutor experto en Python. 
    Explica conceptos claramente, proporciona ejemplos ejecutables,
    y adapta tu nivel al conocimiento del usuario.
  tools:
    - code_interpreter
    - web_search
  knowledge_bases:
    - "python-best-practices"
  parameters:
    temperature: 0.3
    max_tokens: 4096
```

#### Dynamic Variables:
```
{{ USER_NAME }}      # Nombre del usuario actual
{{ CURRENT_DATE }}   # Fecha actual
{{ CURRENT_TIME }}   # Hora actual
{{ USER_EMAIL }}     # Email del usuario
{{ MODEL_NAME }}     # Nombre del modelo en uso
```

#### Bound Tools:
- Forzar habilitación de herramientas específicas por modelo
- Ejemplo: Modelo "Code Reviewer" siempre tiene `code_interpreter` y `web_search`

### 4.4 📝 Notes

#### Características:
| Feature | Descripción |
|---------|-------------|
| ✍️ **Rich editor** | Markdown y Rich Text con barra de formato flotante |
| 🤖 **AI Enhance** | Reescribir o mejorar texto seleccionado in-place |
| 📎 **Context injection** | Adjuntar notas a cualquier chat para contexto de fidelidad completa |
| 🔍 **Agentic access** | Modelos pueden buscar, leer y actualizar notas autónomamente |

#### Uso:
```markdown
# Mi Nota de Proyecto

## Contexto
Este proyecto usa FastAPI + PostgreSQL...

## Pendientes
- [ ] Implementar autenticación JWT
- [ ] Configurar migraciones con Alembic

> @gpt-4: ¿Puedes revisar esta arquitectura?
```

### 4.5 💬 Channels

#### Características:
| Feature | Descripción |
|---------|-------------|
| 🤖 **@model tagging** | Invocar cualquier modelo de IA en la conversación bajo demanda |
| 🧵 **Threads & reactions** | Respuestas anidadas, pins, y reacciones con emoji |
| 🔒 **Access control** | Canales públicos, privados, basados en grupos, y mensajes directos |
| 🧠 **AI channel awareness** | Modelos buscan y sintetizan información entre canales autónomamente |

#### Ejemplo de Uso:
```
@team: Necesitamos planificar el sprint.

@gpt-4o: Aquí hay una propuesta inicial...

@claude: Revisando la propuesta, sugiero estos ajustes...

@team: 👍 Aprobado. @gpt-4o, crea las tareas en el sistema.
```

### 4.6 ⚡ Open Terminal

#### Características:
| Feature | Descripción |
|---------|-------------|
| 🖥️ **Code execution** | Ejecuta comandos reales y devuelve output |
| 📁 **File browser** | Navegar, subir, descargar y editar archivos en sidebar |
| 🌐 **Website preview** | Vista previa en vivo de proyectos web dentro de Open WebUI |
| 🔒 **Isolation optional** | Contenedor Docker o bare metal |

#### Configuración de Seguridad:
```bash
# Aislar terminal en contenedor Docker
TERMINAL_DOCKER_IMAGE=python:3.11-slim
TERMINAL_ALLOWED_COMMANDS=python,pip,ls,cat,grep  # Whitelist de comandos

# O usar bare metal (más riesgo)
TERMINAL_ISOLATION=none  # NO recomendado para producción
```

### 4.7 🔌 Extensibilidad

#### Tools & Functions (Python):
```python
# tools/my_tool.py
"""
title: Buscar en Base de Datos
description: Consulta la BD interna de usuarios
"""

from open_webui.utils.db import get_db

def search_users(query: str) -> list:
    """Busca usuarios por nombre o email"""
    db = get_db()
    results = db.execute(
        "SELECT id, name, email FROM users WHERE name LIKE ? OR email LIKE ?",
        (f"%{query}%", f"%{query}%")
    ).fetchall()
    return [dict(row) for row in results]
```

#### Pipelines (Plugin Framework):
```python
# pipelines/my_filter.py
"""
title: Filtro de Contenido
description: Filtra contenido inapropiado antes de enviar al modelo
"""

def inlet(body: dict, __user__: dict) -> dict:
    """Procesa mensaje antes de enviar al modelo"""
    message = body["messages"][-1]["content"]
    
    # Lógica de filtrado personalizada
    if contains_profanity(message):
        body["messages"][-1]["content"] = "[Contenido filtrado]"
    
    return body

def outlet(body: dict, __user__: dict) -> dict:
    """Procesa respuesta del modelo antes de mostrar al usuario"""
    # Lógica post-procesamiento
    return body
```

#### MCP (Model Context Protocol):
```bash
# Conectar a servidor MCP nativo HTTP
MCP_SERVER_URL=https://mcp.example.com/sse

# O usar MCPO Proxy para servidores stdio
MCPO_PROXY_COMMAND=python /path/to/mcp-server.py
```

#### OpenAPI Servers:
```bash
# Auto-descubrir herramientas de endpoint OpenAPI
OPENAPI_SERVER_URL=https://api.example.com/openapi.json
OPENAPI_SERVER_AUTH=Bearer sk-xxx
```

#### Skills (Markdown Instructions):
```markdown
# skill: code-reviewer.md

## Rol
Eres un revisor de código senior experto en Python, TypeScript y Go.

## Reglas
1. Prioriza legibilidad sobre optimización prematura
2. Sugiere tests para lógica compleja
3. Identifica posibles vulnerabilidades de seguridad
4. Usa tono constructivo y educativo

## Formato de Respuesta
- 📋 Resumen ejecutivo
- 🔍 Hallazgos detallados (con líneas de código)
- 💡 Sugerencias de mejora
- ✅ Checklist de aprobación
```

---

## 5. 🔐 Autenticación y Acceso

### 5.1 👥 RBAC (Role-Based Access Control)

#### Roles Predefinidos:
| Rol | Permisos |
|-----|----------|
| `admin` | Acceso completo: usuarios, configuración, modelos, conocimiento |
| `user` | Acceso básico: chats, modelos compartidos, conocimiento con permisos |
| `pending` | Sin acceso hasta aprobación por admin |

#### Crear Rol Personalizado:
```bash
# Via Admin Panel > Users > Roles
# O via API:
curl -X POST https://webui.example.com/api/v1/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "developer",
    "permissions": [
      "features.chats.create",
      "features.code_interpreter",
      "workspace.models.create",
      "workspace.functions.create"
    ]
  }'
```

### 5.2 🔐 SSO/OIDC/LDAP

#### Flujo OIDC Típico:
```mermaid
sequenceDiagram
    participant U as Usuario
    participant W as Open WebUI
    participant I as Identity Provider
    participant D as Base de Datos
    
    U->>W: Click "Login with OIDC"
    W->>I: Redirect to /authorize
    I->>U: Login form
    U->>I: Credentials
    I->>W: Redirect with code
    W->>I: Exchange code for tokens
    I->>W: ID token + access token
    W->>D: Lookup/create user by email/sub
    W->>U: Session established
```

#### Mapeo de Claims a Roles:
```bash
# En Admin Panel > Settings > OAuth
OIDC_ROLE_CLAIM=groups  # Claim que contiene roles
OIDC_ROLE_MAPPING={
  "admin-group": "admin",
  "user-group": "user",
  "readonly-group": "user"
}
```

### 5.3 🔑 API Keys

#### Crear API Key:
```bash
# Via UI: Settings > Account > API Keys
# O via API:
curl -X POST https://webui.example.com/api/v1/api_keys \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "automation-script", "permissions": ["chats:create", "models:read"]}'
```

#### Usar API Key:
```bash
# Chat Completion (compatible con OpenAI API)
curl https://webui.example.com/v1/chat/completions \
  -H "Authorization: Bearer sk-webui-xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3-70b",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

#### Restricciones de Endpoint por API Key:
```bash
# Limitar qué endpoints puede usar una API key
API_KEY_ENDPOINT_RESTRICTIONS={
  "sk-webui-xxx": ["/v1/chat/completions", "/v1/models"]
}
```

### 5.4 📋 SCIM 2.0

#### Provisionamiento Automático:
```bash
# Configurar en Identity Provider (Okta, Azure AD, etc.)
SCIM Base URL: https://webui.example.com/scim/v2
Bearer Token: xxx

# Mapeo de atributos:
userName → email
name.givenName → first_name
name.familyName → last_name
groups → group_ids
```

#### Sincronización de Grupos:
```bash
# Los grupos del IdP se sincronizan con grupos de Open WebUI
# Permite gestión centralizada de acceso a modelos/conocimiento
```

---

## 6. ⚙️ Administración

### 6.1 📊 Analytics

#### Métricas Disponibles:
| Métrica | Descripción |
|---------|-------------|
| `messages_total` | Total de mensajes enviados |
| `tokens_input` / `tokens_output` | Tokens consumidos por modelo |
| `cost_estimate` | Costo estimado (si se configuran precios por modelo) |
| `users_active_7d` | Usuarios activos últimos 7 días |
| `models_usage` | Uso por modelo (ranking) |
| `rag_queries` | Consultas RAG ejecutadas |

#### Exportar Datos:
```bash
# Via Admin Panel > Analytics > Export
# O via API:
curl https://webui.example.com/api/v1/analytics/export \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"start_date": "2024-01-01", "end_date": "2024-01-31", "format": "csv"}'
```

### 6.2 🏆 Evaluación de Modelos

#### Arena de Modelos:
```bash
# Configurar en Admin Panel > Evaluation > Arena
# Los usuarios votan respuestas ciegas de modelos A/B
# Sistema calcula ELO rating automáticamente
```

#### Métricas de Evaluación:
- **Win Rate**: % de victorias en comparaciones ciegas
- **ELO Rating**: Sistema de ranking tipo chess
- **Latency P50/P95**: Tiempos de respuesta
- **Cost per Query**: Costo promedio por consulta

#### A/B Testing:
```bash
# Asignar tráfico a diferentes modelos para testing
MODEL_A_B_TEST={
  "experiment_id": "prompt-v2-test",
  "model_a": "llama-3-70b",
  "model_b": "mixtral-8x22b",
  "traffic_split": 0.5,  # 50/50
  "success_metric": "user_rating"
}
```

### 6.3 📢 Banners y Webhooks

#### System Banners:
```bash
# Mostrar mensaje global a todos los usuarios
# Admin Panel > Settings > Banners
{
  "message": "Mantenimiento programado: 2024-06-15 02:00 UTC",
  "type": "warning",  # info | warning | error | success
  "dismissible": true,
  "start_date": "2024-06-14",
  "end_date": "2024-06-15"
}
```

#### Webhooks:
```bash
# Eventos disponibles:
- user.signup          # Nuevo usuario registrado
- user.login           # Inicio de sesión
- chat.completed       # Chat finalizado
- rag.query            # Consulta RAG ejecutada
- tool.called          # Herramienta ejecutada

# Configuración:
WEBHOOK_URL=https://hooks.example.com/open-webui
WEBHOOK_EVENTS=["user.signup", "chat.completed"]
WEBHOOK_SECRET=whsec_xxx  # Para firmar payloads
```

#### Payload de Ejemplo (chat.completed):
```json
{
  "event": "chat.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "chat_id": "chat_abc123",
    "user_id": "user_xyz789",
    "model": "llama-3-70b",
    "tokens_input": 1250,
    "tokens_output": 430,
    "duration_ms": 3420,
    "rag_used": true,
    "tools_called": ["web_search", "code_interpreter"]
  }
}
```

---

## 7. ⚖️ Escalado y Alta Disponibilidad

### Arquitectura Recomendada para Producción:

```mermaid
graph LR
    LB[Load Balancer] --> W1[Open WebUI Pod 1]
    LB --> W2[Open WebUI Pod 2]
    LB --> W3[Open WebUI Pod 3]
    
    W1 --> R[Redis Cluster]
    W2 --> R
    W3 --> R
    
    W1 --> PG[(PostgreSQL)]
    W2 --> PG
    W3 --> PG
    
    W1 --> V[Vector DB: PGVector/Milvus/Qdrant]
    W2 --> V
    W3 --> V
    
    W1 --> S3[(S3/GCS/Azure Blob)]
    W2 --> S3
    W3 --> S3
```

### Requisitos por Componente:

#### Redis (Obligatorio para multi-worker):
```bash
# redis.conf para producción
maxclients 10000
timeout 1800
tcp-keepalive 60
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
```

#### PostgreSQL:
```bash
# postgresql.conf tuning básico
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
```

#### Vector Database (NO usar ChromaDB local para multi-replica):
```bash
# PGVector (recomendado)
VECTOR_DB=pgvector
DATABASE_URL=postgresql+asyncpg://user:pass@pg:5432/webui

# O Milvus/Qdrant como servicio separado
```

#### Storage para Archivos:
```bash
# Cloud storage para stateless instances
STORAGE_TYPE=s3  # o gcs, azure
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx
S3_BUCKET=open-webui-files
S3_REGION=us-east-1
```

### OpenTelemetry para Observabilidad:
```bash
ENABLE_OTEL=True
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel-collector:4317
OTEL_SERVICE_NAME=open-webui
OTEL_RESOURCE_ATTRIBUTES=deployment=production,region=us-east-1
```

#### Métricas Exportadas:
- `http.server.duration`: Latencia de endpoints HTTP
- `db.client.operation.duration`: Consultas a BD
- `rag.retrieval.duration`: Tiempo de recuperación RAG
- `model.inference.duration`: Tiempo de inferencia por modelo

### Auto-scaling en Kubernetes:
```yaml
# HPA para escalar basado en CPU/memoria
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: open-webui-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: open-webui
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 8. 🛠️ Troubleshooting (Guía Completa)

### 8.1 🔍 Quick Symptom Lookup

| Síntoma | Guía a Consultar |
|---------|-----------------|
| Respuestas `"{}"` vacías, markdown corrupto, errores CORS | Connection Errors → HTTPS/CORS/WebSocket |
| `WebSocket connection failed: 403` o chat se cuelga | Connection Errors → WebSocket |
| No se puede conectar a Ollama desde Open WebUI | Connection Errors → Ollama |
| Lista de modelos tarda mucho / `500` en `/api/models` | Connection Errors → Model List Loading |
| `[SSL: CERTIFICATE_VERIFY_FAILED]` | Connection Errors → SSL |
| Login loops, 401 Unauthorized, errores de token entre réplicas | Scaling & HA → Login Loops |
| `database is locked`, datos desaparecen entre instancias | Scaling & HA → Database |
| Worker crash: `Child process [pid] died` durante upload | RAG → Worker Crashes |
| Modelo ignora base de conocimiento adjunta | RAG → Knowledge Base Not Working |
| Agente se detiene a mitad de tarea tras muchas llamadas | `CHAT_RESPONSE_MAX_TOOL_CALL_ITERATIONS` |
| `NoneType object has no attribute 'encode'` | RAG → Embedding Error |
| CUDA out of memory durante embedding | RAG → CUDA OOM |
| OAuth redirect loops, CSRF state mismatch | SSO & OAuth |
| `CSRF Warning! State not equal in request and response` | SSO → CSRF Errors |
| TTS cargando eternamente, `Dataset scripts are no longer supported` | Audio → TTS Issues |
| Whisper `int8 compute type` error | Audio → STT Issues |
| Micrófono no funciona (non-HTTPS) | Audio → Microphone |
| Imagen no se genera, errores de workflow ComfyUI | Image Generation |
| Búsqueda web devuelve contenido vacío o errores de proxy | Web Search |
| Rendimiento lento, RAM alta, crashes OOM | Performance & RAM |
| Container OOM-killed al editar permisos (SQLite) | Performance & RAM → SQLite Memory Footprint |
| "The prompt is too long" / contexto excedido | Context Window / Prompt Too Long |
| Olvidé contraseña de admin | Reset Admin Password |
| `no such table` o `table already exists` al inicio | Database Migration |

### 8.2 🌐 Connection Errors

#### HTTPS/CORS/WebSocket:
```bash
# Si usas reverse proxy (Nginx/Caddy):
# Asegurar headers WebSocket:
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";

# CORS: Si Open WebUI y frontend están en dominios distintos
CORS_ALLOW_ORIGIN="https://tu-frontend.com"
```

#### Ollama Connection:
```bash
# Open WebUI → Ollama en mismo host Docker:
OLLAMA_BASE_URL=http://host.docker.internal:11434

# Ollama en contenedor separado:
OLLAMA_BASE_URL=http://ollama:11434

# Verificar conectividad:
docker exec open-webui curl -v http://ollama:11434/api/tags
```

#### SSL/TLS:
```bash
# Error: CERTIFICATE_VERIFY_FAILED
# Solución 1: Usar mirror de HuggingFace
HF_ENDPOINT=https://hf-mirror.com/

# Solución 2: Añadir certificado CA personalizado
SSL_CERT_FILE=/path/to/ca-bundle.crt
REQUESTS_CA_BUNDLE=/path/to/ca-bundle.crt
```

### 8.3 📚 RAG Troubleshooting

#### Knowledge Base Not Working:
```bash
# Verificar:
1. ¿El usuario tiene permisos de lectura en el KB?
2. ¿El modelo tiene función calling habilitado?
3. ¿Los embeddings se generaron correctamente?

# Logs para debug:
docker logs open-webui | grep -i "rag\|embedding\|retrieval"
```

#### Embedding Error (`NoneType object has no attribute 'encode'`):
```bash
# Causa común: Modelo de embedding no cargado correctamente
# Solución:
1. Verificar RAG_EMBEDDING_ENGINE y RAG_EMBEDDING_MODEL
2. Si usas Ollama: ollama pull nomic-embed-text-v1.5
3. Reiniciar contenedor tras cambiar configuración
```

#### CUDA OOM durante Embedding:
```bash
# Reducir batch size de procesamiento:
RAG_EMBEDDING_BATCH_SIZE=8  # Default puede ser 32+

# O usar CPU para embeddings (más lento pero estable):
RAG_EMBEDDING_DEVICE=cpu
```

#### Worker Crashes durante Upload:
```bash
# Causa: ChromaDB SQLite no es fork-safe con UVICORN_WORKERS > 1
# Solución:
1. Usar UVICORN_WORKERS=1, O
2. Migrar a PGVector/Milvus/Qdrant, O
3. Ejecutar ChromaDB como servidor HTTP separado
```

### 8.4 🔐 SSO & OAuth

#### CSRF Errors:
```bash
# Causa: WEBUI_SECRET_KEY no persistente o diferente entre réplicas
# Solución:
WEBUI_SECRET_KEY=openssl rand -hex 32  # Mismo valor en TODAS las instancias

# Para multi-replica con Redis:
ENABLE_STAR_SESSIONS_MIDDLEWARE=True  # Experimental
```

#### Redirect Loops:
```bash
# Verificar:
1. WEBUI_URL coincide exactamente con el dominio usado por usuarios
2. OIDC_REDIRECT_URI registrado en IdP coincide con WEBUI_URL/oauth/callback
3. No hay redirecciones intermedias que modifiquen la URL
```

### 8.5 🎙️ Audio Issues

#### TTS Loading Forever:
```bash
# Causa: Modelos de TTS no descargados o incompatibilidad de librerías
# Solución:
1. Verificar logs: docker logs open-webui | grep -i "tts\|download"
2. Si usas imagen slim: esperar primera descarga, o usar imagen completa
3. Verificar compatibilidad Python 3.11 (3.13 no soportado)
```

#### Microphone Not Working:
```bash
# Requisito: HTTPS para acceso a micrófono en navegadores modernos
# Solución:
1. Configurar reverse proxy con certificado válido (Let's Encrypt)
2. O usar localhost (permitido sin HTTPS para desarrollo)
```

### 8.6 🖼️ Image Generation Issues

#### ComfyUI Workflow Errors:
```bash
# Verificar:
1. COMFYUI_BASE_URL accesible desde contenedor Open WebUI
2. Workflow ID existe en ComfyUI
3. Inputs del workflow coinciden con lo que envía Open WebUI

# Debug:
curl -X POST http://comfyui:8188/prompt \
  -H "Content-Type: application/json" \
  -d @test-workflow.json
```

### 8.7 ⚡ Performance & RAM

#### SQLite Memory Footprint en Contenedores Limitados:
```bash
# Problema: Pool grande × cache por conexión = OOM
# Solución para Raspberry Pi / low-spec:

DATABASE_POOL_SIZE=8
DATABASE_SQLITE_PRAGMA_CACHE_SIZE=-2000    # ~2MB por conexión
DATABASE_SQLITE_PRAGMA_MMAP_SIZE=0           # Desactivar mmap
DATABASE_USER_ACTIVE_STATUS_UPDATE_INTERVAL=300  # Throttling de writes
```

#### Slow Admin Page Loads:
```bash
# Causa común: DATABASE_ENABLE_SESSION_SHARING=True en SQLite con hardware limitado
# Solución:
DATABASE_ENABLE_SESSION_SHARING=False
```

### 8.8 🔄 Database Migration

#### Manual Alembic Migration:
```bash
# Si actualización falla con "table already exists":
docker exec -it open-webui bash
cd /app/backend
alembic upgrade head  # Forzar migración

# O rollback a versión anterior:
alembic downgrade -1
```

#### Backup antes de Actualizar:
```bash
# Backup de volumen Docker:
docker run --rm \
  -v open-webui:/source \
  -v $(pwd):/backup \
  alpine tar czf /backup/open-webui-backup-$(date +%Y%m%d).tar.gz -C /source .

# Backup de PostgreSQL:
docker exec postgres pg_dump -U user webui > backup.sql
```

---

## 9. ❓ FAQ (Preguntas Frecuentes)

### Q: "The prompt is too long" / "context length exceeded"
**A:** El error viene del **proveedor del modelo**, no de Open WebUI. El proveedor cuenta tokens de: system prompt + historial completo + archivos adjuntos + tool calls + tu nuevo mensaje.

**Solución:** Usar filter Functions para gestionar contexto:
```python
# functions/context_filter.py
def inlet(body: dict, __user__: dict) -> dict:
    """Mantiene solo los últimos N turnos de conversación"""
    max_turns = 10  # Ajustar según modelo
    messages = body["messages"]
    
    # Mantener system prompt + últimos N turnos
    system = [m for m in messages if m["role"] == "system"]
    rest = [m for m in messages if m["role"] != "system"]
    
    body["messages"] = system + rest[-max_turns*2:]  # *2 para user+assistant
    return body
```

### Q: STT/TTS no funciona en mi despliegue
**A:** Los navegadores modernos restringen STT/TTS a conexiones **HTTPS**. Si tu despliegue no usa HTTPS, estas funciones pueden no operar.

**Solución:** Configurar reverse proxy con certificado válido (Let's Encrypt recomendado).

### Q: RAG con Open WebUI es muy malo o no funciona
**A:** Si usas **Ollama**, recuerda que el contexto por defecto es **2048 tokens**. Los documentos recuperados pueden no caber.

**Solución:** Aumentar contexto en Ollama:
```bash
# En chat o editor de modelo:
{
  "num_ctx": 8192,
  "num_predict": 2048
}
```

### Q: Actualicé/reinicié y me deslogueé / "Error decrypting tokens"
**A:** Falta `WEBUI_SECRET_KEY` persistente. Sin ella, Open WebUI genera clave aleatoria en cada inicio, invalidando sesiones y secrets.

**Solución:**
```bash
# Generar y establecer clave persistente:
WEBUI_SECRET_KEY=$(openssl rand -hex 32)

# En docker-compose.yml:
environment:
  WEBUI_SECRET_KEY: ${WEBUI_SECRET_KEY}
```

### Q: Actualicé y perdí mis chats / tengo que crear nueva cuenta
**A:** El contenedor se ejecutó sin montar el volumen `/app/backend/data`, o el volumen fue eliminado.

**Solución:** Siempre usar `-v open-webui:/app/backend/data` en Docker.

### Q: Intenté login, creé nueva cuenta y me pide activación por admin
**A:** Olvidaste la contraseña del admin inicial (primer cuenta creada). Nuevas cuentas requieren aprobación.

**Solución:** Resetear contraseña de admin (ver guía "Reset Admin Password").

### Q: Open WebUI no inicia con error SSL
**A:** Falta de certificados SSL o configuración incorrecta de huggingface.co.

**Solución:** Usar mirror de HuggingFace:
```bash
-e HF_ENDPOINT=https://hf-mirror.com/
```

### Q: ¿Open WebUI escala para organizaciones grandes?
**A:** ✅ Sí. Arquitectura stateless + contenedores permite escalar horizontalmente. Organizaciones con decenas de miles de usuarios usan Open WebUI con:
- Load balancers
- Redis para sesiones
- PostgreSQL + PGVector para datos
- Cloud storage para archivos
- SSO/OIDC para autenticación empresarial

### Q: ¿Por qué no soporta nativamente [Proveedor X]?
**A:** Open WebUI prioriza **protocolos universales** (OpenAI Chat Completions) sobre APIs propietarias. Para proveedores no estándar:

1. Usar **Pipes** de la comunidad (instalación con un clic)
2. Usar middleware como LiteLLM o OpenRouter para traducción de APIs
3. Contribuir con un pipe propio al ecosistema

---

## 10. 🔌 Referencia de API

### Autenticación:
```bash
# Login para obtener token
POST /api/v1/auths/signin
{
  "email": "user@example.com",
  "password": "secret"
}
# Response: { "token": "jwt_xxx", "id": "user_xxx" }

# Usar token en requests subsiguientes:
Authorization: Bearer jwt_xxx
```

### Chat Completions (OpenAI-compatible):
```bash
POST /v1/chat/completions
{
  "model": "llama-3-70b",
  "messages": [
    {"role": "system", "content": "Eres un asistente útil"},
    {"role": "user", "content": "¿Qué es Open WebUI?"}
  ],
  "stream": true,
  "temperature": 0.7
}
```

### Gestión de Chats:
```bash
# Listar chats del usuario
GET /api/v1/chats

# Crear nuevo chat
POST /api/v1/chats
{
  "title": "Mi nuevo chat",
  "model": "llama-3-70b"
}

# Obtener chat específico
GET /api/v1/chats/{chat_id}

# Eliminar chat
DELETE /api/v1/chats/{chat_id}
```

### Gestión de Modelos:
```bash
# Listar modelos disponibles
GET /api/v1/models

# Crear modelo personalizado
POST /api/v1/models
{
  "id": "mi-modelo-personalizado",
  "base_model_id": "llama-3-70b",
  "meta": {
    "description": "Modelo para soporte técnico",
    "capabilities": {"web_search": true}
  },
  "params": {
    "temperature": 0.2,
    "system_prompt": "Eres un experto en soporte técnico..."
  }
}
```

### Knowledge Base:
```bash
# Subir archivo a KB
POST /api/v1/knowledge/files
# Content-Type: multipart/form-data
# File: @documento.pdf

# Consultar KB
POST /api/v1/knowledge/query
{
  "query": "¿Cómo configurar autenticación?",
  "collection_ids": ["kb_tech_docs"],
  "top_k": 5
}
```

### API Keys Management:
```bash
# Crear API key
POST /api/v1/api_keys
{
  "name": "script-automatizacion",
  "permissions": ["chats:create", "models:read"]
}

# Listar mis API keys
GET /api/v1/api_keys

# Revocar API key
DELETE /api/v1/api_keys/{key_id}
```

### Webhooks:
```bash
# Suscribirse a eventos
POST /api/v1/webhooks
{
  "url": "https://mi-sistema.com/webhook",
  "events": ["chat.completed", "user.signup"],
  "secret": "whsec_xxx"  # Para firmar payloads
}
```

### Respuestas de Error Estándar:
```json
{
  "error": {
    "message": "Descripción del error",
    "type": "authentication_error | validation_error | rate_limit_error | internal_error",
    "code": "invalid_token | missing_field | too_many_requests | internal"
  }
}
```

---

## 11. 🔄 Actualización y Mantenimiento

### Actualización Manual (Docker):
```bash
# 1. Backup de volumen
docker run --rm \
  -v open-webui:/source \
  -v $(pwd):/backup \
  alpine tar czf /backup/backup-$(date +%Y%m%d).tar.gz -C /source .

# 2. Detener contenedor actual
docker stop open-webui
docker rm open-webui

# 3. Pull nueva versión
docker pull ghcr.io/open-webui/open-webui:main

# 4. Iniciar con misma configuración
docker run -d -p 3000:8080 \
  -v open-webui:/app/backend/data \
  -e WEBUI_SECRET_KEY="tu-clave-persistente" \
  --name open-webui \
  --restart always \
  ghcr.io/open-webui/open-webui:main
```

### Actualización Automática con Watchtower:
```bash
docker run --rm \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --run-once \
  open-webui
```

### Actualización con WUD (What's Up Docker):
```yaml
# docker-compose.yml adicional
services:
  wud:
    image: fmartinou/whats-up-docker
    ports:
      - "3001:3000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WUD_WATCHER_LOCAL=true
```

### Pinning de Versiones (Producción):
```bash
# NO usar :main en producción
# Usar versión específica:
ghcr.io/open-webui/open-webui:v0.9.6

# Actualizar deliberadamente:
# 1. Probar en entorno staging
# 2. Backup completo
# 3. Actualizar en ventana de mantenimiento
# 4. Verificar funcionalidad crítica
# 5. Rollback planificado si es necesario
```

### Rollback:
```bash
# 1. Detener versión actual
docker stop open-webui
docker rm open-webui

# 2. Pull versión anterior
docker pull ghcr.io/open-webui/open-webui:v0.9.5

# 3. Iniciar con volumen existente (datos compatibles hacia atrás*)
docker run -d -p 3000:8080 \
  -v open-webui:/app/backend/data \
  --name open-webui \
  ghcr.io/open-webui/open-webui:v0.9.5

# * Nota: Verificar compatibilidad de migraciones de BD
```

### Backup Completo:
```bash
#!/bin/bash
# backup-open-webui.sh

BACKUP_DIR="/backups/open-webui/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup de volumen de datos
docker run --rm \
  -v open-webui:/source \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/data.tar.gz -C /source .

# Backup de configuración Docker Compose
cp docker-compose.yml $BACKUP_DIR/

# Backup de variables de entorno (sin secrets)
env | grep -v "SECRET\|PASSWORD\|KEY" > $BACKUP_DIR/env.txt

# Backup de PostgreSQL (si aplica)
if [ -n "$DATABASE_URL" ]; then
  docker exec postgres pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db.sql
fi

echo "Backup completado en $BACKUP_DIR"
```

---

## 12. 👨‍💻 Desarrollo y Contribución

### Setup de Desarrollo desde Fuente:
```bash
# 1. Clonar repositorio
git clone https://github.com/open-webui/open-webui.git
cd open-webui

# 2. Crear entorno virtual
python3.11 -m venv venv
source venv/bin/activate

# 3. Instalar dependencias de desarrollo
pip install -e ".[dev]"

# 4. Instalar frontend dependencies (si modificas UI)
cd frontend
npm install

# 5. Iniciar backend en modo desarrollo
cd ../backend
uvicorn open_webui.main:app --reload --host 0.0.0.0 --port 8080

# 6. En otra terminal, iniciar frontend dev server
cd ../frontend
npm run dev
```

### Estructura del Proyecto:
```
open-webui/
├── backend/
│   ├── open_webui/
│   │   ├── main.py          # Entry point de la app
│   │   ├── config.py        # Carga de variables de entorno
│   │   ├── models/          # Modelos SQLAlchemy
│   │   ├── routers/         # Endpoints API
│   │   ├── utils/           # Funciones auxiliares
│   │   └── config.py        # Configuración
│   ├── alembic/             # Migraciones de BD
│   └── requirements.txt     # Dependencias Python
│
├── frontend/
│   ├── src/
│   │   ├── lib/             # Componentes Svelte
│   │   ├── routes/          # Rutas de la app
│   │   └── stores/          # Estado global (Svelte stores)
│   ├── static/              # Assets estáticos
│   └── svelte.config.js     # Configuración SvelteKit
│
├── docker/
│   ├── Dockerfile           # Imagen principal
│   ├── docker-compose.yml   # Setup desarrollo
│   └── entrypoint.sh        # Script de inicio
│
├── docs/                    # Documentación (esta que estás leyendo)
├── tests/                   # Tests unitarios e integración
└── scripts/                 # Scripts de utilidad
```

### Ejecutar Tests:
```bash
# Tests unitarios backend
cd backend
pytest tests/unit/

# Tests de integración
pytest tests/integration/

# Tests E2E (requiere frontend corriendo)
cd frontend
npm run test:e2e
```

### Contribuir:
1. Fork el repositorio
2. Crear rama para tu feature: `git checkout -b feature/mi-nueva-funcion`
3. Hacer cambios y añadir tests
4. Ejecutar linter: `ruff check . && mypy .`
5. Commit con mensaje descriptivo
6. Push a tu fork y abrir Pull Request
7. Seguir checklist de PR: tests pasan, documentación actualizada, cambios revisados

### Reporting Issues:
Al reportar un bug, incluir:
```markdown
## Descripción del problema
[Qué ocurre vs. qué esperabas]

## Pasos para reproducir
1. ...
2. ...
3. ...

## Configuración
- Versión Open WebUI: v0.9.6
- Método de instalación: Docker/pip/etc.
- Sistema operativo: ...
- Proveedor de modelo: Ollama/OpenAI/etc.

## Logs relevantes
```
[pegar logs de error aquí]
```

## Comportamiento esperado
[Qué debería ocurrir]
```

---

## 📎 Apéndices

### A. Comandos Útiles de Docker

```bash
# Ver logs en tiempo real
docker logs -f open-webui

# Acceder a shell del contenedor
docker exec -it open-webui bash

# Ver uso de recursos
docker stats open-webui

# Reiniciar contenedor
docker restart open-webui

# Eliminar contenedor y volumen (⚠️ pierde datos)
docker rm -f open-webui
docker volume rm open-webui

# Ver variables de entorno del contenedor
docker exec open-webui env | sort

# Copiar archivos desde/ hacia contenedor
docker cp open-webui:/app/backend/data/webui.db ./backup.db
docker cp ./config.json open-webui:/app/backend/data/config.json
```

### B. Troubleshooting de Conexión a Ollama

```bash
# 1. Verificar que Ollama está corriendo
curl http://localhost:11434/api/tags

# 2. Desde dentro del contenedor Open WebUI:
docker exec open-webui curl -v http://host.docker.internal:11434/api/tags

# 3. Si usas red personalizada en Docker:
docker network connect ollama-network open-webui
# Y configurar: OLLAMA_BASE_URL=http://ollama:11434

# 4. Verificar CORS en Ollama (si hay errores de origen):
# Ollama por defecto permite CORS, pero verificar configuración
```

### C. Optimización para Hardware Limitado (Raspberry Pi)

```bash
# docker-compose.optimized.yml
services:
  openwebui:
    image: ghcr.io/open-webui/open-webui:main-slim  # Imagen más pequeña
    ports:
      - "3000:8080"
    volumes:
      - open-webui:/app/backend/data
    environment:
      # Reducir consumo de recursos
      DATABASE_POOL_SIZE: "4"
      DATABASE_SQLITE_PRAGMA_CACHE_SIZE: "-2000"    # 2MB por conexión
      DATABASE_SQLITE_PRAGMA_MMAP_SIZE: "0"          # Sin mmap
      DATABASE_USER_ACTIVE_STATUS_UPDATE_INTERVAL: "600"  # Throttling agresivo
      
      # Desactivar features no esenciales
      ENABLE_CHANNELS: "false"
      ENABLE_AUTOMATIONS: "false"
      
      # RAG optimizado
      RAG_TOP_K: "2"  # Menos documentos a recuperar
      RAG_EMBEDDING_ENGINE: "ollama"
      RAG_EMBEDDING_MODEL: "nomic-embed-text-v1.5"  # Modelo ligero
      
      # Limitar workers
      UVICORN_WORKERS: "1"
    deploy:
      resources:
        limits:
          memory: 2G  # Limitar memoria del contenedor
    restart: always

volumes:
  open-webui:
```

### D. Checklist de Seguridad para Producción

```markdown
## ✅ Configuración Básica
- [ ] `WEBUI_SECRET_KEY` establecida y persistente
- [ ] `WEBUI_URL` configurado correctamente (para OAuth/SSO)
- [ ] `ENABLE_SIGNUP=false` si no se requiere registro público
- [ ] `ENABLE_PASSWORD_AUTH=false` si solo usas SSO

## ✅ Base de Datos
- [ ] PostgreSQL en lugar de SQLite para producción
- [ ] `DATABASE_USER_ACTIVE_STATUS_UPDATE_INTERVAL=300` para reducir writes
- [ ] Backup automático configurado
- [ ] Credenciales de BD en secrets management, no en texto plano

## ✅ Redis (para multi-worker)
- [ ] `REDIS_URL` configurado
- [ ] `maxclients 10000` y `timeout 1800` en redis.conf
- [ ] Redis con autenticación habilitada en producción

## ✅ Red/Proxy
- [ ] HTTPS habilitado con certificado válido
- [ ] Headers WebSocket configurados en reverse proxy
- [ ] Rate limiting en nivel de proxy (fail2ban, nginx limit_req)
- [ ] Firewall restringiendo acceso a puertos internos

## ✅ Monitoreo
- [ ] `ENABLE_OTEL=true` con exportador configurado
- [ ] Alertas configuradas para errores 5xx, alta latencia, OOM
- [ ] Logs centralizados (ELK, Loki, etc.)

## ✅ Actualizaciones
- [ ] Proceso de actualización probado en staging
- [ ] Backup automático antes de actualizar
- [ ] Rollback planificado y probado
- [ ] Ventana de mantenimiento comunicada a usuarios
```

---

> 📝 **Nota Final:** Esta documentación está actualizada a la versión **v0.9.6** de Open WebUI. Para la información más reciente, consulta siempre la fuente oficial: https://docs.openwebui.com/

> 🔐 **Advertencia de Seguridad:** Open WebUI maneja datos sensibles, credenciales y posiblemente información empresarial crítica. Sigue siempre las mejores prácticas de seguridad: nunca expongas la interfaz de administración públicamente sin autenticación robusta, usa HTTPS en producción, y mantén tus dependencias actualizadas.

> 🤝 **Comunidad:** ¿Necesitas ayuda? Únete a:
> - Discord: https://discord.gg/open-webui
> - GitHub Issues: https://github.com/open-webui/open-webui/issues
> - GitHub Discussions: https://github.com/open-webui/open-webui/discussions

---

Artifacts
What are Artifacts and how do I use them in Open WebUI?
Artifacts in Open WebUI are an innovative feature inspired by Claude.AI's Artifacts, allowing you to interact with significant and standalone content generated by an LLM within a chat. They enable you to view, modify, build upon, or reference substantial pieces of content separately from the main conversation, making it easier to work with complex outputs and ensuring that you can revisit important information later.

When does Open WebUI use Artifacts?
Open WebUI creates an Artifact when the generated content meets specific criteria tailored to our platform:

Renderable: To be displayed as an Artifact, the content must be in a format that Open WebUI supports for rendering. This includes:
Single-page HTML websites
Scalable Vector Graphics (SVG) images
Complete webpages, which include HTML, Javascript, and CSS all in the same Artifact. Do note that HTML is required if generating a complete webpage.
ThreeJS Visualizations and other JavaScript visualization libraries such as D3.js.
Other content types like Documents (Markdown or Plain Text), Code snippets, and React components are not rendered as Artifacts by Open WebUI.

How does Open WebUI's model create Artifacts?
To use artifacts in Open WebUI, a model must provide content that triggers the rendering process to create an artifact. This involves generating valid HTML, SVG code, or other supported formats for artifact rendering. When the generated content meets the criteria mentioned above, Open WebUI will display it as an interactive Artifact.

How do I use Artifacts in Open WebUI?
When Open WebUI creates an Artifact, you'll see the content displayed in a dedicated Artifacts window to the right side of the main chat. Here's how to interact with Artifacts:

Editing and iterating: Ask an LLM within the chat to edit or iterate on the content, and these updates will be displayed directly in the Artifact window. You can switch between versions using the version selector at the bottom left of the Artifact. Each edit creates a new version, allowing you to track changes using the version selector.
Updates: Open WebUI may update an existing Artifact based on your messages. The Artifact window will display the latest content.
Actions: Access additional actions for the Artifact, such as copying the content or opening the artifact in full screen, located in the lower right corner of the Artifact.
Editing Artifacts
Targeted Updates: Describe what you want changed and where. For example:
"Change the color of the bar in the chart from blue to red."
"Update the title of the SVG image to 'New Title'."
Full Rewrites: Request major changes affecting most of the content for substantial restructuring or multiple section updates. For example:
"Rewrite this single-page HTML website to be a landing page instead."
"Redesign this SVG so that it's animated using ThreeJS."
Best Practices:

Be specific about which part of the Artifact you want to change.
Reference unique identifying text around your desired change for targeted updates.
Consider whether a small update or full rewrite is more appropriate for your needs.
Use Cases
Artifacts in Open WebUI enable various teams to create high-quality work products quickly and efficiently. Here are some examples tailored to our platform:

Designers:
Create interactive SVG graphics for UI/UX design.
Design single-page HTML websites or landing pages.
Developers: Create simple HTML prototypes or generate SVG icons for projects.
Marketers:
Design campaign landing pages with performance metrics.
Create SVG graphics for ad creatives or social media posts.
Examples of Projects you can create with Open WebUI's Artifacts
Artifacts in Open WebUI enable various teams and individuals to create high-quality work products quickly and efficiently. Here are some examples tailored to our platform, showcasing the versatility of artifacts and inspiring you to explore their potential:

Interactive Visualizations
Components used: ThreeJS, D3.js, and SVG
Benefits: Create immersive data stories with interactive visualizations. Open WebUI's Artifacts enable you to switch between versions, making it easier to test different visualization approaches and track changes.
Example Project: Build an interactive line chart using ThreeJS to visualize stock prices over time. Update the chart's colors and scales in separate versions to compare different visualization strategies.

Single-Page Web Applications
Components used: HTML, CSS, and JavaScript
Benefits: Develop single-page web applications directly within Open WebUI. Edit and iterate on the content using targeted updates and full rewrites.
Example Project: Design a to-do list app with a user interface built using HTML and CSS. Use JavaScript to add interactive functionality. Update the app's layout and UI/UX using targeted updates and full rewrites.

Animated SVG Graphics
Components used: SVG and ThreeJS
Benefits: Create engaging animated SVG graphics for marketing campaigns, social media, or web design. Open WebUI's Artifacts enable you to edit and iterate on the graphics in a single window.
Example Project: Design an animated SVG logo for a company brand. Use ThreeJS to add animation effects and Open WebUI's targeted updates to refine the logo's colors and design.

Webpage Prototypes
Components used: HTML, CSS, and JavaScript
Benefits: Build and test webpage prototypes directly within Open WebUI. Switch between versions to compare different design approaches and refine the prototype.
Example Project: Develop a prototype for a new e-commerce website using HTML, CSS, and JavaScript. Use Open WebUI's targeted updates to refines the navigation, layout, and UI/UX.

Interactive Storytelling
Components used: HTML, CSS, and JavaScript
Benefits: Create interactive stories with scrolling effects, animations, and other interactive elements. Open WebUI's Artifacts enable you to refine the story and test different versions.
Example Project: Build an interactive story about a company's history, using scrolling effects and animations to engage the reader. Use targeted updates to refine the story's narrative and Open WebUI's version selector to test different versions.

🐍 Python Code Execution
Overview
Open WebUI provides two ways to execute Python code:

Manual Code Execution: Run Python code blocks generated by LLMs using a "Run" button in the browser (uses Pyodide/WebAssembly).
Code Interpreter: An AI capability that allows models to automatically write and execute Python code as part of their response (uses Pyodide or Jupyter).
Both methods support visual outputs like matplotlib charts that can be displayed inline in your chat. When using the Pyodide engine, a persistent virtual filesystem at /mnt/uploads/ is available — files survive across code executions and page reloads, and files attached to messages are automatically placed there for your code to access.

Code Interpreter Capability
The Code Interpreter is a model capability that enables LLMs to write and execute Python code autonomously during a conversation. When enabled, models can:

Perform calculations and data analysis
Generate visualizations (charts, graphs, plots)
Process data dynamically
Execute multi-step computational tasks
Enabling Code Interpreter
Per-Model Setup (Admin):

Go to Admin Panel → Models
Select the model you want to configure
Under Capabilities, enable Code Interpreter
Save changes
Global Configuration (Admin Panel):

These settings can be configured at Admin Panel → Settings → Code Execution:

Enable/disable code interpreter
Select engine: Pyodide (recommended) or Jupyter (Legacy)
Configure Jupyter connection settings
Set blocked modules
Global Configuration (Environment Variables):

Variable	Default	Description
ENABLE_CODE_INTERPRETER	true	Enable/disable code interpreter globally
CODE_INTERPRETER_ENGINE	pyodide	Engine to use: pyodide (browser, recommended) or jupyter (server, legacy)
CODE_INTERPRETER_PROMPT_TEMPLATE	(built-in)	Custom prompt template for code interpreter
CODE_INTERPRETER_BLACKLISTED_MODULES	""	Comma-separated list of blocked Python modules
For Jupyter configuration, see the Jupyter Notebook Integration tutorial.

Filesystem Prompt Injection
When the Pyodide engine is selected, Open WebUI automatically appends a filesystem-awareness prompt to the code interpreter instructions. This tells the model about /mnt/uploads/ and how to discover user-uploaded files. When using Jupyter, this filesystem prompt is not appended (since Jupyter has its own filesystem). You do not need to include filesystem instructions in your custom CODE_INTERPRETER_PROMPT_TEMPLATE — they are added automatically.

Native Function Calling (Native Mode)
When using Native function calling mode with a capable model (e.g., GPT-5, Claude 4.5, MiniMax M2.5), the code interpreter is available as a builtin tool called execute_code. This provides a more integrated experience:

No XML tags required: The model calls execute_code(code) directly
Same image handling: Base64 image URLs in output are replaced with file URLs; model embeds via markdown
Requirements:

ENABLE_CODE_INTERPRETER must be enabled globally
Model must have code_interpreter capability enabled
Model must use Native function calling mode (set in model's advanced params)
For more details on builtin tools and native mode, see the Tool Development Guide.

Displaying Images Inline (matplotlib, etc.)
When using matplotlib or other visualization libraries, images can be displayed directly in the chat. For this to work correctly, the code must output the image as a base64 data URL.

Recommended Pattern for matplotlib
import matplotlib.pyplot as plt
import io
import base64

# Create your chart
plt.figure(figsize=(10, 6))
plt.bar(['A', 'B', 'C'], [4, 7, 5])
plt.title('Sample Chart')

# Output as base64 data URL (triggers automatic upload)
buf = io.BytesIO()
plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
buf.seek(0)
img_base64 = base64.b64encode(buf.read()).decode('utf-8')
print(f"data:image/png;base64,{img_base64}")
plt.close()

How Image Display Works
The code executes and prints data:image/png;base64,... to stdout
Open WebUI's middleware detects the base64 image data in the output
The image is automatically uploaded and stored as a file
The base64 string is replaced with a file URL (e.g., /api/v1/files/{id}/content)
The model sees this URL in the code output and can reference it in its response
The image renders inline in the chat
Understanding the Flow
The model's code should print the base64 data URL. Open WebUI intercepts this and converts it to a permanent file URL. The model should then use this resulting URL in markdown like ![Chart](/api/v1/files/abc123/content) — it should NOT paste the raw base64 string into its response text.

If you see raw base64 text appearing in chat responses, the model is incorrectly echoing the base64 instead of using the converted URL from the code output.

Example Prompt
Create a bar chart showing quarterly sales: Q1: 150, Q2: 230, Q3: 180, Q4: 310.

Expected model behavior:

Model writes Python code using the base64 pattern above
Code executes and outputs data:image/png;base64,...
Open WebUI converts this to a file URL in the output (e.g., ![Output Image](/api/v1/files/abc123/content))
Model references this URL in its response to display the chart
Common Issues
Issue	Cause	Solution
Raw base64 text appears in chat	Model output the base64 in its response text	Instruct model to only print base64 in code, not repeat it
Image doesn't display	Code used plt.show() without base64 output	Use the base64 pattern above instead
"Analyzing..." spinner stuck	Code execution timeout or error	Check backend logs for errors
Manual Code Execution (Pyodide)
Open WebUI includes a browser-based Python environment using Pyodide (WebAssembly). This allows running Python scripts directly in your browser with no server-side setup.

The Pyodide worker is persistent — it is created once and reused across code executions. This means variables, imported modules, and files written to the virtual filesystem are retained between executions within the same session.

Running Code Manually
Ask an LLM to write Python code
A Run button appears in the code block
Click to execute the code using Pyodide
Output appears below the code block
Supported Libraries
Pyodide includes the following packages, which are auto-detected from import statements and loaded on demand:

Package	Use case
micropip	Package installer (internal use)
requests	HTTP requests
beautifulsoup4	HTML/XML parsing
numpy	Numerical computing
pandas	Data analysis and manipulation
matplotlib	Chart and plot generation
seaborn	Statistical data visualization
scikit-learn	Machine learning
scipy	Scientific computing
regex	Advanced regular expressions
sympy	Symbolic mathematics
tiktoken	Token counting for LLMs
pytz	Timezone handling
The Python standard library is also fully available (json, csv, math, datetime, os, io, etc.).

No runtime installation
The AI cannot install additional libraries beyond the list above. Any code that imports an unsupported package will fail with an import error. Packages that require C extensions, system calls, or native binaries (e.g., torch, tensorflow, opencv, psycopg2) are not available and cannot be made available in Pyodide. Pyodide is best suited for basic file analysis, simple calculations, text processing, and chart generation. For full Python package access, use Open Terminal instead.

Persistent File System
When using the Pyodide engine, a persistent virtual filesystem is mounted at /mnt/uploads/. This filesystem is backed by the browser's IndexedDB via IDBFS and provides:

Cross-execution persistence — files written by one code execution are accessible in subsequent executions.
Cross-reload persistence — files survive page reloads (stored in IndexedDB).
Automatic upload mounting — files attached to messages are fetched from the server and placed in /mnt/uploads/ before code execution, so the model can read them directly.
File browser panel — when Code Interpreter is enabled, a file browser appears in the chat controls sidebar. You can browse, preview, upload, download, and delete files — no terminal needed.
Working with Files in Code
import os

# List uploaded files
print(os.listdir('/mnt/uploads'))

# Read a user-uploaded CSV
import pandas as pd
df = pd.read_csv('/mnt/uploads/data.csv')
print(df.head())

# Write output to the persistent filesystem (downloadable via file browser)
df.to_csv('/mnt/uploads/result.csv', index=False)
print('Saved result.csv to /mnt/uploads/')

tip
The file browser panel lets you download any file the model creates. Ask the model to save its output to /mnt/uploads/ and it will appear in the file browser for download.

Jupyter Engine
The persistent filesystem prompt and /mnt/uploads/ integration are Pyodide-only. When using the Jupyter engine, files are managed through Jupyter's own filesystem. The file browser panel is not available for Jupyter.

Example: Creating a Chart
Prompt:

"Create a bar chart with matplotlib showing: Acuity 4.1, Signify 7.2, Hubbell 5.6, Legrand 8.9. Output the chart as a base64 data URL so it displays inline."

Expected Code Output:

import matplotlib.pyplot as plt
import io
import base64

companies = ['Acuity', 'Signify', 'Hubbell', 'Legrand']
values = [4.1, 7.2, 5.6, 8.9]

plt.figure(figsize=(10, 6))
bars = plt.bar(companies, values, color=['#3498db', '#2ecc71', '#e74c3c', '#9b59b6'])

for bar, value in zip(bars, values):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.1, 
             str(value), ha='center', va='bottom', fontsize=12)

plt.title('Company Values', fontsize=16, fontweight='bold')
plt.xlabel('Company', fontsize=12)
plt.ylabel('Value', fontsize=12)
plt.tight_layout()

buf = io.BytesIO()
plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
buf.seek(0)
print(f"data:image/png;base64,{base64.b64encode(buf.read()).decode()}")
plt.close()

The image will be automatically uploaded and displayed inline in your chat.

Browser Compatibility
Microsoft Edge: Pyodide Crashes
If Pyodide-based code execution causes Microsoft Edge to crash with a STATUS_ACCESS_VIOLATION error, this is caused by Edge's enhanced security mode.

Symptom: The browser tab or entire browser crashes when attempting to run Python code, with no useful error message.

Cause: Edge's "Enhance your security on the web" setting (found at edge://settings/privacy/security) enables stricter security mitigations that are incompatible with WebAssembly-based runtimes like Pyodide.

Solutions:

Disable enhanced security in Edge:

Go to edge://settings/privacy/security
Turn off "Enhance your security on the web"
Use a different browser:

Chrome and Firefox do not have this issue
Use Jupyter backend:

Switch CODE_INTERPRETER_ENGINE to jupyter to avoid browser-based execution entirely
note
This is a known compatibility issue between Edge's enhanced security mode and WebAssembly. The same crash occurs on the official Pyodide console when this setting is enabled.

Tips for Better Results
Mention the environment: Tell the LLM it's running in a "Pyodide environment" or "code interpreter" for better code generation
Be explicit about output: Ask for "base64 data URL output" for images
Use print statements: Results must be printed to appear in the output
Check library support: Verify the libraries you need are available in Pyodide

MermaidJS Rendering
🌊 MermaidJS Rendering Support in Open WebUI
Overview
Open WebUI supports rendering of visually appealing MermaidJS diagrams, flowcharts, pie charts and more, directly within the chat interface. MermaidJS is a powerful tool for visualizing complex information and ideas, and when paired with the capabilities of a large language model (LLM), it can be a powerful tool for generating and exploring new ideas.

Using MermaidJS in Open WebUI
To generate a MermaidJS diagram, simply ask an LLM within any chat to create a diagram or chart using MermaidJS. For example, you can ask the LLM to:

"Create a flowchart for a simple decision-making process for me using Mermaid. Explain how the flowchart works."
"Use Mermaid to visualize a decision tree to determine whether it's suitable to go for a walk outside."
Note that for the LLM's response to be rendered correctly, it must begin with the word mermaid followed by the MermaidJS code. You can reference the MermaidJS documentation to ensure the syntax is correct and provide structured prompts to the LLM to guide it towards generating better MermaidJS syntax.

Visualizing MermaidJS Code Directly in the Chat
When you request a MermaidJS visualization, the Large Language Model (LLM) will generate the necessary code. Open WebUI will automatically render the visualization directly within the chat interface, as long as the code uses valid MermaidJS syntax.

If the model generates MermaidJS syntax, but the visualization does not render, it usually indicates a syntax error in the code. Don't worry – you'll be notified of any errors once the response has been fully generated. If this happens, try referencing the MermaidJS documentation to identify the issue and revise the prompt accordingly.

Interacting with Your Visualization
Once your visualization is displayed, you can:

Zoom in and out to examine it more closely.
Copy the original MermaidJS code used to generate the visualization by clicking the copy button at the top-right corner of the display area.
Example
Yes

N

A

B

Decision

D

E

F

This will generate a flowchart like the following:

 startAncestor [ start ]
A[A] --> B[B]
B --> C[Decision]
C -->| Yes | D[D]
C -->| No  | E[E]
D --> F[F]
E --> F[F]

Experimenting with different types of diagrams and charts can help you develop a more nuanced understanding of how to effectively leverage MermaidJS within Open WebUI. For smaller models, consider referencing the MermaidJS documentation to provide guidance for the LLM, or have it summarize the documentation into comprehensive notes or a system prompt. By following these guidelines and exploring the capabilities of MermaidJS, you can unlock the full potential of this powerful tool in Open WebUI.

Multi-Model Chats
Open WebUI allows you to interact with multiple models simultaneously within a single chat interface. This powerful feature enables you to compare responses, verify facts, and leverage the unique strengths of different LLMs side-by-side.

Overview
In a Multi-Model Chat, your prompt is sent to two or more selected models at the same time. Their responses are displayed in parallel columns (or stacked, depending on screen size), giving you immediate insight into how different AI architectures approach the same problem.

How to Use
Select Models: In the chat header (Model Selector), click the + (Plus) button to add more models to your current session.
Example Setup: Select GPT-5.1 Thinking (for reasoning), Gemini 3 (for creative writing), and Claude Sonnet 4.5 (for overall performance).
Send Prompt: Type your question as usual.
View Results: Watch as all models generate their responses simultaneously in the chat window.
Usage Scenarios
Model Comparison/Benchmarking: Test which model writes better Python code or which one hallucinates less on niche topics.
Fact Validation: "Cross-examine" models. If two models say X and one says Y, you can investigate further.
Diverse Perspectives: Get a "Creative" take from one model and a "Technical" take from another for the same query.
Permissions
Admins can control access to Multi-Model Chats on a per-role or per-group basis.

Location: Admin Panel > Settings > General > User Permissions > Chat > Multiple Models
Environment Variable: USER_PERMISSIONS_CHAT_MULTIPLE_MODELS (Default: True)
If disabled, users will not see the "plus" button in the model selector and cannot initiate multi-model sessions.

Merging Responses (Mixture of Agents)
Once you have responses from multiple models, Open WebUI offers an advanced capability to Merge them into a single, superior answer. This implements a Mixture of Agents (MOA) workflow.

What is Merging?
Merging takes the outputs from all your active models and sends them—along with your original prompt—to a "Synthesizer Model." This Synthesizer Model reads all the draft answers and combines them into one final, polished response.

How to Merge
Start a Multi-Model Chat and get responses from your selected models.
Look for the Merge (or "Synthesize") button in the response controls area (often near the regeneration controls).
Open WebUI will generate a new response that aggregates the best parts of the previous outputs.
Advantages of Merging
Higher Accuracy: Research suggests that aggregating outputs from multiple models often outperforms any single model acting alone.
Best of Both Worlds: You might get the code accuracy of Model A combined with the clear explanations of Model B.
Reduced Hallucinations: The synthesizer model can filter out inconsistencies found in individual responses.
Configuration
The merging process relies on the backend Tasks system.

Task Model: The specific model used to perform the merger can be configured in Admin Panel > Settings > Tasks. We recommend using a highly capable model (like GPT-5.1 or Claude Sonnet 4.5) as the task model for the best results.
Prompt Template: The system uses a specialized prompt template to instruct the AI on how to synthesize the answers.
Experimental
The Merging/MOA feature is an advanced capability. While powerful, it requires a capable Task Model to work effectively.

Chat Sharing
Enabling Community Sharing
To enable community sharing, follow these steps:

Navigate to the Admin Panel page as an Admin.
Click on the Settings tab.
Toggle on Enable Community Sharing within the General settings tab.
note
Note: Only Admins can toggle the Enable Community Sharing option. If this option is toggled off, users and Admins will not see the Share to Open WebUI Community option for sharing their chats. Community sharing must be enabled by an Admin for users to share chats to the Open WebUI community.

This will enable community sharing for all users on your Open WebUI instance.

Sharing Chats
To share a chat:

Select the chat conversation you want to share.
Click on the 3-dots that appear when hovering the mouse pointer above the desired chat.
Then click on the Share option.
Select either Share to Open WebUI Community (if Enable Community Sharing is toggled on by an Admin) or Copy Link.
Sharing scope is controlled by RBAC
After generating a share link, the modal shows an Access Control selector for who can open it. The Public option (anyone with the link, including unauthenticated visitors) is gated by the Chats Public Sharing permission — when disabled, non-admin users only see options to grant access to specific users or groups. Admins always retain access to all options. See RBAC Permissions and USER_PERMISSIONS_CHAT_ALLOW_PUBLIC_SHARING for configuration.

Sharing to Open WebUI Community
When you select Share to Open WebUI Community:

A new tab will open, allowing you to upload your chat as a snapshot to the Open WebUI community website (https://openwebui.com/chats/upload).
You can control who can view your uploaded chat by choosing from the following access settings:
Private: Only you can access this chat.
Public: Anyone on the internet can view the messages displayed in the chat snapshot.
Public, Full History: Anyone on the internet can view the full regeneration history of your chat.
note
Note: You can change the permission level of your shared chats on the community platform at any time from your openwebui.com account.

Currently, shared chats on the community website cannot be found through search. However, future updates are planned to allow public chats to be discoverable by the public if their permission is set to Public or Public, Full History.

Copying a Share Link
When you select Copy Link, a unique share link is generated that can be shared with others.

Important Considerations:

The shared chat will only include messages that existed at the time the link was created. Any new messages sent within the chat after the link is generated will not be included, unless the link is deleted and updated with a new link.
The generated share link acts as a static snapshot of the chat at the time the link was generated.
To view the shared chat, users must:
Have an account on the Open WebUI instance where the link was generated.
Be signed in to their account on that instance.
If a user tries to access the shared link without being signed in, they will be redirected to the login page to log in before they can view the shared chat.
Viewing Shared Chats
To view a shared chat:

Ensure you are signed in to an account on the Open WebUI instance where the chat was shared.
Click on the shared link provided to you.
The chat will be displayed in a read-only format.
If the Admin of the Open WebUI instance from which the shared link was shared has Text-to-Speech set up, there may be an audio button for messages to be read aloud to you (situational).
Updating Shared Chats
To update a shared chat:

Select the chat conversation you want to share.
Click on the 3-dots that appear when hovering the mouse pointer above the desired chat.
Click on the Share option.
The Share Chat Modal should look different if you've shared a chat before.
The Share Chat Modal includes the following options:

before: Opens a new tab to view the previously shared chat from the share link.
delete this link: Deletes the shared link of the chat and presents the initial share chat modal.
Share to Open WebUI Community: Opens a new tab for https://openwebui.com/chats/upload with the chat ready to be shared as a snapshot.
Update and Copy Link: Updates the snapshot of the chat of the previously shared chat link and copies it to your device's clipboard.
Deleting Shared Chats
To delete a shared chat link:

Select the chat conversation you want to delete the shared link for.
Click on the 3-dots that appear when hovering the mouse pointer above the desired chat.
Click on the Share option.
The Share Chat Modal should look different if you've shared a chat before.
Click on delete this link.
Once deleted, the shared link will no longer be valid, and users will not be able to view the shared chat.

note
Note: Chats shared to the community platform cannot be deleted. To change the access level of a chat shared to the community platform:

Log in to your Open WebUI account on openwebui.com.
Click on your account username at the top right of the website.
Click on Chats.
Click on the chat you wish to change permission access for.
Scroll to the bottom of the chat and update its permission level.
Click the Update Chat button.
Managing Shared Chats
Open WebUI provides a centralized dashboard to manage every chat conversation you have shared. From there you can search through your shared history, re-copy links, or revoke access instantly.

For details on the management dashboard, see Shared Chats Management.

Folders & Projects
Open WebUI provides powerful folder-based organization that turns simple chat containers into full-featured project workspaces. Folders allow you to not only group related conversations but also define specific contexts, system prompts, and knowledge bases that apply to all chats within them.

Enabling Folders
Folders are enabled by default. Administrators can control this feature via:

Admin Panel: The folders feature is controlled globally alongside other features.
Environment Variable: ENABLE_FOLDERS - Set to True (default) to enable or False to disable.
Core Features
Creating Folders
Create a new folder to organize your conversations:

In the sidebar, click the + button next to "Chats" or right-click in the chat list.
Select "New Folder".
Enter a name for your folder.
Click Save.
Moving Conversations into Folders
Organize existing chats by moving them into folders:

Drag and Drop: Click and drag any conversation from the sidebar into a folder.
Right-click Menu: Right-click on a conversation and select "Move to Folder".
Nested Folders
Folders can be nested within other folders to create hierarchical organization:

Create subfolder from menu: Right-click (or click the three-dot menu ⋯) on any folder and select "Create Folder" to create a new subfolder directly inside it.
Drag and drop: Drag a folder onto another folder to make it a subfolder.
Move via context menu: Right-click on a folder and use the move option to relocate it under a different parent.
Folders can be expanded or collapsed to show/hide their contents.
Subfolder names must be unique within the same parent folder. If a duplicate name is entered, a number is automatically appended (e.g., "Notes 1").
Starting a Chat in a Folder
When you click on a folder in the sidebar, it becomes your active workspace:

Click on any folder in the sidebar to select it.
The chat interface will show that folder is active.
Any new chat you start will automatically be created inside this folder.
New chats will inherit the folder's settings (system prompt and knowledge).
Folder Settings (Project Configuration)
Folders can be configured as full project workspaces with their own AI behavior and context. To edit folder settings:

Hover over a folder in the sidebar.
Click the three-dot menu (⋯).
Select "Edit" to open the folder settings modal.
Folder Name
Change the name of your folder to better reflect its purpose or project.

Folder Background Image
Customize the visual appearance of your folder by uploading a background image. This helps visually distinguish different projects in your workspace.

System Prompt
Assign a dedicated System Prompt to the folder that automatically applies to all conversations within it:

The system prompt is prepended to every new conversation created in the folder.
This tailors the AI's behavior for specific tasks or personas.
System prompts are optional—you can use folders purely for organization without one.
info
The System Prompt field is only visible if you have permission to set system prompts (controlled by admin settings).

Attached Knowledge
Link knowledge bases and files to your folder:

All attached files and knowledge bases are automatically included as context for every chat in the folder.
This enables RAG (Retrieval Augmented Generation) for all folder conversations.
Knowledge is optional—folders work for organization without any attached files.
Example Use Case
Creating a "Python Expert" Project
Imagine you're working on a Python development project:

Create a folder named "Python Expert".
Edit the folder and set the System Prompt:
You are an expert Python developer. You provide clean, efficient, and well-documented code. When asked for code, prioritize clarity and adherence to PEP 8 standards.


Attach Knowledge by linking your project's technical specification PDF or library documentation.
Click on the folder to select it as your active workspace.
Start chatting — every new conversation will have:
The expert Python persona
Access to your project documents
Automatic organization in the folder
Tags (Complementary Organization)
In addition to folders, tags provide a flexible labeling system for conversations:

Adding Tags: Apply keyword labels to conversations based on content or purpose.
Searching by Tags: Filter conversations by tags using the search feature.
Flexible Organization: Tags can be added or removed at any time and don't affect folder structure.
Tagging by Topic
If you frequently discuss topics like "marketing" or "development," tag conversations with these terms. When you search for a specific tag, all relevant conversations are quickly accessible regardless of which folder they're in.

Related Configuration
Setting	Description
ENABLE_FOLDERS	Enable/disable the folders feature globally (Default: True)
USER_PERMISSIONS_FEATURES_FOLDERS	Control user-level access to the folders feature (Default: True)

✨ Autocomplete
Open WebUI offers an AI-powered Autocomplete feature that suggests text completions in real-time as you type your prompt. It acts like a "Copilot" for your chat input, helping you craft prompts faster using your configured task model.

How It Works
When enabled, Open WebUI monitors your input in the chat box. When you pause typing, it sends your current text to a lightweight Task Model. This model predicts the likely next words or sentences, which appear as "ghost text" overlaying your input.

Accept Suggestion: Press Tab (or the Right Arrow key) to accept the suggestion.
Reject/Ignore: Simply keep typing to overwrite the suggestion.
info
Performance Recommendation

Autocomplete functionality relies heavily on the response speed of your Task Model. We recommend using a small, fast, non-reasoning model to ensure suggestions appear instantly.

Recommended Models:

Llama 3.2 (1B or 3B)
Qwen 3 (0.6B or 3B)
Gemma 3 (1B or 4B)
GPT-5 Nano (Optimized for low latency)
Avoid using "Reasoning" models (e.g., o1, o3) or heavy Chain-of-Thought models for this feature, as the latency will make the autocomplete experience sluggish.

Configuration
The Autocomplete feature is controlled by a two-layer system: Global availability and User preference.

1. Global Configuration (Admin)
Admins control whether the autocomplete feature is available on the server.

1. Configuring Autocomplete (Global)
Admin Panel Settings: Go to Admin Settings > Interface > Task Model and toggle Autocomplete Generation.

2. User Configuration (Personal)
Even if enabled globally, individual users can turn it off for themselves if they find it distracting.

Go to Settings > Interface.
Toggle Autocomplete Generation.
note
If the Admin has disabled Autocomplete globally, users will not be able to enable it in their personal settings.

Performance & Troubleshooting
Why aren't suggestions appearing?
Check Settings: Ensure it is enabled in both Admin and User settings.
Task Model: Go to Admin Settings > Interface and verify a Task Model is selected. If no model is selected, the feature cannot generate predictions.
Latency: If your Task Model is large or running on slow hardware, predictions might arrive too late to be useful. Switch to a smaller model.
Reasoning Models: Ensure you are not using a "Reasoning" model (like o1 or o3), as their internal thought process creates excessive latency that breaks real-time autocomplete.
Performance Impact
Autocomplete sends a request to your LLM essentially every time you pause typing (debounced).

Local Models: This can consume significant GPU/CPU resources on the host machine.
API Providers: This will generate a high volume of API calls (though usually with very short token counts). Be mindful of your provider's Rate Limits (Requests Per Minute/RPM and Tokens Per Minute/TPM) to avoid interruptions.
warning
For multi-user instances running on limited local hardware, we recommend disabling Autocomplete to prioritize resources for actual chat generation.

Chat Parameters
Within Open WebUI, there are three levels to setting a System Prompt and Advanced Parameters: per-chat basis, per-model basis, and per-account basis. This hierarchical system allows for flexibility while maintaining structured administration and control.

System Prompt and Advanced Parameters Hierarchy Chart
Level	Definition	Modification Permissions	Override Capabilities
Per-Chat	System prompt and advanced parameters for a specific chat instance	Users can modify, but cannot override model-specific settings	Restricted from overriding model-specific settings
Per-Account	Default system prompt and advanced parameters for a specific user account	Users can set, but may be overridden by model-specific settings	User settings can be overridden by model-specific settings
Per-Model	Default system prompt and advanced parameters for a specific model	Administrators can set, Users cannot modify	Admin-specific settings take precedence, User settings can be overridden
1. Per-chat basis:
Description: The per-chat basis setting refers to the system prompt and advanced parameters configured for a specific chat instance. These settings are only applicable to the current conversation and do not affect future chats.
How to set: Users can modify the system prompt and advanced parameters for a specific chat instance within the right-hand sidebar's Chat Controls section in Open WebUI.
Override capabilities: Users are restricted from overriding the System Prompt or specific Advanced Parameters already set by an administrator on a per-model basis (#2). This ensures consistency and adherence to model-specific settings.
Example Use Case
2. Per-account basis:
Description: The per-account basis setting refers to the default system prompt and advanced parameters configured for a specific user account. Any user-specific changes can serve as a fallback in situations where lower-level settings aren't defined.
How to set: Users can set their own system prompt and advanced parameters for their account within the General section of the Settings menu in Open WebUI.
Override capabilities: Users have the ability to set their own system prompt on their account, but they must be aware that such parameters can still be overridden if an administrator has already set the System Prompt or specific Advanced Parameters on a per-model basis for the particular model being used.
Example Use Case
3. Per-model basis:
Description: The per-model basis setting refers to the default system prompt and advanced parameters configured for a specific model. These settings are applicable to all chat instances using that model.
How to set: Administrators can set the default system prompt and advanced parameters for a specific model within the Models section of the Workspace in Open WebUI.
Override capabilities: User accounts are restricted from modifying the System Prompt or specific Advanced Parameters on a per-model basis (#3). This restriction prevents users from inappropriately altering default settings.
Context length preservation: When a model's System Prompt or specific Advanced Parameters are set manually in the Workspace section by an Admin, said System Prompt or manually set Advanced Parameters cannot be overridden or adjusted on a per-account basis within the General settings or Chat Controls section by a User account. This ensures consistency and prevents excessive reloading of the model whenever a user's context length setting changes.
Model precedence: If a model's System Prompt or specific Advanced Parameters value is pre-set in the Workspace section by an Admin, any context length changes made by a User account in the General settings or Chat Controls section will be disregarded, maintaining the pre-configured value for that model. Be advised that parameters left untouched by an Admin account can still be manually adjusted by a User account on a per-account or per-chat basis.
Example Use Case
Optimize System Prompt Settings for Maximum Flexibility
tip
Bonus Tips This tip applies for both administrators and user accounts. To achieve maximum flexibility with your system prompts, we recommend considering the following setup:

Assign your primary System Prompt (i.e., to give an LLM a defining character) you want to use in your General settings System Prompt field. This sets it on a per-account level and allows it to work as the system prompt across all your LLMs without requiring adjustments within a model from the Workspace section.

For your secondary System Prompt (i.e, to give an LLM a task to perform), choose whether to place it in the System Prompt field within the Chat Controls sidebar (on a per-chat basis) or the Models section of the Workspace section (on a per-model basis) for Admins, allowing you to set them directly. This allows your account-level system prompt to work in conjunction with either the per-chat level system prompt provided by Chat Controls, or the per-model level system prompt provided by Models.

As an administrator, you should assign your LLM parameters on a per-model basis using Models section for optimal flexibility. For both of these secondary System Prompts, ensure to set them in a manner that maximizes flexibility and minimizes required adjustments across different per-account or per-chat instances. It is essential for both your Admin account as well as all User accounts to understand the priority order by which system prompts within Chat Controls and the Models section will be applied to the LLM.

URL Parameters
In Open WebUI, chat sessions can be customized through various URL parameters. These parameters allow you to set specific configurations, enable features, and define model settings on a per-chat basis. This approach provides flexibility and control over individual chat sessions directly from the URL.

URL Parameter Overview
The following table lists the available URL parameters, their function, and example usage.

Parameter	Description	Example
models	Specifies the models to be used, as a comma-separated list.	/?models=model1,model2
model	Specifies a single model to be used for the chat session.	/?model=model1
youtube	Specifies a YouTube video ID to be transcribed within the chat.	/?youtube=VIDEO_ID
load-url	Specifies a Website URL to be fetched and uploaded as a document within the chat.	/?load-url=https://google.com
web-search	Enables web search functionality if set to true.	/?web-search=true
tools or tool-ids	Specifies a comma-separated list of tool IDs to activate in the chat.	/?tools=tool1,tool2
call	Enables a call overlay if set to true.	/?call=true
q	Sets an initial query or prompt for the chat.	/?q=Hello%20there
temporary-chat	Marks the chat as temporary if set to true, for one-time sessions.	/?temporary-chat=true
code-interpreter	Enables the code interpreter feature if set to true.	/?code-interpreter=true
image-generation	Enables the image generation feature if set to true.	/?image-generation=true
1. Models and Model Selection
Description: The models and model parameters allow you to specify which language models should be used for a particular chat session.
How to Set: You can use either models for multiple models or model for a single model.
Example:
/?models=model1,model2 – This initializes the chat with model1 and model2.
/?model=model1 – This sets model1 as the sole model for the chat.
2. YouTube Transcription
Description: The youtube parameter takes a YouTube video ID, enabling the chat to transcribe the specified video.
How to Set: Use the YouTube video ID as the value for this parameter.
Example: /?youtube=VIDEO_ID
Behavior: This triggers transcription functionality within the chat for the provided YouTube video.
3. Website Insertion
Description: The load-url parameter downloads the specified website and extracts the content to upload it as a document into the chat.
How to Set: Use the full website URL as the value for this parameter.
Example: /?load-url=https://google.com
Behavior: This triggers insertion of the specified website url.
4. Web Search
Description: Enabling web-search allows the chat session to access web search functionality.
How to Set: Set this parameter to true to enable web search.
Example: /?web-search=true
Behavior: If enabled, the chat can retrieve web search results as part of its responses.
5. Tool Selection
Description: The tools or tool-ids parameters specify which tools to activate within the chat.
How to Set: Provide a comma-separated list of tool IDs as the parameter’s value.
Example: /?tools=tool1,tool2 or /?tool-ids=tool1,tool2
Behavior: Each tool ID is matched and activated within the session for user interaction.
6. Call Overlay
Description: The call parameter enables a video or call overlay in the chat interface.
How to Set: Set the parameter to true to enable the call overlay.
Example: /?call=true
Behavior: Activates a call interface overlay, allowing features such as live transcription and video input.
7. Initial Query Prompt
Description: The q parameter allows setting an initial query or prompt for the chat.
How to Set: Specify the query or prompt text as the parameter value.
Example: /?q=Hello%20there
Behavior: The chat starts with the specified prompt, automatically submitting it as the first message.
8. Temporary Chat Sessions
Description: The temporary-chat parameter marks the chat as a temporary session. This may limit features such as saving chat history or applying persistent settings.
How to Set: Set this parameter to true for a temporary chat session.
Example: /?temporary-chat=true
Behavior: This initiates a disposable chat session without saving history or applying advanced configurations.
Note: Document processing in temporary chats is frontend-only for privacy. Complex files requiring backend parsing (e.g., DOCX) may not be fully supported.
9. Code Interpreter
Description: The code-interpreter parameter enables the code interpreter feature.
How to Set: Set this parameter to true to enable the code interpreter feature for this new chat session.
Example: /?code-interpreter=true
Behavior: Activates the code interpreter button to execute the code interpreter with the next prompt sent to the LLM.
10. Image Generation
Description: The image-generation parameter enables the image generation for the provided prompt.
How to Set: Set this parameter to true to enable image generation for the chat.
Example: /?image-generation=true
Behavior: Activates the image generation button to generate an image.
Example Use Case
Using Multiple Parameters Together
These URL parameters can be combined to create highly customized chat sessions. For example:

/?models=model1,model2&youtube=VIDEO_ID&web-search=true&tools=tool1,tool2&call=true&q=Hello%20there&temporary-chat=true

This URL will:

Initialize the chat with model1 and model2.
Enable YouTube transcription, web search, and specified tools.
Display a call overlay.
Set an initial prompt of "Hello there."
Mark the chat as temporary, avoiding any history saving.

Follow-Up Prompts
Open WebUI can automatically generate follow-up question suggestions after each model response. These suggestions appear as clickable chips below the response, helping you explore topics further without typing new prompts.

Settings
Configure follow-up prompt behavior in Settings > Interface under the Chat section:

Follow-Up Auto-Generation
Default: On

Automatically generates follow-up question suggestions after each response. These suggestions are generated by the task model based on the conversation context.

On: Follow-up prompts are generated after each model response
Off: No follow-up suggestions are generated
Keep Follow-Up Prompts in Chat
Default: Off

By default, follow-up prompts only appear for the most recent message and disappear when you continue the conversation.

On: Follow-up prompts are preserved and remain visible for all messages in the chat history
Off: Only the last message shows follow-up prompts
Perfect for Knowledge Exploration
Enable this setting when exploring a knowledge base. You can see all the suggested follow-ups from previous responses, making it easy to revisit and explore alternative paths through the information.

Insert Follow-Up Prompt to Input
Default: Off

Controls what happens when you click a follow-up prompt.

On: Clicking a follow-up inserts the text into the input field, allowing you to edit it before sending
Off: Clicking a follow-up immediately sends it as your next message
Regenerating Follow-Ups
If you want to regenerate follow-up suggestions for a specific response, you can use the Regenerate Follow-ups action button from the community.

History & Search
Open WebUI provides a powerful system for managing and navigating your previous conversations. Whether you are looking for a specific snippet of code from last month or trying to organize hundreds of chats, the history and search features help you find your data quickly.

Chat History Sidebar
All your conversations are automatically saved in the Sidebar.

Persistence: Chats are saved to the internal database (webui.db) and are available across all your devices.
Organization: Chats are grouped by time period (Today, Yesterday, Previous 7 Days, etc.).
Unread Indicator: Chats with new activity show an unread dot in the sidebar until you open them.
Renaming: Titles are automatically generated by a task model, but you can manually rename any chat by clicking the pencil icon next to its title.
Archivial: Instead of deleting, you can Archive chats to remove them from the main list while keeping them downloadable and searchable.
Open WebUI tracks read state per chat and updates it when you open a conversation, so unread indicators stay in sync across sessions.

Searching Your History
You can search through your conversations using the global search bar in the sidebar.

Click the Search icon or use the keyboard shortcut Cmd+K / Ctrl+K.
Type your query. Open WebUI performs a fuzzy search across:
Chat Titles
Message Content
Tags (Search using tag:my-tag-name)
Click on a result to immediately jump to that conversation.
Native Conversation Search (Agentic)
When using a model with Native Function Calling enabled (see the Central Tool Calling Guide), models can search through your chat history autonomously.

Available History Tools:
search_chats: Simple text search across chat titles and message content. Returns matching chat IDs and snippets.
view_chat: Reads and returns the full message history of a specific chat by ID.
Why use native tool calling for Search?
This allows the model to leverage its own previous work. You can ask: "What was the feedback I got on my last email draft?" or "Find the Python script I wrote about image processing two weeks ago."

The model will search your history, identify the correct chat, read it, and provide you with an answer or the code you were looking for—saving you the effort of manual scrolling and copy-pasting.

Data Management
Export: You can download individual chats or your entire history as JSON, PDF, or Markdown.
Import: Drag and drop a JSON chat export into the sidebar to restore it.
Deletion: You can delete individual chats or clear your entire history from Settings > Chats.

Message Queue
The Message Queue feature allows you to continue composing and sending messages while the AI is still generating a response. Instead of blocking your input until the current response completes, your messages are queued and automatically sent in sequence.

How It Works
When you send a message while the AI is generating a response:

Your message is queued - It appears in a compact queue area just above the input box
You can continue working - Add more messages, edit queued messages, or delete them
Automatic processing - Once the current response finishes, all queued messages are combined and sent together
This creates a seamless workflow where you can capture thoughts as they come without waiting for the AI to finish.

Queue Management
Each queued message shows three action buttons:

Action	Icon	Description
Send Now	↑	Interrupts the current generation and sends this message immediately
Edit	✏️	Removes the message from the queue and puts it back in the input field
Delete	🗑️	Removes the message from the queue without sending
Combining Messages
When the AI finishes generating, all queued messages are combined into a single prompt (separated by blank lines) and sent together. This means:

Multiple quick thoughts become one coherent message
Context flows naturally between your queued inputs
The AI receives everything at once for better understanding
Persistence
The message queue is preserved when you navigate between chats within the same browser session:

Leaving a chat - Queue is saved to session storage
Returning to the chat - Queue is restored and processed
Closing the browser - Queue is cleared (session storage only)
This means you can start a thought, switch to another chat to check something, and return to find your queued messages waiting.

Settings
You can disable the Message Queue feature if you prefer the traditional behavior:

Go to Settings → Interface
Find Enable Message Queue under the Chat section
Toggle it off
When disabled, sending a message while the AI is generating will:

Interrupt the current generation
Send your new message immediately
Default Behavior
Message Queue is enabled by default. The toggle allows you to choose between:

Queue mode (default) - Messages queue up until generation completes
Interrupt mode - New messages stop current generation immediately
Use Cases
1. Stream of Consciousness
You're reading an AI response and have follow-up questions. Instead of waiting:

Queue your first follow-up
Queue a clarification
Queue another thought
All are sent together when the AI finishes.

2. Adding Context
The AI is working on a complex response, but you remember additional context:

Queue the extra information
The AI receives it as part of the next message
3. Multitasking
You're in a long conversation and need to capture quick notes:

Queue messages as reminders
Edit or delete before they're sent
Use "Send Now" for urgent interruptions
Summary
Feature	Behavior
Enabled	Messages queue during generation, sent together when complete
Disabled	New messages interrupt current generation immediately
Persistence	Queue survives navigation within session
Actions	Send Now, Edit, Delete for each queued item
The Message Queue helps you maintain your flow of thought without the friction of waiting for AI responses to complete.

Reasoning & Thinking Models
Open WebUI provides first-class support for models that exhibit "thinking" or "reasoning" behaviors (such as DeepSeek R1, OpenAI o1, and others). These models often generate internal chains of thought before providing a final answer.

How Thinking Tags Work
When a model generates reasoning content, it typically wraps that content in specific XML-like tags (e.g., <think>...</think> or <thought>...</thought>).

Open WebUI automatically:

Detects these tags in the model's output stream.
Extracts the content between the tags.
Renders the extracted content in a collapsible UI element labeled "Thought" or "Thinking".
This keeps the main chat interface clean while still giving you access to the model's internal processing.

The reasoning_tags Parameter
You can customize which tags Open WebUI should look for using the reasoning_tags parameter. This can be set on a per-chat or per-model basis.

Default Tags
By default, Open WebUI looks for several common reasoning tag pairs:

<think>, </think>
<thinking>, </thinking>
<reason>, </reason>
<reasoning>, </reasoning>
<thought>, </thought>
<|begin_of_thought|>, <|end_of_thought|>
Customization
If your model uses different tags, you can provide a list of tag pairs in the reasoning_tags parameter. Each pair is a tuple or list of the opening and closing tag.

Configuration & Behavior
Stripping from Payload: The reasoning_tags parameter itself is an Open WebUI-specific control and is stripped from the payload before being sent to the LLM backend (OpenAI, Ollama, etc.). This ensures compatibility with providers that do not recognize this parameter.
Chat History: Reasoning content is preserved in chat history and sent back to the model across turns. When building messages for subsequent requests, Open WebUI serializes the reasoning content with its original tags (e.g., <think>...</think>) and includes it in the assistant message's content field. This allows the model to "remember" its previous reasoning steps across the entire conversation.
UI Rendering: Internally, reasoning blocks are processed and rendered using a specialized UI component. When saved or exported, they may be represented as HTML <details type="reasoning"> tags.
Open WebUI Settings
Open WebUI provides several built-in settings to configure reasoning model behavior. These can be found in:

Chat Controls (sidebar) → Advanced Parameters — per-chat settings
Workspace → Models → Edit Model → Advanced Parameters — per-model settings (Admin only)
Admin Panel → Settings → Models → select a model → Advanced Parameters — alternative per-model settings location
Reasoning Tags Setting
This setting controls how Open WebUI parses and displays thinking/reasoning blocks:

Option	Description
Default	Uses the system default behavior
Enabled	Explicitly enables reasoning tag detection using default <think>...</think> tags
Disabled	Turns off reasoning tag detection entirely
Custom	Allows you to specify custom start and end tags
Using Custom Tags
If your model uses non-standard reasoning tags (e.g., <reasoning>...</reasoning> or [思考]...[/思考]), select Custom and enter:

Start Tag: The opening tag (e.g., <reasoning>)
End Tag: The closing tag (e.g., </reasoning>)
This is useful for:

Models with localized thinking tags
Custom fine-tuned models with unique tag formats
Models that use XML-style reasoning markers
think (Ollama)
This Ollama-specific setting enables or disables the model's built-in reasoning feature:

Option	Description
Default	Uses Ollama's default behavior
On	Explicitly enables thinking mode for the model
Off	Disables thinking mode
note
This setting sends the think parameter directly to Ollama. It's separate from how Open WebUI parses the response—you may need both this setting AND proper reasoning tags configuration for the full experience.

Reasoning Effort
For models that support variable reasoning depth (like some API providers), this setting controls how much effort the model puts into reasoning:

Common values: low, medium, high
Some providers accept numeric values
info
Reasoning Effort is only applicable to models from specific providers that support this parameter. It has no effect on local Ollama models.

Interleaved Thinking with Tool Calls
When a model uses native function calling (tool use) within a single turn, Open WebUI preserves the reasoning content and sends it back to the API for subsequent calls within that turn. This enables true "interleaved thinking" where:

Model generates reasoning → makes a tool call
Tool executes and returns results
Model receives: original messages + previous reasoning + tool call + tool result
Model continues reasoning → may make more tool calls or provide final answer
Process repeats until the turn completes
How It Works
During a multi-step tool calling turn, Open WebUI:

Captures reasoning content from the model's response (via reasoning_content, reasoning, or thinking fields in the delta)
Stores it in content blocks alongside tool calls
Serializes the reasoning with its original tags (e.g., <think>...</think>) when building messages for the next API call
Includes the serialized content in the assistant message's content field
This ensures the model has access to its previous thought process when deciding on subsequent actions within the same turn.

How Reasoning Is Sent Back
There are two parallel paths, and which one applies depends on how the prior turn's reasoning was captured — not on the provider you're sending to.

Path 1 — Reasoning embedded in content (default for most providers)
When a model streams reasoning as <think>…</think> (or any other configured tag pair) inline in its content, Open WebUI keeps those tags as part of message.content. On the next turn the message is forwarded to the LLM verbatim, tags and all. Nothing is dropped, no provider-specific handling kicks in. This is the path you're most likely already on — it is also what the Interleaved Thinking with Tool Calls section above describes.

Path 2 — Reasoning captured into a structured output array
If the upstream stream emits reasoning_content / reasoning / thinking deltas (rather than text tags) — typical for OpenAI o-series, DeepSeek's official API, llama.cpp with reasoning enabled, or Ollama with the --reasoning-parser flag — Open WebUI captures those deltas into a separate reasoning item inside the assistant message's output array. The displayed content only contains a <details type="reasoning"> block for the UI; the structured form lives on output.

When that message is replayed to the LLM (within a tool-call loop or on the next user turn), Open WebUI rebuilds it from output rather than forwarding the rendered content. The format used for the rebuilt reasoning depends on the connection's Provider setting (Admin Settings → Connections → OpenAI → Provider dropdown — options are Default, Azure OpenAI, llama.cpp; Ollama connections are detected automatically):

Connection Provider	Rebuilt reasoning format
Ollama (auto-detected)	Wrapped in tags inside content: <think>…</think>
llama.cpp	Top-level reasoning_content field on the assistant message
Default / Azure OpenAI	Reasoning is omitted from the rebuilt message
The "omit on default/strict" choice is deliberate: OpenAI, Azure OpenAI, Vertex AI, and similar Chat Completions APIs reject assistant messages with unknown fields, and they don't expect their own reasoning echoed back on the next call (they manage continuity stateside via previous_response_id for the Responses API, or simply don't need it). Pipe functions and filters can re-inject reasoning in a provider-specific shape when needed.

For Ollama, a rebuilt message looks like:

{
  "role": "assistant",
  "content": "<think>Let me search for the current weather data...</think>",
  "tool_calls": [...]
}

For a llama.cpp connection it looks like:

{
  "role": "assistant",
  "content": "",
  "reasoning_content": "Let me search for the current weather data...",
  "tool_calls": [...]
}

Provider Compatibility
Provider type	Path 1 (tags in content)	Path 2 (structured output)
OpenAI-compatible APIs that emit <think> tags inline (DeepSeek-R1 via Ollama, Qwen3 with the reasoning parser, etc.)	✅ Round-trips automatically.	n/a
Ollama (connection auto-tagged as ollama)	✅ Round-trips.	✅ Rebuilt as <think>…</think> in content.
llama.cpp (connection Provider set to llama.cpp)	✅ Round-trips if the model uses tags.	✅ Rebuilt as reasoning_content field.
OpenAI o-series (Responses API)	n/a — o-series doesn't expose reasoning text.	⚠️ Reasoning continuity is handled by previous_response_id, not by re-sending content.
OpenAI / Azure / Vertex AI (Chat Completions, Provider Default)	✅ Tags pass through as text — most strict providers tolerate them.	⚠️ Structured reasoning is omitted on rebuild (use a pipe/filter to re-inject if you need it).
Anthropic (extended thinking)	⚠️ Tags work, but the native API expects {"type": "thinking"} blocks for true extended thinking — use a pipe function.	❌ Not natively supported.
Important Notes
Detection is unchanged. Reasoning is detected from incoming streams the same way it always was — <think>-style tag matching for Path 1, reasoning_content / reasoning / thinking deltas for Path 2. The provider-aware behavior added here only governs how Path 2 reasoning is rebuilt when the message is replayed.
Within-turn vs. cross-turn use the same logic. The same rebuild rules apply whether Open WebUI is sending the message inside a multi-step tool-call loop or building the payload for a fresh user turn.
Most users are on Path 1. Models that emit <think> tags inline (the DeepSeek-R1 family on Ollama, Qwen3, MiniMax M2.5, etc.) keep their reasoning in content and continue to round-trip without any provider configuration.
Streaming vs Non-Streaming
Streaming Mode (Default)
In streaming mode (stream: true), Open WebUI processes tokens as they arrive and can detect reasoning blocks in real-time. This generally works well without additional configuration.

Non-Streaming Mode
In non-streaming mode (stream: false), the entire response is returned at once. This is where most parsing issues occur because:

The response arrives as a single block of text
Without the reasoning parser, no post-processing separates the <think> content
The raw response is displayed as-is
Important
If you're using non-streaming requests (via API or certain configurations), the reasoning parser is essential for proper thinking block separation.

API Usage
When using the Open WebUI API with reasoning models:

{
  "model": "qwen3:32b",
  "messages": [
    {"role": "user", "content": "Solve: What is 234 * 567?"}
  ],
  "stream": true
}

Recommendation: Use "stream": true for the most reliable reasoning block parsing.

Troubleshooting
Thinking Content Merged with Final Answer
Symptom: When using a reasoning model, the entire response (including <think>...</think> blocks) is displayed as the final answer, instead of being separated into a hidden/collapsible thinking section.

Example of incorrect display:

<think>
Okay, the user wants a code snippet for a sticky header using CSS and JavaScript.
Let me think about how to approach this.
...
I think that's a solid approach. Let me write the code now.
</think>

Here's a complete code snippet that demonstrates a sticky header using CSS and JavaScript...

Expected behavior: The thinking content should be hidden or collapsible, with only the final answer visible.

For Ollama Users
The most common cause is that Ollama is not configured with the correct reasoning parser. When running Ollama, you need to specify the --reasoning-parser flag to enable proper parsing of thinking blocks.

Step 1: Configure the Reasoning Parser
When starting Ollama, add the --reasoning-parser flag:

# For DeepSeek-R1 style reasoning (recommended for most models)
ollama serve --reasoning-parser deepseek_r1

# Alternative parsers (if the above doesn't work for your model)
ollama serve --reasoning-parser qwen3
ollama serve --reasoning-parser deepseek_v3

Recommended Parser
For most reasoning models, including Qwen3 and DeepSeek variants, use --reasoning-parser deepseek_r1. This parser handles the standard <think>...</think> format used by most reasoning models.

Step 2: Restart Ollama
After adding the flag, restart the Ollama service:

# Stop Ollama
# On Linux/macOS:
pkill ollama

# On Windows (PowerShell):
Stop-Process -Name ollama -Force

# Start with the reasoning parser
ollama serve --reasoning-parser deepseek_r1

Step 3: Verify in Open WebUI
Go to Open WebUI and start a new chat with your reasoning model
Ask a question that requires reasoning (e.g., a math problem or logic puzzle)
The response should now show the thinking content in a collapsible section
Available Reasoning Parsers
Parser	Description	Use Case
deepseek_r1	DeepSeek R1 format	Most reasoning models, including Qwen3
deepseek_v3	DeepSeek V3 format	Some DeepSeek variants
qwen3	Qwen3-specific format	If deepseek_r1 doesn't work with Qwen
Troubleshooting Checklist
1. Verify Ollama Is Running with Reasoning Parser
Check if Ollama was started with the correct flag:

# Check the Ollama process
ps aux | grep ollama
# or on Windows:
Get-Process -Name ollama | Format-List *

Look for --reasoning-parser in the command line arguments.

2. Check Model Compatibility
Not all models output reasoning in the same format. Verify your model's documentation for:

What tags it uses for thinking content (e.g., <think>, <reasoning>, etc.)
Whether it requires specific prompting to enable thinking mode
3. Test with Streaming Enabled
If non-streaming isn't working, try enabling streaming in your chat:

Go to Chat Controls (sidebar)
Ensure streaming is enabled (this is the default)
Test the model again
4. Check Open WebUI Version
Ensure you're running the latest version of Open WebUI, as reasoning model support continues to improve:

docker pull ghcr.io/open-webui/open-webui:main

5. Verify the Model Response Format
Use the Ollama CLI directly to check what format your model outputs:

ollama run your-model:tag "Explain step by step: What is 15 + 27?"

Look for <think> tags in the output. If they're not present, the model may require specific system prompts to enable thinking mode.

Reasoning Lost Between Tool Calls
Symptom: The model seems to "forget" what it was thinking about after a tool call completes.

Possible Causes:

The model doesn't output reasoning in a captured format (reasoning_content, reasoning, or thinking delta fields)
The model uses text-based thinking tags that aren't being parsed as reasoning blocks
Solution: Check if your model outputs reasoning through:

Structured delta fields (reasoning_content, reasoning, thinking)
Text-based tags that Open WebUI detects (ensure reasoning tag detection is enabled)
Anthropic Extended Thinking Not Working with Tool Calls
Symptom: Using Anthropic's Claude models with extended thinking enabled, but tool calls fail with errors like:

Expected `thinking` or `redacted_thinking`, but found `text`. When `thinking` is enabled, 
a final `assistant` message must start with a thinking block.

Cause: This is a fundamental architectural difference. Open WebUI follows the OpenAI Chat Completions API standard and does not natively support Anthropic's proprietary API format. Anthropic's extended thinking requires structured content blocks with {"type": "thinking"} or {"type": "redacted_thinking"}, which are Anthropic-specific formats that don't exist in the OpenAI standard.

Open WebUI serializes reasoning as text wrapped in tags (e.g., <think>...</think>) inside the message content field. This works with OpenAI-compatible APIs but does not satisfy Anthropic's requirement for structured thinking blocks.

Why Open WebUI Doesn't Support This Natively:

There is no standard way for storing reasoning content as part of the API payload across different providers. If Open WebUI implemented support for one provider's format, it would likely break existing deployments for many other inference providers. Given the wide variety of backends Open WebUI supports, we follow the OpenAI Completions API as the common standard. For more details on this architectural decision, see our FAQ on protocol support.

Workarounds:

Use a Pipe Function: Create a custom pipe function that converts Open WebUI's text-based thinking format to Anthropic's structured thinking blocks before sending requests to the Anthropic API.

Disable Extended Thinking: If you don't need extended thinking for tool-calling workflows, disable it to avoid the format mismatch.

note
This limitation applies specifically to combining Anthropic's extended thinking with tool calls. Extended thinking works without tool calls, and tool calls work without extended thinking—the issue only occurs when using both features together via the Anthropic API.

Stateful Reasoning Models (GPT-5.2, etc.)
Symptom: Using a model that hides its reasoning (stateful/internal reasoning), and reasoning is not being preserved.

Cause: Some newer models (like GPT-5.2) keep their reasoning internal and don't expose it in the API response. Open WebUI can only preserve reasoning that is actually returned by the model.

Behavior: If the model returns a reasoning summary instead of full reasoning content, that summary is what gets preserved and sent back.

Frequently Asked Questions
Why is the thinking block showing as raw text?
If the model uses tags that are not in the default list and have not been configured in reasoning_tags, Open WebUI will treat them as regular text. You can fix this by adding the correct tags to the reasoning_tags parameter in the Model Settings or Chat Controls.

Does the model see its own thinking?
Yes. Reasoning content is preserved and sent back to the model in both scenarios:

Within the same turn (during tool calls): Yes. When a model makes tool calls, Open WebUI preserves the reasoning content and sends it back to the API as part of the assistant message. This enables the model to maintain context about what it was thinking when it made the tool call.

Across different turns: Yes. When building messages for subsequent requests, Open WebUI serializes reasoning content from previous turns with its original tags (e.g., <think>...</think>) and includes it in the assistant message's content field. This allows the model to reference its previous reasoning throughout the conversation.

How is reasoning sent during tool calls?
When tool calls are involved, reasoning is serialized as text with its original tags and included in the assistant message's content field. For example:

<think>Let me search for the current weather...</think>

This text-based format works with most OpenAI-compatible providers. However, some providers (like Anthropic) may expect structured thinking content blocks in a specific format—Open WebUI currently uses text-based serialization rather than provider-specific structured formats.

Automations
Automations let you schedule prompts to run automatically at recurring times. Each run creates a chat and executes through the normal chat completion pipeline, so model defaults, tools, filters, and other pipeline behavior still apply.

Automations can be enabled or disabled globally by an administrator via the ENABLE_AUTOMATIONS environment variable or the Admin Panel > Settings > General toggle. When disabled, the automation worker stops processing, API endpoints return 403, and the sidebar entry is hidden.

What You Can Automate
Run a prompt on a schedule (hourly, daily, weekly, monthly, custom RRULE)
Trigger a run manually with Run Now
Pause/resume automations without deleting them
Review execution history for each automation
Optionally attach a terminal server and working directory for runs that need terminal context
Access Control
Automations are permission-gated for non-admin users.

Admins: always have access to Automations
Users: require the Features > Automations permission
See RBAC Permissions for the permission category.

To grant user access:

Open Admin Panel > Users > Groups
Edit Default permissions or a specific group
Enable Features > Automations
You can also set this default via USER_PERMISSIONS_FEATURES_AUTOMATIONS.

Quick Access
Hold Shift in the User Menu to reveal pin/unpin buttons. Pinning Automations adds a shortcut icon to the sidebar rail for one-click access.

Admin Limits
Administrators can set global limits on automation usage for non-admin users. These are configured via environment variables. Admins bypass all limits.

Setting	Effect	Env Variable
Max Automation Count	Caps the number of automations a user can create	AUTOMATION_MAX_COUNT
Min Recurrence Interval	Rejects schedules that run more frequently than the configured interval (in seconds)	AUTOMATION_MIN_INTERVAL
Max count is checked only on creation. Existing automations are not deleted if the limit is lowered.
Min interval is checked on both creation and update. One-time automations (COUNT=1) are exempt.
Both default to empty (no limit). Set to a positive integer to enforce.
Create an Automation
Open User Menu > Automations
Click New Automation
Set:
Title
Instructions (prompt)
Model
Schedule
(Optional) Select a Terminal server and Working Directory
Click Create
After creation, Open WebUI opens the dedicated automation editor page at /automations/{id}.

Edit and Manage
From the Automations list, click an automation to open its dedicated editor page.

On the editor page, you can:

Update title, instructions, model, schedule, and terminal settings
Save changes
Run immediately with Run now
Pause/resume automation state
Delete the automation
Review execution logs and open run chats
Execution logs are paginated with infinite scroll in the editor, so large run histories load incrementally.

Scheduling
Supported schedule modes:

Once
Hourly
Daily
Weekly
Monthly
Custom (RRULE)
Custom schedules accept standard RRULE syntax. Invalid or exhausted rules are rejected.

Notes
Automations run in the background worker loop on a polling interval.
Every run records a status (success or error) and optional error details.
Deleting an automation also removes its run history.
Managing Automations from Chat
When using Native Function Calling Mode with a capable model, automations can also be created and managed directly from within a chat conversation using builtin tools. This allows you to say things like "Schedule a daily summary report at 9am" and the model will create the automation for you.

Available tools
Tool	What it does
create_automation	Create a new scheduled automation with a name, prompt, and RRULE schedule. Uses the current chat model.
update_automation	Update an existing automation's name, prompt, schedule, or model
list_automations	List your scheduled automations with status, schedule, and next runs
toggle_automation	Pause or resume a scheduled automation
delete_automation	Delete a scheduled automation and all its run history
Requirements
For chat-based automation tools to be available:

Native Function Calling must be enabled for the model
Builtin Tools capability must be enabled for the model
Automations category must be enabled in the model's Builtin Tools settings (enabled by default)
ENABLE_AUTOMATIONS must be enabled globally (enabled by default)
The user must have the Features > Automations permission (admins always pass)
See the Builtin Tools reference for full details on all builtin tools.

Temporal Awareness (Date & Time)
For an AI to be truly helpful, it needs to understand the concept of time. Open WebUI provides models with the current date, time, and timezone so they can deliver contextually relevant answers (e.g., "What's on my schedule today?" or "Summarize my meetings from yesterday").

System-Level Awareness
By default, Open WebUI injects temporal variables into the model's environment via the system prompt. Even without specialized tools, most models are aware of:

CURRENT_DATE: Injected as YYYY-MM-DD.
CURRENT_TIME: Injected as HH:MM.
CURRENT_WEEKDAY: (e.g., Monday, Tuesday).
These variables can be manually used in Prompts or Model Files using the {{CURRENT_DATE}} syntax.

Native Temporal Tools (Agentic)
When using a model with Native Function Calling enabled (see the Central Tool Calling Guide), models gain granular control over time calculations and queries.

Available Time Tools:
get_current_timestamp: The model can retrieve the exact current Unix timestamp (UTC) and ISO date string.
calculate_timestamp: The model can perform relative time arithmetic (e.g., "Calculate the date for 3 days ago" or "When is next Friday?").
Why use native tool calling for Time?
While static variables tell the model "when it is now," native tools allow the model to reason about time.

If you ask: "Find the notes I wrote last Tuesday," a model without tools might guess the date incorrectly. A tool-equipped model will:

Calculate the exact date of "last Tuesday" using calculate_timestamp.
Search your notes using that specific date as a filter via search_notes.
This precision is essential for reliable agentic workflows that involve searching history, scheduling tasks, or analyzing time-sensitive data.

Task Management
Task Management gives agentic models a structured way to plan and track multi-step work in a chat. Instead of keeping an implicit plan in free text, the model can maintain a live task list with explicit statuses.

Why This Matters for Agentic AI
For simple Q&A, a single response is enough. For true agentic workflows (research, debugging, migrations, investigations), models need a reliable execution loop:

break down work,
execute steps,
update progress,
adapt the plan.
Task lists make that loop visible to the user and reduce failures caused by skipped or forgotten steps.

How It Works
The model uses two built-in tools to manage the list:

create_tasks — called once at the start of multi-step work to lay out the full checklist.
update_task — called after finishing each step, to mark a single task by id as pending, in_progress, completed, or cancelled.
When these tools are used:

Tasks are stored at the chat level
The UI shows progress in-chat (e.g., completed vs total)
Status changes are reflected in real time
Supported statuses:

pending
in_progress
completed
cancelled
Enabling It
Task Management is controlled per model in Builtin Tools:

Go to Workspace > Models > Edit
Ensure Capabilities > Builtin Tools is enabled
Under builtin categories, keep Task Management enabled
See Built-in System Tools for tool details.

Best Practices
Use task lists for requests that need multiple concrete steps
Keep only one task in in_progress at a time
Mark tasks completed immediately after finishing
Cancel stale tasks explicitly instead of leaving them pending

Retrieval Augmented Generation (RAG)
warning
If you're using Ollama, note that it defaults to a 2048-token context length. This severely limits Retrieval-Augmented Generation (RAG) performance, especially for web search, because retrieved data may not be used at all or only partially processed.

Retrieval Augmented Generation (RAG) is a technique that enhances the conversational capabilities of chatbots by incorporating context from diverse sources. It works by retrieving relevant information from a wide range of sources such as local and remote documents, web content, and even multimedia sources like YouTube videos. The retrieved text is then combined with a predefined RAG template and prefixed to the user's prompt, providing a more informed and contextually relevant response.

One of the key advantages of RAG is its ability to access and integrate information from a variety of sources, making it an ideal solution for complex conversational scenarios. For instance, when a user asks a question related to a specific document or web page, RAG can retrieve and incorporate the relevant information from that source into the chat response. RAG can also retrieve and incorporate information from multimedia sources like YouTube videos. By analyzing the transcripts or captions of these videos, RAG can extract relevant information and incorporate it into the chat response.

Local and Remote RAG Integration
Local documents must first be uploaded via the Documents section of the Workspace area to access them using the # symbol before a query. Click on the formatted URL in the that appears above the chat box. Once selected, a document icon appears above Send a message, indicating successful retrieval.

Bulk File Management
Need to clean up multiple uploaded documents or audit your storage? You can now use the centralized File Manager located in Settings > Data Controls > Manage Files. Deleting files there will automatically clean up their corresponding RAG embeddings.

You can also load documents into the workspace area with their access by starting a prompt with #, followed by a URL. This can help incorporate web content directly into your conversations.

Web Search for RAG
warning
Context Length Warning for Ollama Users: Web pages typically contain 4,000-8,000+ tokens even after content extraction, including main content, navigation elements, headers, footers, and metadata. With only 2048 tokens available, you're getting less than half the page content, often missing the most relevant information. Even 4096 tokens is frequently insufficient for comprehensive web content analysis.

To Fix This: Navigate to Admin Panel > Models > Settings (of your Ollama model) > Advanced Parameters and increase the context length to 8192+ (or rather, more than 16000) tokens. This setting specifically applies to Ollama models. For OpenAI and other integrated models, ensure you're using a model with sufficient built-in context length (e.g., GPT-4 Turbo with 128k tokens).

For web content integration, start a query in a chat with #, followed by the target URL. Click on the formatted URL in the box that appears above the chat box. Once selected, a document icon appears above Send a message, indicating successful retrieval. Open WebUI fetches and parses information from the URL if it can.

tip
Web pages often contain extraneous information such as navigation and footer. For better results, link to a raw or reader-friendly version of the page.

RAG Template Customization
Customize the RAG template from the Admin Panel > Settings > Documents menu.

Markdown Header Splitting
When enabled, documents are first split by markdown headers (H1-H6). This preserves document structure and ensures that sections under the same header are kept together when possible. The resulting chunks are then further processed by the standard character or token splitter.

tip
Use the Chunk Min Size Target setting (found in Admin Panel > Settings > Documents) to intelligently merge small sections after markdown splitting, improving retrieval coherence and reducing the total number of vectors in your database.

Chunking Configuration
Open WebUI allows you to fine-tune how documents are split into chunks for embedding. This is crucial for optimal retrieval performance.

Chunk Size: Sets the maximum number of characters (or tokens) per chunk.
Chunk Overlap: Specifies how much content is shared between adjacent chunks to maintain context.
Chunk Min Size Target: Although Markdown Header Splitting is excellent for preserving structure, it can often create tiny, fragmented chunks (e.g., a standalone sub-header, a table of contents entry, a single-sentence paragraph, or a short list item) that lack enough semantic context for high-quality embedding. You can counteract this by setting the Chunk Min Size Target to intelligently merge these small pieces with their neighbors.
Why use a Chunk Min Size Target?
Intelligently merging small sections after markdown splitting provides several key advantages:

Improves RAG Quality: Eliminates tiny, meaningless fragments, ensuring better semantic coherence in each retrieve chunk.
Reduces Vector Database Size: Fewer chunks mean fewer vectors to store, reducing storage costs and memory usage.
Speeds Up Retrieval & Embedding: A smaller index is faster to search, and fewer chunks require fewer embedding API calls (or less local compute). This significantly accelerates document processing when uploading files to chats or knowledge bases, as there is less data to vectorize.
Efficiency & Impact: Testing has shown that a well-configured threshold (e.g., 1000 for a chunk size of 2000) can reduce chunk counts by over 90% while improving accuracy, increasing embedding speed, and enhancing overall retrieval quality by maintaining semantic context.
How the merging algorithm works (technical details)
RAG Embedding Support
Change the RAG embedding model directly in the Admin Panel > Settings > Documents menu. This feature supports Ollama and OpenAI models, enabling you to enhance document processing according to your requirements.

Changing RAG Settings After Initial Setup
If you need to change your chunking configuration (chunk size, overlap) or embedding model after documents have already been indexed, it is important to understand what actions are required and what effects those changes will have.

Changing Chunk Size and Overlap
New documents will automatically use the updated chunk size and overlap settings — no action is required for newly uploaded files.

Existing documents in knowledge bases retain their original chunking until you run a re-index. Retrieval will still work for these old chunks (vector similarity search does not depend on chunk size), but you may notice inconsistent retrieval quality if old and new documents have very different chunk sizes.

tip
If you are only changing chunk settings and not the embedding model, a re-index is not strictly required — old documents will continue to work. However, for consistent retrieval quality across all documents, running a re-index is recommended.

Changing the Embedding Model
Changing the embedding model requires a re-index of all knowledge base documents. Embeddings from different models exist in different vector spaces and are not compatible with each other. Without re-indexing, retrieval against old embeddings will produce poor or nonsensical results.

After changing the embedding model in Admin Panel > Settings > Documents, navigate to Admin Panel > Settings > Documents and click the Reindex button to re-embed all knowledge base documents with the new model.

What Does Re-Indexing Do?
The re-index process performs the following steps for each knowledge base:

Deletes the existing vector collection for the knowledge base.
Re-chunks all files using the current chunk size, overlap, and text splitter settings.
Re-embeds all chunks using the currently configured embedding model.
This means a single re-index applies both chunking setting changes and embedding model changes simultaneously.

Re-indexing does not cover chat files
The re-index operation only processes files that belong to knowledge bases. Files that were uploaded directly into a chat (without being added to a knowledge base) have their own per-file vector collections that are not touched by re-indexing.

If you change the embedding model, those standalone chat file embeddings will still use the old model and retrieval quality for those files will degrade. The only way to update them is to re-upload the files.

Summary
Change	New Documents	Knowledge Base Documents (no re-index)	Knowledge Base Documents (after re-index)	Standalone Chat Files
Chunk Size / Overlap	✅ Uses new settings	⚠️ Old chunks still work, but quality may vary	✅ Re-chunked with new settings	⚠️ Old chunks, re-upload to update
Embedding Model	✅ Uses new model	❌ Old embeddings, incompatible vector space	✅ Re-embedded with new model	❌ Old embeddings, re-upload to update
Citations in RAG Feature
The RAG feature allows users to easily track the context of documents fed to LLMs with added citations for reference points. This ensures transparency and accountability in the use of external sources within your chats.

File Context vs Builtin Tools
Open WebUI provides two separate capabilities that control how files are handled. Understanding the difference is important for configuring models correctly.

File Context Capability
The File Context capability controls whether Open WebUI performs RAG (Retrieval-Augmented Generation) on attached files:

File Context	Behavior
✅ Enabled (default)	Attached files are processed via RAG. Content is retrieved and injected into the conversation context.
❌ Disabled	File processing is completely skipped. No content extraction, no injection. The model receives no file content.
When to disable File Context:

Bypassing RAG entirely: When you don't want Open WebUI to process attached files at all.
Using Builtin Tools only: If you prefer the model to retrieve file content on-demand via tools like query_knowledge_bases rather than having content pre-injected.
Debugging/testing: To isolate whether issues are related to RAG processing.
File Context Disabled = No Pre-Injected Content
When File Context is disabled, file content is not automatically extracted or injected. Open WebUI does not forward files to the model's native API. If you disable this, the only way the model can access file content is through builtin tools (if enabled) that query knowledge bases or retrieve attached files on-demand (agentic file processing).

Per-File Retrieval Mode
Individual files and knowledge bases can also be set to bypass RAG entirely using the "Using Entire Document" toggle. This injects the full file content into every message regardless of native function calling settings. See Full Context vs Focused Retrieval for details.

info
The File Context toggle only appears when File Upload is enabled for the model.

Builtin Tools Capability
The Builtin Tools capability controls whether the model receives native function-calling tools for autonomous retrieval:

Builtin Tools	Behavior
✅ Enabled (default)	In Native Function Calling mode, the model receives tools like query_knowledge_bases, view_knowledge_file, search_chats, etc.
❌ Disabled	No builtin tools are injected. The model works only with pre-injected context.
When to disable Builtin Tools:

Model doesn't support function calling: Smaller or older models may not handle the tools parameter.
Predictable behavior needed: You want the model to work only with what's provided upfront.
Combining the Two Capabilities
These capabilities work independently, giving you fine-grained control:

File Context	Builtin Tools	Result
✅ Enabled	✅ Enabled	Full Agentic Mode: RAG content injected + model can autonomously query knowledge bases
✅ Enabled	❌ Disabled	Traditional RAG: Content injected upfront, no autonomous retrieval tools
❌ Disabled	✅ Enabled	Tools-Only Mode: No pre-injected content, but model can use tools to query knowledge bases or retrieve attached files on-demand
❌ Disabled	❌ Disabled	No File Processing: Attached files are ignored, no content reaches the model
Choosing the Right Configuration
Most models: Keep both enabled (defaults) for full functionality.
Small/local models: Disable Builtin Tools if they don't support function calling.
On-demand retrieval only: Disable File Context, enable Builtin Tools if you want the model to decide what to retrieve rather than pre-injecting everything.
Enhanced RAG Pipeline
The togglable hybrid search sub-feature for our RAG embedding feature enhances RAG functionality via BM25, with re-ranking powered by CrossEncoder, and configurable relevance score thresholds. This provides a more precise and tailored RAG experience for your specific use case.

Filesystem-style knowledge access (kb_exec)
For an even more capable, agentic experience, set ENABLE_KB_EXEC=True. This gives the model a shell-style interface over your knowledge bases (ls, tree, grep, cat, head/tail, read-by-line, with pipes) that capable models tend to chain more reliably than a fan-out of separate search tools, so they locate the right passage more often. It requires native function calling (it is a native-mode builtin tool) and is off by default; in Default Mode it has no effect. We recommend turning it on for capable models. See Filesystem-style access.

YouTube RAG Pipeline
The dedicated RAG pipeline for summarizing YouTube videos via video URLs enables smooth interaction with video transcriptions directly. This innovative feature allows you to incorporate video content into your chats, further enriching your conversation experience.

Document Parsing
A variety of parsers extract content from local and remote documents. For more, see the get_loader function.

Temporary Chat Limitations
When using Temporary Chat, document processing is restricted to frontend-only operations to ensure your data stays private and is not stored on the server. Consequently, advanced backend parsing (used for formats like complex DOCX files) is disabled, which may result in raw data being seen instead of parsed text. For full document support, use a standard chat session.

Google Drive Integration
When paired with a Google Cloud project that has the Google Picker API and Google Drive API enabled, this feature allows users to directly access their Drive files from the chat interface and upload documents, slides, sheets and more and uploads them as context to your chat. Can be enabled Admin Panel > Settings > Documents menu. Must set GOOGLE_DRIVE_API_KEY and GOOGLE_DRIVE_CLIENT_ID environment variables to use.

Detailed Instructions
Create an OAuth 2.0 client and configure both the Authorized JavaScript origins & Authorized redirect URI to be the URL (include the port if any) you use to access your Open-WebUI instance.
Make a note of the Client ID associated with that OAuth client.
Make sure that you enable both Google Drive API and Google Picker API for your project.
Also set your app (project) as Testing and add your Google Drive email to the User List
Set the permission scope to include everything those APIs have to offer. And because the app would be in Testing mode, no verification is required by Google to allow the app from accessing the data of the limited test users.
Go to the Google Picker API page, and click on the create credentials button.
Create an API key and under Application restrictions and choose Websites. Then add your Open-WebUI instance's URL, same as the Authorized JavaScript origins and Authorized redirect URIs settings in the step 1.
Set up API restrictions on the API Key to only have access to Google Drive API & Google Picker API
Set up the environment variable, GOOGLE_DRIVE_CLIENT_ID to the Client ID of the OAuth client from step 2.
Set up the environment variable GOOGLE_DRIVE_API_KEY to the API Key value setup up in step 7 (NOT the OAuth client secret from step 2).
Set up the GOOGLE_REDIRECT_URI to my Open-WebUI instance's URL (include the port, if any).
Then relaunch your Open-WebUI instance with those three environment variables.
After that, make sure Google Drive was enabled under Admin Panel < Settings < Documents < Google Drive