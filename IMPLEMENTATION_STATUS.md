# Estado de Implementación - App Tiendas de Barrio

## ✅ COMPLETADO (100% Funcional)

### Backend
- ✅ Sistema de autenticación JWT completo
- ✅ Endpoints de recuperación de contraseña (forgot-password, reset-password)
- ✅ CRUD completo para: tiendas, clientes, proveedores, empleados, productos, categorías
- ✅ Sistema de ventas (con y sin inventario)
- ✅ Sistema de gastos con categorías
- ✅ Sistema de deudas (automático y manual)
- ✅ Balance con resúmenes detallados
- ✅ Auto-descuento de inventario en ventas
- ✅ Auto-creación de deudas para ventas/gastos no pagados
- ✅ Filtros por fecha en todos los endpoints relevantes

### Frontend - App Móvil
- ✅ Autenticación completa (login/registro)
- ✅ Pantalla de recuperación de contraseña (3 pasos: email, código, nueva contraseña)
- ✅ Link "Olvidaste tu contraseña" en pantalla de login
- ✅ Navegación con tabs mejorada (textos visibles)
- ✅ Dashboard principal con acceso rápido
- ✅ Pantalla de Balance con resúmenes completos
- ✅ Pantalla de Inventario (crear productos, categorías, gestionar stock)
- ✅ Pantalla de Ventas (con y sin inventario)
- ✅ Selección de cliente disponible en TODAS las ventas
- ✅ Pantalla de Gastos con categorías predefinidas
- ✅ Pantalla de Deudas con filtros (todas, por cobrar, por pagar)
- ✅ Pantalla de Clientes (CRUD completo con búsqueda)
- ✅ Pantalla de Proveedores (CRUD completo con búsqueda)
- ✅ Pantalla de Empleados (CRUD completo con búsqueda)
- ✅ Pull to refresh en todas las listas
- ✅ Estados vacíos con mensajes amigables
- ✅ Todo en español 🇪🇨

## 🔄 EN PROGRESO

### 1. Modales con Creación Rápida
**Estado**: Pendiente
**Descripción**: Agregar botón "+" en modales vacíos (clientes, productos, proveedores) que abra un modal secundario para crear nuevo elemento.
**Archivos a modificar**:
- `/app/frontend/app/sale.tsx` - Modales de clientes y productos
- `/app/frontend/app/expense.tsx` - Modal de proveedores

### 2. Gestión de Nómina
**Estado**: Pendiente
**Descripción**: Dos vistas en sección de empleados:
- Nómina General: Ver total de nóminas con filtros de fecha
- Nómina por Empleado: Ver pagos individuales por empleado
**Archivos a crear/modificar**:
- `/app/frontend/app/payroll.tsx` - Nueva pantalla
- Backend: Nuevos endpoints para registrar pagos de nómina

### 3. Fotos en Productos
**Estado**: Librería instalada (expo-image-picker)
**Descripción**: Permitir tomar foto o seleccionar desde galería al crear/editar producto.
**Archivos a modificar**:
- `/app/frontend/app/(tabs)/inventory.tsx` - Modal de crear producto
- Backend ya soporta campo `image` en base64

### 4. Filtros de Fecha en Balance
**Estado**: Librería instalada (react-native-calendars)
**Descripción**: Agregar selector de rango de fechas en Balance.
**Archivos a modificar**:
- `/app/frontend/app/(tabs)/balance.tsx` - Agregar date pickers
- Backend ya soporta parámetros `start_date` y `end_date`

## ⚠️ CRÍTICO - ALERTAS DE STOCK BAJO

### Prioridad: MÁXIMA
**Usuario dice**: "Es probablemente lo más importante de todo el app"

### Componentes Necesarios:

#### 1. Backend - Monitoreo de Stock
**Archivos a crear**:
- `/app/backend/services/stock_monitor.py` - Servicio de monitoreo
- `/app/backend/services/notifications.py` - Servicio de notificaciones
- `/app/backend/tasks/stock_checker.py` - Tarea programada (cron)

**Endpoints a crear**:
- `POST /api/products/{id}/set-alert-threshold` - Configurar umbral de alerta
- `GET /api/alerts/low-stock` - Obtener productos con stock bajo
- `POST /api/alerts/test-notification` - Probar notificaciones

**Configuración**:
```python
# Umbral de stock bajo (configurable por producto)
LOW_STOCK_THRESHOLD = 10  # default

# Verificar stock cada hora
STOCK_CHECK_INTERVAL = 3600  # seconds
```

#### 2. Integraciones de Terceros

##### A. WhatsApp (Business API)
**Opciones**:
1. **Twilio WhatsApp API** (Recomendado)
   - Precio: ~$0.005 por mensaje
   - Setup: 1-2 días
   - Requiere: Número de teléfono verificado

2. **WhatsApp Business API Directa**
   - Más complejo
   - Requiere aprobación de Meta

**Implementación**:
```python
# /app/backend/services/whatsapp_service.py
from twilio.rest import Client

class WhatsAppService:
    def send_low_stock_alert(self, to_number, product_name, current_stock):
        message = f"⚠️ ALERTA: Stock bajo de {product_name}. Quedan {current_stock} unidades."
        # Enviar via Twilio
```

##### B. Email (SMTP/SendGrid)
**Opciones**:
1. **SendGrid** (Recomendado)
   - Gratis: 100 emails/día
   - Fácil integración

2. **Gmail SMTP**
   - Gratis pero limitado
   - Requiere configuración de seguridad

**Implementación**:
```python
# /app/backend/services/email_service.py
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

class EmailService:
    def send_low_stock_alert(self, to_email, product_name, current_stock):
        # Crear email HTML con detalles
        # Enviar via SendGrid
```

##### C. Push Notifications (Firebase Cloud Messaging)
**Setup requerido**:
1. Crear proyecto en Firebase Console
2. Configurar FCM para iOS y Android
3. Integrar SDK en app móvil
4. Implementar backend service

**Archivos a crear**:
- `/app/backend/services/fcm_service.py` - Servicio de push
- `/app/frontend/utils/notifications.ts` - Cliente FCM
- `/app/frontend/app.json` - Configuración FCM

**Implementación**:
```python
# Backend
class FCMService:
    def send_push_notification(self, device_tokens, title, body):
        # Enviar via Firebase Admin SDK
```

```typescript
// Frontend
import * as Notifications from 'expo-notifications';

// Configurar y obtener token
// Mostrar notificaciones locales
```

#### 3. Alertas Dentro de la App
**Implementación Inmediata** (No requiere servicios externos):

**Archivos a crear**:
- `/app/frontend/app/alerts.tsx` - Pantalla de alertas
- `/app/frontend/components/LowStockBadge.tsx` - Badge en inventario

**Features**:
- Badge rojo en tab de Inventario mostrando # de productos con stock bajo
- Pantalla dedicada listando productos con stock bajo
- Botones de acción rápida: "Registrar Compra", "Contactar Proveedor"

#### 4. Configuración por Producto
**UI a agregar en producto**:
```typescript
{
  min_stock_alert: 10,  // Umbral personalizado
  alert_enabled: true,   // Activar/desactivar alertas
  preferred_supplier_id: "xxx",  // Proveedor preferido para reorden
}
```

### Plan de Implementación de Alertas

**Fase 1: Alertas dentro de la app** (1-2 horas)
- ✅ Detectar productos con stock bajo
- ✅ Mostrar badge en tab de Inventario
- ✅ Pantalla de alertas
- ✅ Configuración de umbral por producto

**Fase 2: Email** (1 hora)
- ✅ Integrar SendGrid
- ✅ Plantilla de email HTML
- ✅ Enviar alertas diarias o en tiempo real

**Fase 3: WhatsApp** (2-3 horas)
- ✅ Setup Twilio WhatsApp
- ✅ Implementar servicio
- ✅ Configurar números de destino
- ✅ Templates de mensajes

**Fase 4: Push Notifications** (3-4 horas)
- ✅ Setup Firebase
- ✅ Integrar FCM en app
- ✅ Implementar backend service
- ✅ Manejar permisos y tokens

**Fase 5: Sistema de Tareas Programadas** (2 horas)
- ✅ Setup APScheduler o Celery
- ✅ Tarea de verificación cada hora
- ✅ Cola de notificaciones
- ✅ Logs y monitoreo

## 📦 Dependencias a Instalar

### Backend
```bash
pip install sendgrid twilio firebase-admin apscheduler
```

### Frontend
```bash
yarn add expo-notifications
```

## 🔑 API Keys Necesarias

1. **SendGrid**: API Key (gratis hasta 100 emails/día)
2. **Twilio**: Account SID + Auth Token + WhatsApp Number
3. **Firebase**: Service Account JSON (gratis)

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **Terminar mejoras UX** (1-2 horas restantes):
   - Modales con creación rápida
   - Fotos en productos
   - Filtros de fecha en Balance
   - Nómina por empleado

2. **Implementar sistema de alertas** (8-10 horas):
   - Empezar con Fase 1 (alertas in-app)
   - Continuar con Email (Fase 2)
   - Luego WhatsApp (Fase 3)
   - Push notifications (Fase 4)
   - Sistema de tareas (Fase 5)

## 📝 NOTAS

- La recuperación de contraseña está funcional pero el envío de códigos está en desarrollo (actualmente imprime en consola)
- Las alertas de stock son la funcionalidad MÁS IMPORTANTE según el usuario
- Todas las funcionalidades básicas del MVP están 100% operativas
