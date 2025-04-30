# Frontend - Sistema de Procesamiento de Facturas

Este directorio contiene el código fuente para la interfaz de usuario web del Sistema Automatizado de Procesamiento de Facturas. Está construido con [Next.js](https://nextjs.org), [React](https://react.dev), [TypeScript](https://www.typescriptlang.org/), y [Tailwind CSS](https://tailwindcss.com/).

## Funcionalidades Principales

*   **Carga de Facturas:** Permite a los usuarios subir archivos de facturas (PDF, JPG, PNG) al backend para su procesamiento.
*   **Visualización de Lista:** Muestra una lista paginada y filtrable de todas las facturas procesadas y en proceso.
*   **Vista Detallada:** Permite ver los detalles de una factura específica, incluyendo su estado actual y los datos extraídos.
*   **Validación y Edición:** Proporciona una interfaz para revisar los datos extraídos (`preview_data`) por OCR/IA, editarlos si es necesario, y luego confirmarlos o rechazarlos.
*   **Actualizaciones en Tiempo Real:** Utiliza WebSockets (Socket.IO) para reflejar cambios de estado y actualizaciones de datos sin necesidad de recargar la página.
*   **Descarga de Archivos:** Permite descargar el archivo original de la factura.
*   **Dashboard (Potencial):** Muestra un resumen del estado de las facturas (basado en el endpoint `status-summary`).

## Tecnologías Clave

*   **Framework:** Next.js 15+
*   **Lenguaje:** TypeScript
*   **UI:** React 19+, Tailwind CSS 4+, Shadcn/UI, Radix UI
*   **Gestión de Estado/Datos:** (Implícito, probablemente React Context o librerías como Zustand/Jotai/SWR no especificadas)
*   **Tablas:** TanStack Table v8
*   **WebSockets:** Socket.IO Client
*   **Estilo:** Tailwind CSS, clsx, tailwind-merge
*   **Linting/Formato:** ESLint
*   **Build Tool:** Next.js (con Turbopack habilitado para desarrollo)

## Configuración y Ejecución

### Ejecución con Docker Compose (Recomendado)

La forma más sencilla de ejecutar el frontend junto con el backend y otros servicios es usando Docker Compose desde la raíz del proyecto.

1.  Asegúrate de tener Docker y Docker Compose instalados.
2.  Sigue las instrucciones de configuración y ejecución en el `README.md` principal del proyecto.
3.  Una vez que los contenedores estén corriendo (`docker-compose up -d`), accede al frontend en `http://localhost:3000`.

La configuración de Docker (`docker/frontend.Dockerfile` y `docker-compose.yml`) se encarga de instalar dependencias y ejecutar el servidor de desarrollo.

### Ejecución Manual (Para Desarrollo Específico del Frontend)

Si deseas ejecutar el frontend de forma aislada (asumiendo que el backend ya está corriendo en `http://localhost:8010`), puedes hacerlo manualmente:

1.  **Prerrequisitos:**
    *   Node.js (versión compatible con Next.js 15+, consulta `.nvmrc` si existe o la documentación de Next.js)
    *   npm, yarn, o pnpm

2.  **Navegar al Directorio:**
    ```bash
    cd frontend
    ```

3.  **Instalar Dependencias:**
    ```bash
    npm install
    # o yarn install
    # o pnpm install
    ```

4.  **Variables de Entorno:**
    *   El frontend necesita saber la URL del backend. Esta se configura a través de la variable de entorno `NEXT_PUBLIC_BACKEND_URL`. Puedes crear un archivo `.env.local` dentro del directorio `frontend`:
        ```plaintext
        # frontend/.env.local
        NEXT_PUBLIC_BACKEND_URL=http://localhost:8010
        ```
    *   *Nota:* La configuración de Docker Compose ya inyecta esta variable en el contenedor `frontend`.

5.  **Iniciar Servidor de Desarrollo:**
    ```bash
    npm run dev
    # o yarn dev
    # o pnpm dev
    ```
    Esto iniciará el servidor de desarrollo de Next.js (con Turbopack) generalmente en `http://localhost:3000`.

## Scripts Disponibles

Dentro del directorio `frontend`, puedes ejecutar los siguientes scripts definidos en `package.json`:

*   `npm run dev`: Inicia el servidor de desarrollo con Fast Refresh y Turbopack.
*   `npm run build`: Compila la aplicación para producción.
*   `npm run start`: Inicia un servidor de producción (después de ejecutar `build`).
*   `npm run lint`: Ejecuta ESLint para verificar el código.

## Estructura del Proyecto (Simplificada)

```
frontend/
├── public/           # Archivos estáticos
├── src/
│   ├── app/          # Rutas y layouts (App Router de Next.js)
│   ├── components/   # Componentes React reutilizables (UI, lógica)
│   ├── hooks/        # Hooks personalizados de React
│   ├── lib/          # Funciones de utilidad, configuración de librerías
│   └── services/     # Lógica para interactuar con la API backend
├── .env.local        # Variables de entorno locales (no subir a Git)
├── next.config.ts    # Configuración de Next.js
├── package.json      # Dependencias y scripts
├── tailwind.config.js # Configuración de Tailwind CSS
├── tsconfig.json     # Configuración de TypeScript
└── ...               # Otros archivos de configuración
```

(Nota: La estructura exacta dentro de `src/` puede variar según las convenciones adoptadas).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```