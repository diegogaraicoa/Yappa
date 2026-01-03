#!/usr/bin/env python3
import sys
sys.path.append('/app/backend')
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def seed_tutorials():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    await db.tutorials.delete_many({})
    
    tutorials = [
        # CRÍTICO
        {
            "title": "🎯 PASO 1: Configura Tu Tienda (OBLIGATORIO)",
            "description": "Antes de empezar, DEBES configurar proveedores y productos. Este es el paso más importante.",
            "category": "critical",
            "content": """# 🎯 PASO 1: Configura Tu Tienda

## ⚠️ ¿Por Qué Es Obligatorio?

Sin proveedores y productos configurados, no podrás hacer seguimiento de inventario, calcular ganancias, ni recibir alertas.

---

## Orden Correcto

### Paso 1: Agregar Proveedores PRIMERO

Cada producto necesita un proveedor para saber de dónde viene y a quién contactar para reordenar.

**Pasos:**
1. Menú → Proveedores
2. Botón "+"
3. Completa: Nombre, Contacto, Notas
4. Guarda

Empieza con tus 3-5 proveedores principales.

### Paso 2: Agregar Productos

Ahora agrega tus productos vinculados a proveedores.

**Pasos:**
1. Menú → Inventario
2. Botón "+"
3. Completa:
   - Nombre
   - Proveedor (del paso 1)
   - Precio de venta y de compra
   - Stock inicial
   - Stock mínimo (para alertas)
4. Guarda

### Paso 3: Activa las Alertas

Configuración → Alertas → Activa todas:
- Alertas de stock bajo
- Resumen de ventas
- Reportes semanales
- Insights de IA

Ver tutorial "Activa las Alertas" para más detalles.

---

## Siguiente Paso

Una vez completado, continúa con "Cómo Registrar una Venta".""",
            "duration_minutes": 5,
            "order": 0
        },
        {
            "title": "⚡ Activa las Alertas (OBLIGATORIO)",
            "description": "Configura las notificaciones para recibir avisos importantes sobre tu negocio.",
            "category": "critical",
            "content": """# ⚡ Activa las Alertas

## ⚠️ ¿Por Qué Es Obligatorio?

Sin alertas activadas no sabrás cuando productos estén por acabarse, no recibirás resúmenes de ventas ni reportes de IA.

---

## Tipos de Alertas

**1. Alertas de Stock Bajo 📦**
Te avisa cuando un producto llega al stock mínimo.
Llega todos los días a las 8:00 AM.

**2. Resumen Diario de Ventas 💰**
Resumen de todas las ventas del día.
Llega todos los días a las 8:00 PM.

**3. Resumen Semanal 📊**
Análisis completo de la semana con comparaciones.
Llega todos los lunes a las 9:00 AM.

**4. Insights de IA 🤖**
Análisis inteligente con recomendaciones personalizadas.
Semanal: Lunes 9:30 AM / Mensual: Día 1 del mes 10:00 AM.

---

## Cómo Activar

### Paso 1: Ve a Configuración
Menú → Perfil → Configuración

### Paso 2: Activa TODAS las Opciones

Activa estos switches:
- Alertas habilitadas (switch principal)
- Alertas de stock bajo
- Resumen de ventas diario
- Resumen semanal
- Insights de IA

### Paso 3: Verifica tu WhatsApp

Verifica que tengas tu número de WhatsApp registrado en formato: +593XXXXXXXXX (con código de país).

### Paso 4: Guarda Cambios

Presiona "Guardar" y deberías ver un mensaje de confirmación.

---

## Siguiente Paso

Una vez configuradas las alertas, aprende "Cómo Registrar una Venta".""",
            "duration_minutes": 5,
            "order": 1
        },
        
        # BÁSICO
        {
            "title": "Bienvenido a Yappa",
            "description": "Aprende los conceptos básicos de la aplicación y cómo comenzar",
            "category": "basic",
            "content": """# Bienvenido a Yappa 🎉

## ¿Qué es Yappa?

Tu asistente digital para gestionar tu negocio de barrio.

**Funciones principales:**
- Registrar ventas y gastos
- Controlar inventario
- Gestionar clientes y proveedores
- Seguir deudas pendientes
- Registrar ventas por WhatsApp con IA

---

## Primeros Pasos

**1. Explora el menú principal**
- Ventas: Registra ventas diarias
- Gastos: Control de gastos
- Inventario: Administra productos
- Clientes: Gestiona tu cartera

**2. Configura tu WhatsApp**
- Ingresa tu número en el perfil
- Activa las notificaciones
- Listo para usar el asistente AI

**3. Empieza a registrar**
- Registra tu primera venta
- Agrega productos a tu inventario
- Registra un cliente

---

## Consejos Rápidos

- Registra ventas diariamente
- Mantén actualizado tu inventario
- Revisa tus reportes semanalmente
- Usa el asistente de WhatsApp para ahorrar tiempo

¡Estás listo para comenzar! 🚀""",
            "duration_minutes": 3,
            "order": 2
        },
        {
            "title": "Cómo Registrar una Venta",
            "description": "Paso a paso para registrar ventas en tu tienda",
            "category": "basic",
            "content": """# Cómo Registrar una Venta 💰

## Desde la App

### Paso 1: Ir a Ventas
Menú principal → Ventas

### Paso 2: Nueva Venta
Botón "+" → Selecciona productos → Ingresa cantidad

### Paso 3: Detalles
- Cliente: Selecciona o crea uno nuevo
- Método de pago: Efectivo, Transferencia, Tarjeta, DeUna
- ¿Ya pagó?: Sí/No (si no, se crea una deuda)

### Paso 4: Confirmar
Revisa el resumen → Presiona "Guardar" → ¡Listo!

---

## Consejos

- Registra ventas al final del día si es posible
- Revisa que el inventario se actualice automáticamente
- Para ventas rápidas, usa el asistente de WhatsApp (ver tutorial "Tu Asistente de WhatsApp")""",
            "duration_minutes": 3,
            "order": 3
        },
        {
            "title": "Gestión de Inventario",
            "description": "Aprende a controlar tu stock y productos",
            "category": "basic",
            "content": """# Gestión de Inventario 📦

## ¿Por qué es importante?

Un buen control de inventario te ayuda a:
- Saber qué productos tienes
- Evitar quedarte sin stock
- Identificar productos más vendidos
- Tomar mejores decisiones de compra

---

## Agregar Productos

1. Inventario → Botón "+"
2. Completa:
   - Nombre del producto
   - Precio de venta y de compra
   - Cantidad inicial
   - Stock mínimo (para alertas)
3. Guarda

---

## Actualizar Stock

El stock se actualiza automáticamente cuando:
- Registras una venta
- Registras una compra a proveedor

También puedes ajustar manualmente:
- Toca el producto
- Edita la cantidad
- Guarda cambios

---

## Alertas de Stock Bajo

La app te avisará cuando un producto esté por debajo del stock mínimo:
- Notificación en la app
- Mensaje por WhatsApp
- En el reporte semanal

---

## Mejores Prácticas

- Define stock mínimo realista
- Revisa alertas semanalmente
- Haz inventario físico mensual
- Elimina productos que no vendes""",
            "duration_minutes": 4,
            "order": 4
        },
        
        # WHATSAPP
        {
            "title": "Tu Asistente de WhatsApp",
            "description": "Descubre cómo usar el AI para registrar ventas y gastos",
            "category": "whatsapp",
            "content": """# Tu Asistente de WhatsApp 🤖

## ¿Qué es?

Un asistente con Inteligencia Artificial que entiende mensajes en español y te ayuda a registrar ventas y gastos desde WhatsApp.

---

## Cómo Empezar

### Paso 1: Configura tu Número
Ve a **Configuración** → Ingresa tu número de WhatsApp con código de país (ej: +593...) → Guarda

### Paso 2: Envía un Mensaje
Escribe al número de WhatsApp de YAPPA: **+1 415 523 8886**

**IMPORTANTE:** Primero envía este código para activar: `join cake-husband`

Recibirás confirmación de activación.

### Paso 3: ¡Empieza a Registrar!
Ahora escribe simplemente: `venta` o `gasto`

El asistente de IA te guiará paso a paso para completar el registro

---

## Ejemplo: Registrar una Venta

```
Tú: venta

AI: ¿Qué productos se vendieron?

Tú: 3 coca colas a Juan por $9 total

AI: ¿Cómo pagó?

Tú: efectivo y ya pagó

AI: Resumen:
     • 3 Coca Cola a $3 c/u = $9
     • Cliente: Juan
     • Pago: Efectivo (Pagado)
     Confirma con SÍ

Tú: sí

AI: ✅ ¡Venta registrada exitosamente!
```

---

## Comandos Útiles

- `venta` - Registrar una venta
- `gasto` - Registrar un gasto
- `AYUDA` - Ver instrucciones
- `CANCELAR` - Cancelar conversación actual

---

## Consejos

- Habla naturalmente, el AI te entiende
- Puedes escribir todo en un mensaje
- Revisa el resumen antes de confirmar
- Úsalo cuando estés atendiendo clientes

---

## Nota

Las notas de voz están temporalmente deshabilitadas. Por ahora, solo mensajes de texto.""",
            "duration_minutes": 5,
            "order": 10
        },
        
        # REPORTES
        {
            "title": "Entendiendo tus Reportes",
            "description": "Aprende a leer e interpretar los reportes de IA",
            "category": "reports",
            "content": """# Entendiendo tus Reportes 📊

## ¿Qué son los Reportes de IA?

Usan Inteligencia Artificial para analizar tu negocio y darte insights, recomendaciones, alertas y tendencias.

---

## Tipos de Reportes

**1. Reporte Diario**
Ventas del día, productos más vendidos, comparación con días anteriores.

**2. Reporte Semanal**
Resumen de la semana, top productos, clientes frecuentes, alertas de stock.

**3. Reporte Mensual**
Análisis profundo del mes, rentabilidad, tendencias, recomendaciones estratégicas.

---

## Cómo Generar un Reporte

**Desde la App:**
1. "Mis Datos"
2. "Generar Reporte"
3. Espera 10-30 segundos
4. Lee el análisis
5. Opcional: Envíalo a WhatsApp

**Admin Console (Web):**
Dashboard → Reportes → Historial completo

---

## Interpretando el Reporte

**Ventas:**
- Total vendido: Ingresos brutos
- Promedio diario: Ventas típicas
- Tendencia: Subiendo/Bajando

**Productos:**
- Top 5: Más vendidos
- Sin movimiento: No vendidos
- Bajo stock: Necesitan reposición

**Clientes:**
- Frecuentes: Tus mejores clientes
- Deudas: Quién te debe

---

## Acciones Recomendadas

**"Las ventas están aumentando"**
→ Considera aumentar inventario

**"Producto X no se vende"**
→ Evalúa descontinuarlo o hacer promoción

**"Stock bajo en Y"**
→ Realiza pedido a proveedor

**"Cliente Z tiene deuda alta"**
→ Haz seguimiento""",
            "duration_minutes": 6,
            "order": 11
        },
        
        # INTERMEDIO
        {
            "title": "Gestión de Deudas",
            "description": "Cómo llevar control de cuentas por cobrar y por pagar",
            "category": "intermediate",
            "content": """# Gestión de Deudas 💰

## Tipos de Deudas

**1. Cuentas por Cobrar (Te deben)**
Ventas no pagadas completamente

**2. Cuentas por Pagar (Debes)**
Gastos o compras pendientes de pago

---

## Registrar una Venta a Crédito

Al registrar una venta:
1. Selecciona el cliente
2. En "¿Ya pagó?" selecciona **NO**
3. La app creará automáticamente la deuda

---

## Ver Deudas

**Clientes que te deben:**
Menú → Deudas → Clientes

**Proveedores a quienes debes:**
Menú → Deudas → Proveedores

---

## Registrar un Pago

1. Ve a la deuda específica
2. "Registrar Pago"
3. Ingresa monto pagado
4. Guarda

La deuda se actualizará automáticamente.

---

## Mejores Prácticas

- Establece límites de crédito
- Define plazos claros (7, 15, 30 días)
- Haz seguimiento semanal
- Usa recordatorios automáticos por WhatsApp

---

## Consejos

- Registra pagos parciales
- Documenta todo
- Sé consistente con seguimiento
- Ofrece incentivos por pago puntual""",
            "duration_minutes": 5,
            "order": 20
        },
        
        # AVANZADO
        {
            "title": "Análisis Avanzado en Admin Console",
            "description": "Domina el dashboard web para decisiones estratégicas",
            "category": "advanced",
            "content": """# Análisis Avanzado en Admin Console 📊

## ¿Qué es el Admin Console?

Interfaz web profesional para analytics profundos, comparaciones temporales, exportación de datos y gestión masiva.

**URL:** https://bug-hunter-126.preview.emergentagent.com/admin

---

## Secciones Principales

**1. Dashboard Ejecutivo**
KPIs principales, ventas totales, margen de ganancia, productos en stock, clientes activos. Comparaciones semana vs semana, mes vs mes.

**2. Análisis de Productos**
Rentabilidad por producto, frecuencia de venta, margen de ganancia, rotación de inventario.

**3. Análisis de Clientes**
Clientes más frecuentes, ticket promedio, productos preferidos, historial de compras.

**4. Proveedores**
Compras por proveedor, deudas pendientes, productos suministrados, confiabilidad.

**5. Centro de Carga Masiva**
Importar CSV: productos completos, clientes en bloque, proveedores, actualización de inventario.

**6. Historial de Reportes AI**
Todos los reportes generados, búsqueda por fecha, exportar a PDF, comparar reportes.

---

## Tips Avanzados

**Comparación Semana/Semana**
Detecta patrones: días con más ventas, productos de fin de semana, estacionalidad.

**Análisis de Rentabilidad**
Rentabilidad = (Precio Venta - Precio Compra) / Precio Venta × 100

Identifica productos con mejor margen y oportunidades de ajuste de precio.

**Planificación de Compras**
Comprar = (Velocidad de venta × Lead Time del proveedor) - Stock Actual

---

## Automatización

Programar reportes automáticos, alertas personalizadas, backups de datos, recordatorios de inventario.

---

## Próximos Pasos

1. Exporta tus datos semanalmente
2. Analiza tendencias mensuales
3. Comparte insights con tu equipo
4. Toma decisiones basadas en datos""",
            "duration_minutes": 10,
            "order": 30
        }
    ]
    
    for tutorial in tutorials:
        tutorial["created_at"] = datetime.utcnow()
    
    result = await db.tutorials.insert_many(tutorials)
    
    print(f"✅ {len(result.inserted_ids)} tutoriales actualizados!")
    
    categories = {}
    for tutorial in tutorials:
        cat = tutorial['category']
        if cat not in categories:
            categories[cat] = 0
        categories[cat] += 1
    
    print("\n📚 Tutoriales por categoría:")
    for cat, count in categories.items():
        print(f"   {cat}: {count}")

if __name__ == "__main__":
    asyncio.run(seed_tutorials())
