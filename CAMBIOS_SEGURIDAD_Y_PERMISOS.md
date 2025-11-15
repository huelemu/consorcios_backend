# Cambios en Sistema de Seguridad y Permisos

## Fecha: 2025-11-15

## Resumen
Se implementó un sistema completo de autenticación y autorización basado en roles para controlar el acceso de los usuarios a los recursos de la plataforma.

---

## 1. Nuevo Rol: `usuario_pendiente`

### Problema Anterior
Los usuarios nuevos se creaban con rol `inquilino` por defecto, lo que les daba acceso completo a recursos que no deberían ver.

### Solución
- Se creó un nuevo rol `usuario_pendiente` que se asigna automáticamente a todos los usuarios nuevos
- Los usuarios con este rol **no pueden acceder** a ningún recurso protegido hasta ser aprobados
- Al aprobar un usuario, el administrador debe asignarle el rol correspondiente

### Archivos Modificados
- `src/models/usuario.js` - Agregado `usuario_pendiente` al ENUM de roles
- `src/controllers/authController.js` - Asigna `usuario_pendiente` por defecto en registro
- `src/controllers/usuariosController.js` - Permite asignar rol al aprobar usuario

### Migración de Base de Datos
```bash
# Ejecutar el script SQL en MySQL:
mysql -u [usuario] -p [nombre_db] < migrations/001_add_usuario_pendiente_rol.sql
```

Este script:
1. Agrega el valor `usuario_pendiente` al ENUM de `rol_global`
2. Cambia el valor por defecto a `usuario_pendiente`
3. Actualiza usuarios existentes no aprobados a `usuario_pendiente`

---

## 2. Middleware de Autenticación Global

### Problema Anterior
Las rutas NO tenían middleware de autenticación aplicado - cualquiera podía acceder sin estar autenticado.

### Solución
Se aplicó middleware de autenticación a **todas las rutas excepto `/auth`**:

```javascript
// Rutas protegidas (requieren autenticación y usuario aprobado)
app.use('/personas', authenticateToken, requireApprovedUser, personasRoutes);
app.use('/usuarios', authenticateToken, requireApprovedUser, usuariosRoutes);
app.use('/consorcios', authenticateToken, requireApprovedUser, consorciosRoutes);
app.use('/unidades', authenticateToken, requireApprovedUser, unidadesRoutes);
app.use('/tickets', authenticateToken, requireApprovedUser, ticketsRoutes);
app.use('/proveedores', authenticateToken, requireApprovedUser, proveedoresRoutes);
app.use('/expensas', authenticateToken, requireApprovedUser, expensasRoutes);
app.use('/dashboard', authenticateToken, requireApprovedUser, dashboardRoutes);
```

### Archivos Modificados
- `src/index.js` - Aplicado middleware global
- `src/middleware/authMiddleware.js` - Agregado `requireApprovedUser`

---

## 3. Sistema de Permisos por Rol

### Roles y Permisos

| Rol | Permisos |
|-----|----------|
| `usuario_pendiente` | ❌ Sin acceso a recursos protegidos |
| `admin_global` | ✅ Acceso completo a todo |
| `tenant_admin` | ✅ Acceso a consorcios de su tenant |
| `admin_consorcio` | ✅ Acceso a consorcios donde es responsable |
| `admin_edificio` | 👁️ Solo lectura - Consorcios/unidades asignadas |
| `propietario` | 👁️ Solo lectura - Solo su unidad funcional |
| `inquilino` | 👁️ Solo lectura - Solo su unidad funcional |

---

## 4. Restricciones de Acceso Implementadas

### A. Consorcios

**Middleware creado:** `consorcioPermissions.js`

#### Funciones:
1. **`canAccessConsorcio`** - Verifica acceso a un consorcio específico
   - Admin global: acceso total
   - Tenant admin: solo consorcios de su tenant
   - Admin consorcio: solo donde es responsable
   - Propietarios/Inquilinos: **solo consorcios asignados en `usuarios_roles`**

2. **`canModifyConsorcio`** - Verifica permisos de modificación
   - Solo admin_global, tenant_admin y admin_consorcio responsable

3. **`canDeleteConsorcio`** - Verifica permisos de eliminación
   - Solo admin_global y tenant_admin

4. **`filterConsorciosByUserAccess`** - Filtra listados según usuario
   - Propietarios/Inquilinos: **solo ven consorcios donde tienen unidades asignadas**

### B. Unidades

**Middleware creado:** `unidadPermissions.js`

#### Funciones:
1. **`canAccessUnidad`** - Verifica acceso a una unidad específica
   - Propietarios/Inquilinos: **solo unidades asignadas en `usuarios_roles`**

2. **`filterUnidadesByUserAccess`** - Filtra listados según usuario
   - Propietarios/Inquilinos: **solo ven sus unidades asignadas**

---

## 5. Asignación de Usuarios a Unidades/Consorcios

### Sistema de Asignación

Los propietarios e inquilinos se vinculan a unidades mediante la tabla `usuarios_roles`:

```sql
CREATE TABLE usuarios_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  rol_id INT NOT NULL,
  consorcio_id INT NULL,        -- Asignación a consorcio completo
  unidad_id INT NULL,            -- Asignación a unidad específica
  activo BOOLEAN DEFAULT true
);
```

### Endpoints para Gestión de Roles

```bash
# Obtener roles de un usuario
GET /usuarios/:id/roles

# Asignar rol a usuario
POST /usuarios/roles/asignar
Body: {
  "usuario_id": 123,
  "rol_id": 5,
  "unidad_id": 456,      # Asignar a unidad específica
  "activo": true
}

# Eliminar asignación de rol
DELETE /usuarios/roles/:id
```

---

## 6. Flujo de Aprobación de Usuarios

### Paso 1: Registro
```javascript
POST /auth/register
Body: {
  "nombre": "Pepe",
  "apellido": "Parada",
  "email": "pepe@example.com",
  "password": "123456"
}

// Usuario creado con:
{
  rol_global: 'usuario_pendiente',
  aprobado: false,
  activo: false
}
```

### Paso 2: Usuario Intenta Acceder
```javascript
GET /consorcios

// Respuesta: 403 Forbidden
{
  "success": false,
  "message": "Tu cuenta está pendiente de aprobación...",
  "code": "USER_PENDING_APPROVAL"
}
```

### Paso 3: Administrador Aprueba
```javascript
PATCH /usuarios/:id/aprobar
Body: {
  "rol_global": "propietario"  // Asignar rol correspondiente
}

// Usuario actualizado:
{
  rol_global: 'propietario',
  aprobado: true,
  activo: true
}
```

### Paso 4: Administrador Asigna Unidad
```javascript
POST /usuarios/roles/asignar
Body: {
  "usuario_id": 123,
  "rol_id": 6,           // ID del rol "Propietario"
  "unidad_id": 456       // ID de la unidad asignada
}
```

### Paso 5: Usuario Ahora Ve Solo Su Unidad
```javascript
GET /unidades
// Respuesta: Solo la unidad 456

GET /consorcios
// Respuesta: Solo el consorcio al que pertenece la unidad 456
```

---

## 7. Endpoints Afectados

### Rutas de Consorcios
```javascript
GET    /consorcios                    → filterConsorciosByUserAccess
GET    /consorcios/:id                → canAccessConsorcio
PUT    /consorcios/:id                → canModifyConsorcio
DELETE /consorcios/:id                → canDeleteConsorcio
PATCH  /consorcios/:id/activar        → canModifyConsorcio
PATCH  /consorcios/:id/desactivar     → canModifyConsorcio
GET    /consorcios/stats/general      → filterConsorciosByUserAccess
```

### Rutas de Unidades
```javascript
GET    /unidades                      → filterUnidadesByUserAccess
GET    /unidades/:id                  → canAccessUnidad
PUT    /unidades/:id                  → canAccessUnidad
DELETE /unidades/:id                  → canAccessUnidad
GET    /unidades/stats                → filterUnidadesByUserAccess
```

### Rutas de Usuarios
```javascript
# Todas las rutas requieren autenticación + usuario aprobado
GET    /usuarios                      → authenticateToken, requireApprovedUser
GET    /usuarios/:id/roles            → Ver asignaciones
POST   /usuarios/roles/asignar        → Asignar unidades/consorcios
DELETE /usuarios/roles/:id            → Eliminar asignación
PATCH  /usuarios/:id/aprobar          → Aprobar usuario + asignar rol
```

---

## 8. Controladores Modificados

### `consorciosController.js`
```javascript
// Ahora respeta el filtro req.consorcioFilter
const whereClause = {};

// Aplicar filtro de permisos de usuario
if (req.consorcioFilter) {
  Object.assign(whereClause, req.consorcioFilter);
}
```

### `unidadesController.js`
```javascript
// Ahora respeta el filtro req.unidadFilter
const where = {};

// Aplicar filtro de permisos de usuario
if (req.unidadFilter) {
  Object.assign(where, req.unidadFilter);
}
```

---

## 9. Testing

### Pruebas Recomendadas

#### Test 1: Usuario Pendiente Sin Acceso
```bash
# 1. Registrar usuario
POST /auth/register

# 2. Intentar acceder a recursos
GET /consorcios
# Esperado: 403 con mensaje "pendiente de aprobación"
```

#### Test 2: Propietario Solo Ve Su Unidad
```bash
# 1. Aprobar usuario como propietario
PATCH /usuarios/:id/aprobar
Body: { "rol_global": "propietario" }

# 2. Asignar unidad
POST /usuarios/roles/asignar
Body: { "usuario_id": X, "rol_id": Y, "unidad_id": 456 }

# 3. Listar unidades
GET /unidades
# Esperado: Solo la unidad 456
```

#### Test 3: Admin Ve Todo
```bash
# Login como admin_global
POST /auth/login

# Listar consorcios
GET /consorcios
# Esperado: Todos los consorcios
```

---

## 10. Comandos de Verificación

### Ver usuarios pendientes
```bash
GET /usuarios/pendientes
```

### Ver roles asignados a un usuario
```bash
GET /usuarios/:id/roles
```

### Ver estado de un usuario
```bash
GET /usuarios/:id

# Verificar campos:
{
  "rol_global": "...",
  "aprobado": true/false,
  "activo": true/false
}
```

---

## 11. Archivos Creados/Modificados

### Nuevos Archivos
- `src/middleware/unidadPermissions.js` - Permisos de unidades
- `migrations/001_add_usuario_pendiente_rol.sql` - Script de migración
- `CAMBIOS_SEGURIDAD_Y_PERMISOS.md` - Esta documentación

### Archivos Modificados
1. **Modelos**
   - `src/models/usuario.js` - Nuevo rol en ENUM

2. **Controladores**
   - `src/controllers/authController.js` - Asigna rol pendiente
   - `src/controllers/usuariosController.js` - Aprobación con asignación de rol
   - `src/controllers/consorciosController.js` - Usa filtro de permisos
   - `src/controllers/unidadesController.js` - Usa filtro de permisos

3. **Middleware**
   - `src/middleware/authMiddleware.js` - Agregado requireApprovedUser
   - `src/middleware/consorcioPermissions.js` - Completados TODOs

4. **Rutas**
   - `src/routes/consorcios.js` - Aplicados middlewares
   - `src/routes/unidades.js` - Aplicados middlewares

5. **Principal**
   - `src/index.js` - Autenticación global aplicada

---

## 12. Próximos Pasos

### Tareas Pendientes
1. ✅ Ejecutar migración de base de datos
2. ✅ Probar flujo completo de registro → aprobación → asignación
3. ⚠️ Implementar filtros similares para:
   - Dashboard (mostrar solo estadísticas de lo que puede ver)
   - Tickets (solo tickets de sus unidades/consorcios)
   - Proveedores (según asignaciones)

### Mejoras Futuras
- Sistema de notificaciones cuando un usuario es aprobado
- Logs de auditoría de cambios de permisos
- Panel de administración para gestión de roles masiva
- Validaciones adicionales en frontend para ocultar opciones no permitidas

---

## ⚠️ IMPORTANTE - ACCIÓN REQUERIDA

### Ejecutar Migración
```bash
# 1. Hacer backup de la base de datos
mysqldump -u [usuario] -p [nombre_db] > backup_antes_migracion.sql

# 2. Ejecutar migración
mysql -u [usuario] -p [nombre_db] < migrations/001_add_usuario_pendiente_rol.sql

# 3. Verificar
mysql -u [usuario] -p [nombre_db] -e "SELECT rol_global, COUNT(*) FROM usuarios GROUP BY rol_global;"
```

### Actualizar Usuarios Existentes
Si tienes usuarios que ya están registrados, deberás:
1. Revisar cada usuario en `/usuarios/pendientes`
2. Aprobarlos asignando el rol correcto
3. Asignarles unidades/consorcios según corresponda

---

## Soporte
Para dudas o problemas con la implementación, revisar:
- Logs del servidor: `console.log` en controladores y middleware
- Network tab en navegador para ver respuestas 403/401
- Tabla `usuarios_roles` para verificar asignaciones

---

**Fecha de implementación:** 2025-11-15
**Versión:** 1.0
**Estado:** ✅ Implementado - Requiere ejecutar migración
