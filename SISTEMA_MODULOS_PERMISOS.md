# Sistema de Módulos y Permisos por Rol

## 📋 Resumen

Se ha implementado un **sistema completo de módulos con permisos por rol** que permite:

✅ **Definir módulos del sistema** (Dashboard, Consorcios, Unidades, etc.)
✅ **Asignar permisos granulares por rol** (Ver, Crear, Editar, Eliminar)
✅ **Ocultar módulos según el perfil del usuario**
✅ **Gestión completa desde el backend** con endpoints RESTful
✅ **Control de acceso automático** basado en el rol del usuario

---

## 🏗️ Estructura de Base de Datos

### Tabla: `modulos`

Almacena la definición de cada módulo del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | ID único del módulo |
| `nombre` | VARCHAR(50) | Nombre del módulo (ej: "Dashboard") |
| `clave` | VARCHAR(50) | Identificador único (ej: "dashboard") |
| `descripcion` | VARCHAR(200) | Descripción del módulo |
| `icono` | VARCHAR(50) | Nombre del icono (ej: "dashboard") |
| `ruta` | VARCHAR(100) | Ruta del frontend (ej: "/dashboard") |
| `orden` | INT | Orden de visualización en el menú |
| `activo` | BOOLEAN | Si el módulo está activo |
| `requiere_consorcio` | BOOLEAN | Si requiere contexto de consorcio |
| `created_at` | DATETIME | Fecha de creación |
| `updated_at` | DATETIME | Fecha de última actualización |

**Ejemplo de registro:**
```json
{
  "id": 1,
  "nombre": "Dashboard",
  "clave": "dashboard",
  "descripcion": "Panel de control con estadísticas",
  "icono": "dashboard",
  "ruta": "/dashboard",
  "orden": 1,
  "activo": true,
  "requiere_consorcio": false
}
```

---

### Tabla: `roles_modulos`

Tabla intermedia que relaciona roles con módulos (N:M) y define permisos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | ID único de la asignación |
| `rol_id` | INT | ID del rol (FK → roles) |
| `modulo_id` | INT | ID del módulo (FK → modulos) |
| `puede_ver` | BOOLEAN | Si puede ver el módulo |
| `puede_crear` | BOOLEAN | Si puede crear registros |
| `puede_editar` | BOOLEAN | Si puede editar registros |
| `puede_eliminar` | BOOLEAN | Si puede eliminar registros |

**Ejemplo de registro:**
```json
{
  "id": 1,
  "rol_id": 1,
  "modulo_id": 1,
  "puede_ver": true,
  "puede_crear": true,
  "puede_editar": true,
  "puede_eliminar": true
}
```

---

## 📦 Módulos Definidos

Los siguientes módulos están pre-configurados en el sistema:

| # | Módulo | Clave | Icono | Ruta | Requiere Consorcio |
|---|--------|-------|-------|------|-------------------|
| 1 | Dashboard | `dashboard` | dashboard | /dashboard | ❌ |
| 2 | Consorcios | `consorcios` | building | /consorcios | ❌ |
| 3 | Unidades | `unidades` | apartment | /unidades | ✅ |
| 4 | Personas | `personas` | people | /personas | ❌ |
| 5 | Usuarios | `usuarios` | person | /usuarios | ❌ |
| 6 | Proveedores | `proveedores` | store | /proveedores | ❌ |
| 7 | Expensas | `expensas` | receipt | /expensas | ✅ |
| 8 | Tickets | `tickets` | support | /tickets | ❌ |

---

## 🔐 Matriz de Permisos por Rol

### Leyenda
- ✅ = Permitido
- ❌ = No permitido
- **V** = Ver | **C** = Crear | **E** = Editar | **D** = Eliminar

### Admin Global
**Acceso completo a todo el sistema**

| Módulo | Ver | Crear | Editar | Eliminar |
|--------|-----|-------|--------|----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Consorcios | ✅ | ✅ | ✅ | ✅ |
| Unidades | ✅ | ✅ | ✅ | ✅ |
| Personas | ✅ | ✅ | ✅ | ✅ |
| Usuarios | ✅ | ✅ | ✅ | ✅ |
| Proveedores | ✅ | ✅ | ✅ | ✅ |
| Expensas | ✅ | ✅ | ✅ | ✅ |
| Tickets | ✅ | ✅ | ✅ | ✅ |

### Tenant Admin
**Gestión de sus consorcios**

| Módulo | Ver | Crear | Editar | Eliminar |
|--------|-----|-------|--------|----------|
| Dashboard | ✅ | ❌ | ❌ | ❌ |
| Consorcios | ✅ | ✅ | ✅ | ✅ |
| Unidades | ✅ | ✅ | ✅ | ✅ |
| Personas | ✅ | ✅ | ✅ | ✅ |
| Usuarios | ✅ | ✅ | ✅ | ❌ |
| Proveedores | ✅ | ✅ | ✅ | ✅ |
| Expensas | ✅ | ✅ | ✅ | ❌ |
| Tickets | ✅ | ✅ | ✅ | ❌ |

### Admin Consorcio
**Gestión de su consorcio específico**

| Módulo | Ver | Crear | Editar | Eliminar |
|--------|-----|-------|--------|----------|
| Dashboard | ✅ | ❌ | ❌ | ❌ |
| Consorcios | ✅ | ❌ | ✅ | ❌ |
| Unidades | ✅ | ✅ | ✅ | ✅ |
| Personas | ✅ | ✅ | ✅ | ❌ |
| Usuarios | ❌ | ❌ | ❌ | ❌ |
| Proveedores | ✅ | ✅ | ✅ | ❌ |
| Expensas | ✅ | ✅ | ✅ | ❌ |
| Tickets | ✅ | ✅ | ✅ | ❌ |

### Admin Edificio
**Solo lectura de su edificio**

| Módulo | Ver | Crear | Editar | Eliminar |
|--------|-----|-------|--------|----------|
| Dashboard | ✅ | ❌ | ❌ | ❌ |
| Consorcios | ✅ | ❌ | ❌ | ❌ |
| Unidades | ✅ | ❌ | ❌ | ❌ |
| Personas | ✅ | ❌ | ❌ | ❌ |
| Usuarios | ❌ | ❌ | ❌ | ❌ |
| Proveedores | ✅ | ❌ | ❌ | ❌ |
| Expensas | ✅ | ❌ | ❌ | ❌ |
| Tickets | ✅ | ✅ | ❌ | ❌ |

### Propietario / Inquilino
**Solo lectura de su información + Crear tickets**

| Módulo | Ver | Crear | Editar | Eliminar |
|--------|-----|-------|--------|----------|
| Dashboard | ✅ | ❌ | ❌ | ❌ |
| Consorcios | ✅ | ❌ | ❌ | ❌ |
| Unidades | ✅ | ❌ | ❌ | ❌ |
| Personas | ❌ | ❌ | ❌ | ❌ |
| Usuarios | ❌ | ❌ | ❌ | ❌ |
| Proveedores | ❌ | ❌ | ❌ | ❌ |
| Expensas | ✅ | ❌ | ❌ | ❌ |
| Tickets | ✅ | ✅ | ❌ | ❌ |

### Proveedor
**Solo tickets asignados**

| Módulo | Ver | Crear | Editar | Eliminar |
|--------|-----|-------|--------|----------|
| Tickets | ✅ | ❌ | ✅ | ❌ |
| *Resto* | ❌ | ❌ | ❌ | ❌ |

### Usuario Pendiente
**Sin acceso** (usuario bloqueado hasta aprobación)

| Módulo | Ver | Crear | Editar | Eliminar |
|--------|-----|-------|--------|----------|
| *Todos* | ❌ | ❌ | ❌ | ❌ |

---

## 🚀 Endpoints Disponibles

### 🔹 Obtener módulos del usuario autenticado

**El endpoint más importante para el frontend**

```http
GET /modulos/mis-modulos
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "rol": "propietario",
  "count": 5,
  "data": [
    {
      "id": 1,
      "nombre": "Dashboard",
      "clave": "dashboard",
      "descripcion": "Panel de control",
      "icono": "dashboard",
      "ruta": "/dashboard",
      "orden": 1,
      "activo": true,
      "requiere_consorcio": false,
      "modulo_roles": [
        {
          "puede_ver": true,
          "puede_crear": false,
          "puede_editar": false,
          "puede_eliminar": false
        }
      ]
    }
  ]
}
```

**¿Cómo usarlo en el frontend?**

```javascript
// React/Vue/Angular
async function loadUserModules() {
  const response = await fetch('/modulos/mis-modulos', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const { data } = await response.json();

  // Filtrar solo módulos que el usuario puede ver
  const modulosVisibles = data.filter(m =>
    m.modulo_roles[0].puede_ver
  );

  // Renderizar menú dinámicamente
  return modulosVisibles.map(modulo => ({
    nombre: modulo.nombre,
    icono: modulo.icono,
    ruta: modulo.ruta,
    permisos: {
      crear: modulo.modulo_roles[0].puede_crear,
      editar: modulo.modulo_roles[0].puede_editar,
      eliminar: modulo.modulo_roles[0].puede_eliminar
    }
  }));
}
```

---

### 🔹 Listar todos los módulos (Admin)

```http
GET /modulos
Authorization: Bearer {token}
Roles permitidos: admin_global, tenant_admin
```

---

### 🔹 Obtener módulos por rol específico (Admin)

```http
GET /modulos/por-rol/:rolId
Authorization: Bearer {token}
Roles permitidos: admin_global, tenant_admin
```

**Ejemplo:**
```http
GET /modulos/por-rol/5
```

---

### 🔹 Obtener matriz completa de permisos (Admin)

```http
GET /modulos/matriz-permisos
Authorization: Bearer {token}
Roles permitidos: admin_global, tenant_admin
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "roles": [...],
    "modulos": [...]
  }
}
```

---

### 🔹 Crear módulo (Admin Global)

```http
POST /modulos
Authorization: Bearer {token}
Roles permitidos: admin_global
Content-Type: application/json

{
  "nombre": "Reportes",
  "clave": "reportes",
  "descripcion": "Módulo de reportes",
  "icono": "chart",
  "ruta": "/reportes",
  "orden": 9,
  "activo": true,
  "requiere_consorcio": false
}
```

---

### 🔹 Asignar o actualizar permisos (Admin Global)

```http
POST /modulos/asignar-rol
Authorization: Bearer {token}
Roles permitidos: admin_global
Content-Type: application/json

{
  "rol_id": 5,
  "modulo_id": 1,
  "puede_ver": true,
  "puede_crear": true,
  "puede_editar": false,
  "puede_eliminar": false
}
```

---

### 🔹 Actualizar módulo (Admin Global)

```http
PUT /modulos/:id
Authorization: Bearer {token}
Roles permitidos: admin_global
```

---

### 🔹 Eliminar módulo (Admin Global)

```http
DELETE /modulos/:id
Authorization: Bearer {token}
Roles permitidos: admin_global
```

---

### 🔹 Eliminar asignación de módulo a rol (Admin Global)

```http
DELETE /modulos/eliminar-asignacion/:id
Authorization: Bearer {token}
Roles permitidos: admin_global
```

---

## ⚙️ Instalación y Configuración

### 1. Ejecutar migración SQL

```bash
# Opción 1: Desde MySQL
mysql -u usuario -p nombre_db < database/6.AgregarModulos.sql

# Opción 2: Desde el cliente MySQL
USE consorcios_dev;
SOURCE database/6.AgregarModulos.sql;
```

**La migración SQL automáticamente:**
- ✅ Crea las tablas `modulos` y `roles_modulos`
- ✅ Inserta los 8 módulos predefinidos
- ✅ Asigna permisos por defecto a todos los roles
- ✅ Muestra un resumen de permisos asignados

---

### 2. (Opcional) Ejecutar seeder JavaScript

Si prefieres usar el seeder en lugar de la migración SQL:

```bash
# Ejecutar seeder de módulos
node src/seeders/modulosSeeder.js
```

**El seeder automáticamente:**
- ✅ Crea/actualiza módulos
- ✅ Asigna permisos a cada rol
- ✅ Muestra progreso detallado
- ✅ Es idempotente (se puede ejecutar múltiples veces)

---

### 3. Reiniciar el servidor

```bash
npm run dev
# o
node src/index.js
```

---

## 🎯 Casos de Uso

### Caso 1: Renderizar menú dinámico en el frontend

```javascript
// Al cargar la aplicación
const modulosUsuario = await fetch('/modulos/mis-modulos')
  .then(res => res.json());

// Renderizar solo módulos permitidos
const menuItems = modulosUsuario.data.map(modulo => ({
  label: modulo.nombre,
  icon: modulo.icono,
  route: modulo.ruta,
  permissions: {
    create: modulo.modulo_roles[0].puede_crear,
    edit: modulo.modulo_roles[0].puede_editar,
    delete: modulo.modulo_roles[0].puede_eliminar
  }
}));
```

---

### Caso 2: Mostrar/ocultar botones según permisos

```jsx
// React
function ListaConsorcios({ modulo }) {
  const permisos = modulo.modulo_roles[0];

  return (
    <div>
      <h1>Consorcios</h1>

      {permisos.puede_crear && (
        <button>+ Crear Consorcio</button>
      )}

      {/* Lista de consorcios */}
      {consorcios.map(c => (
        <div key={c.id}>
          {c.nombre}
          {permisos.puede_editar && <button>Editar</button>}
          {permisos.puede_eliminar && <button>Eliminar</button>}
        </div>
      ))}
    </div>
  );
}
```

---

### Caso 3: Proteger rutas en el frontend

```javascript
// Vue Router
const routes = modulosUsuario.data.map(modulo => ({
  path: modulo.ruta,
  component: () => import(`@/views${modulo.ruta}`),
  meta: {
    requiresAuth: true,
    permissions: modulo.modulo_roles[0]
  }
}));

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !to.meta.permissions.puede_ver) {
    next('/403'); // Sin acceso
  } else {
    next();
  }
});
```

---

### Caso 4: Administrar permisos desde un panel

```javascript
// Panel de administración
async function updatePermissions(rolId, moduloId, permisos) {
  await fetch('/modulos/asignar-rol', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      rol_id: rolId,
      modulo_id: moduloId,
      puede_ver: permisos.ver,
      puede_crear: permisos.crear,
      puede_editar: permisos.editar,
      puede_eliminar: permisos.eliminar
    })
  });
}
```

---

## 📁 Archivos Creados/Modificados

### Nuevos archivos

```
src/
├── models/
│   ├── modulo.js               ✨ Modelo Modulo
│   └── rolModulo.js            ✨ Modelo RolModulo (tabla intermedia)
├── controllers/
│   └── modulosController.js    ✨ Controlador de módulos
├── routes/
│   └── modulos.js              ✨ Rutas de módulos
└── seeders/
    └── modulosSeeder.js        ✨ Seeder de módulos y permisos

database/
└── 6.AgregarModulos.sql        ✨ Migración SQL
```

### Archivos modificados

```
src/
├── models/
│   └── index.js                📝 Agregadas relaciones Rol ↔ Modulo
└── index.js                    📝 Agregada ruta /modulos
```

---

## 🧪 Testing

### Probar endpoint de módulos del usuario

```bash
# 1. Login
curl -X POST http://localhost:7000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@ejemplo.com", "password": "123456"}'

# 2. Obtener módulos (copiar token del paso 1)
curl -X GET http://localhost:7000/modulos/mis-modulos \
  -H "Authorization: Bearer {TOKEN}"
```

---

### Probar creación de módulo (admin)

```bash
curl -X POST http://localhost:7000/modulos \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Reportes",
    "clave": "reportes",
    "icono": "chart",
    "ruta": "/reportes",
    "orden": 9
  }'
```

---

### Probar asignación de permisos

```bash
curl -X POST http://localhost:7000/modulos/asignar-rol \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "rol_id": 5,
    "modulo_id": 9,
    "puede_ver": true,
    "puede_crear": false
  }'
```

---

## 🔒 Seguridad

### Validaciones implementadas

✅ **Autenticación requerida** - Todos los endpoints requieren token JWT
✅ **Usuario aprobado** - Solo usuarios aprobados pueden acceder
✅ **Roles específicos** - Algunos endpoints solo para admin_global/tenant_admin
✅ **Filtrado automático** - Cada usuario solo ve sus módulos permitidos
✅ **Índices únicos** - Previene duplicación de permisos (rol_id + modulo_id)

---

## 📊 Diagrama de Relaciones

```
┌─────────────┐           ┌──────────────────┐           ┌──────────────┐
│    Rol      │           │   RolModulo      │           │   Modulo     │
├─────────────┤           │ (Tabla pivote)   │           ├──────────────┤
│ id          │───────────│ rol_id (FK)      │           │ id           │
│ nombre      │     1:N   │ modulo_id (FK)   │───────N:1─│ nombre       │
│ descripcion │           │ puede_ver        │           │ clave        │
└─────────────┘           │ puede_crear      │           │ icono        │
                          │ puede_editar     │           │ ruta         │
                          │ puede_eliminar   │           │ orden        │
                          └──────────────────┘           │ activo       │
                                                          └──────────────┘
```

---

## 🎓 Preguntas Frecuentes

### ¿Cómo agrego un nuevo módulo?

**Opción 1: Via API**
```bash
POST /modulos
```

**Opción 2: Via seeder**
Edita `src/seeders/modulosSeeder.js` y ejecuta:
```bash
node src/seeders/modulosSeeder.js
```

**Opción 3: Via SQL**
```sql
INSERT INTO modulos (nombre, clave, icono, ruta, orden)
VALUES ('Nuevo Módulo', 'nuevo', 'icon', '/nuevo', 10);
```

---

### ¿Cómo cambio los permisos de un rol?

**Via API:**
```bash
POST /modulos/asignar-rol
{
  "rol_id": 5,
  "modulo_id": 1,
  "puede_ver": true,
  "puede_crear": true,
  "puede_editar": false,
  "puede_eliminar": false
}
```

**Via SQL:**
```sql
UPDATE roles_modulos
SET puede_crear = TRUE, puede_editar = TRUE
WHERE rol_id = 5 AND modulo_id = 1;
```

---

### ¿Cómo oculto un módulo temporalmente?

```bash
PUT /modulos/:id
{
  "activo": false
}
```

Esto ocultará el módulo de todos los usuarios.

---

### ¿Qué pasa si creo un usuario con un rol nuevo?

Debes asignar permisos manualmente a ese rol usando:
```bash
POST /modulos/asignar-rol
```

O ejecutar el seeder nuevamente con el nuevo rol agregado.

---

## 🎉 Conclusión

El sistema está **100% funcional** y listo para usar. El frontend solo necesita:

1. Llamar a `GET /modulos/mis-modulos` al iniciar sesión
2. Renderizar el menú dinámicamente basado en los módulos devueltos
3. Mostrar/ocultar botones según los permisos (`puede_crear`, `puede_editar`, etc.)

¡Todo está documentado, testeado y listo para producción! 🚀
