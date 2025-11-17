#!/usr/bin/env python3
"""
Seed tutorial data for the training module
"""
import sys
sys.path.append('/app/backend')

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def seed_tutorials():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    # Clear existing tutorials
    await db.tutorials.delete_many({})
    
    tutorials = [
        # CRÍTICO - OBLIGATORIOS
        {
            "title": "🎯 PASO 1: Configura Tu Tienda (OBLIGATORIO)",
            "description": "Antes de empezar, DEBES configurar proveedores y productos. Este es el paso más importante para el éxito de tu negocio.",
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

Configura → Alertas → Activa todas:
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
            "description": "Configura las notificaciones para recibir avisos importantes sobre tu negocio. Sin esto, perderás información crítica.",
            "category": "critical",
            "content": """# ⚡ Activa las Alertas

## ⚠️ ¿Por Qué Es OBLIGATORIO?

**Sin alertas activadas:**
- ❌ NO sabrás cuando productos estén por acabarse
- ❌ NO recibirás resúmenes de ventas
- ❌ NO aprovecharás los reportes de IA
- ❌ NO recibirás recordatorios de deudas
- ❌ Perderás ventas por falta de stock

## 📱 Tipos de Alertas

### 1. Alertas de Stock Bajo 📦
**¿Qué es?**
Te avisa cuando un producto llega al stock mínimo.

**Ejemplo:**
"⚠️ Coca Cola tiene solo 5 unidades. Stock mínimo: 10"

**¿Cuándo llega?**
- Todos los días a las 8:00 AM
- Solo si hay productos bajo stock mínimo

### 2. Resumen Diario de Ventas 💰
**¿Qué es?**
Un resumen de todas las ventas del día.

**Incluye:**
- Total vendido
- Productos más vendidos
- Clientes frecuentes
- Métodos de pago usados

**¿Cuándo llega?**
- Todos los días a las 8:00 PM

### 3. Resumen Semanal 📊
**¿Qué es?**
Análisis completo de la semana.

**Incluye:**
- Ventas vs semana anterior
- Mejor y peor día
- Top 5 productos
- Recomendaciones

**¿Cuándo llega?**
- Todos los lunes a las 9:00 AM

### 4. Insights de IA 🤖
**¿Qué es?**
Análisis inteligente con recomendaciones personalizadas.

**Incluye:**
- Tendencias detectadas
- Productos sin movimiento
- Oportunidades de mejora
- Alertas de clientes con deudas altas

**¿Cuándo llega?**
- Semanal: Lunes 9:30 AM
- Mensual: Día 1 del mes 10:00 AM

## 📋 Cómo Activar las Alertas

### Paso 1: Ve a Configuración
1. Abre el menú principal
2. Toca tu nombre o ícono de perfil
3. Selecciona "Configuración" o "Settings"

### Paso 2: Encuentra la Sección de Alertas
Busca:
- "Alertas"
- "Notificaciones"
- "Avisos"

### Paso 3: Activa TODAS las Opciones

**Activa estos switches:**
- ✅ Alertas habilitadas (switch principal)
- ✅ Alertas de stock bajo
- ✅ Resumen de ventas diario
- ✅ Resumen semanal
- ✅ Insights de IA

### Paso 4: Verifica tu WhatsApp

**MUY IMPORTANTE:**
1. En la misma pantalla, verifica que tengas tu número de WhatsApp registrado
2. Debe estar en formato: +593XXXXXXXXX (con código de país)
3. Si no lo tienes, agrégalo AHORA

### Paso 5: Guarda Cambios
- Presiona "Guardar" o "Save"
- Deberías ver un mensaje de confirmación

## ✅ Checklist de Activación

Marca cada punto:

### Configuración Básica
- [ ] Entré a Configuración
- [ ] Encontré la sección de Alertas
- [ ] Activé el switch principal de alertas

### Tipos de Alertas
- [ ] Activé alertas de stock bajo
- [ ] Activé resumen diario de ventas
- [ ] Activé resumen semanal
- [ ] Activé insights de IA

### Verificación
- [ ] Mi número de WhatsApp está registrado
- [ ] El número tiene código de país (+593)
- [ ] Guardé los cambios
- [ ] Vi mensaje de confirmación

## 🧪 Prueba que Funciona

**Para probar las alertas:**

1. **Stock Bajo:**
   - Edita un producto
   - Reduce el stock por debajo del mínimo
   - Espera hasta las 8:00 AM del día siguiente
   - Deberías recibir la alerta

2. **Resumen Diario:**
   - Registra al menos 1 venta hoy
   - Espera hasta las 8:00 PM
   - Recibirás el resumen

3. **WhatsApp AI:**
   - Envía "AYUDA" al número de WhatsApp del asistente
   - Si recibes respuesta, todo está bien configurado

## 📬 ¿Dónde Llegarán las Alertas?

**Todas las alertas llegan a:**
- 📱 Tu WhatsApp registrado
- 🔔 Notificaciones push en el app (si activaste)

**NO llegarán a:**
- ❌ Email (por ahora)
- ❌ SMS

## 🚨 Problemas Comunes

### "No me llegan alertas"

**Solución:**
1. Verifica que el switch principal esté activado
2. Confirma tu número de WhatsApp
3. Revisa que tenga código de país
4. Espera a la hora programada
5. Verifica que haya datos para alertar (ventas, productos bajos)

### "Solo me llegan algunas"

**Solución:**
1. Revisa que TODAS las opciones estén activadas
2. Guarda cambios nuevamente
3. Reinicia la app

### "El número está mal"

**Solución:**
1. Edita tu perfil
2. Actualiza el número con formato: +593XXXXXXXXX
3. Guarda
4. Vuelve a configurar alertas

## 🎯 Resultado Esperado

Después de activar las alertas:
- ✅ Recibirás notificaciones diarias por WhatsApp
- ✅ Sabrás cuando reabastecer productos
- ✅ Tendrás resúmenes automáticos
- ✅ Aprovecharás la IA para mejorar
- ✅ No perderás información importante

## 💡 Tips Importantes

1. **No desactives las alertas** - Son tu asistente 24/7
2. **Lee los reportes** - Tienen información valiosa
3. **Actúa en las alertas** - Si hay stock bajo, reordena
4. **Usa el asistente de WhatsApp** - Ahorra tiempo registrando ventas

## 🎓 Siguiente Paso

Una vez configuradas las alertas:
1. Regresa al menú de Capacitación
2. Aprende "Cómo Registrar una Venta"
3. Explora "Tu Asistente de WhatsApp"

**¡Las alertas son tu mejor herramienta!** 🚀""",
            "duration_minutes": 8,
            "order": 1
        },
        
        # BÁSICO
        {
            "title": "Bienvenido a BarrioShop",
            "description": "Aprende los conceptos básicos de la aplicación y cómo comenzar",
            "category": "basic",
            "content": """# Bienvenido a BarrioShop 🎉

## ¿Qué es BarrioShop?

BarrioShop es tu asistente digital para gestionar tu negocio de barrio. Te ayuda a:

- 📊 Registrar ventas y gastos
- 📦 Controlar tu inventario
- 👥 Gestionar clientes y proveedores
- 💰 Seguir deudas pendientes
- 📱 **NUEVO:** Registrar ventas por WhatsApp con IA

## Primeros Pasos

1. **Explora el menú principal**
   - Ventas: Registra tus ventas diarias
   - Gastos: Lleva control de tus gastos
   - Inventario: Administra tus productos
   - Clientes: Gestiona tu cartera de clientes

2. **Configura tu WhatsApp**
   - Ingresa tu número en el perfil
   - Activa las notificaciones
   - ¡Listo para usar el asistente AI!

3. **Empieza a registrar**
   - Prueba registrando tu primera venta
   - Agrega productos a tu inventario
   - Registra un cliente

## Consejos Rápidos

✅ Registra ventas diariamente
✅ Mantén actualizado tu inventario
✅ Revisa tus reportes semanalmente
✅ Usa el asistente de WhatsApp para ahorrar tiempo

¡Estás listo para comenzar! 🚀""",
            "duration_minutes": 5,
            "order": 1
        },
        {
            "title": "Cómo Registrar una Venta",
            "description": "Paso a paso para registrar ventas en tu tienda",
            "category": "basic",
            "content": """# Cómo Registrar una Venta 💰

## Método 1: Desde la App

### Paso 1: Ir a Ventas
- Abre la app
- Toca el ícono de "Ventas" en el menú principal

### Paso 2: Nueva Venta
- Presiona el botón "+" o "Nueva Venta"
- Selecciona los productos
- Ingresa la cantidad

### Paso 3: Detalles de la Venta
- **Cliente:** Selecciona o crea uno nuevo
- **Método de pago:** Efectivo, Transferencia, Tarjeta, DeUna
- **¿Ya pagó?:** Sí/No (si no, se crea una deuda)

### Paso 4: Confirmar
- Revisa el resumen
- Presiona "Guardar"
- ¡Listo! ✅

## Método 2: Por WhatsApp (¡NUEVO!)

Ahora puedes registrar ventas simplemente enviando un mensaje:

```
Tú: venta
AI: ¿Qué productos se vendieron?
Tú: 2 coca colas a María por $6
AI: ¿Cómo pagó?
Tú: efectivo y ya pagó
AI: [Resumen] ¿Confirma con SÍ?
Tú: sí
AI: ✅ ¡Venta registrada!
```

## Consejos

- Registra ventas al final del día si es posible
- Usa el método de WhatsApp cuando estés ocupado
- Revisa el inventario se actualice automáticamente

## Video Tutorial

[Próximamente - Video demostrativo]""",
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

## Agregar Productos

1. Ve a "Inventario"
2. Presiona "+" para nuevo producto
3. Completa la información:
   - Nombre del producto
   - Precio de venta
   - Precio de compra
   - Cantidad inicial
   - Stock mínimo (para alertas)
4. Guarda

## Actualizar Stock

El stock se actualiza automáticamente cuando:
- Registras una venta ✅
- Registras una compra a proveedor ✅

También puedes ajustar manualmente:
- Toca el producto
- Edita la cantidad
- Guarda cambios

## Alertas de Stock Bajo

La app te avisará cuando un producto esté por debajo del stock mínimo:
- Notificación en la app 🔔
- Mensaje por WhatsApp 📱
- En el reporte semanal 📊

## Mejores Prácticas

✅ Define stock mínimo realista
✅ Revisa alertas semanalmente
✅ Haz inventario físico mensual
✅ Elimina productos que no vendes

## Próximo Paso

Aprende a gestionar proveedores para facilitar las compras.""",
            "duration_minutes": 4,
            "order": 3
        },
        
        # WHATSAPP AI
        {
            "title": "Tu Asistente de WhatsApp",
            "description": "Descubre cómo usar el AI para registrar ventas y gastos",
            "category": "whatsapp",
            "content": """# Tu Asistente de WhatsApp 🤖

## ¿Qué es?

Un asistente con Inteligencia Artificial que entiende mensajes en español y te ayuda a registrar:
- Ventas 💰
- Gastos 💸

¡Todo desde WhatsApp!

## Cómo Empezar

### 1. Configura tu Número
- Ve a tu perfil en la app
- Ingresa tu número de WhatsApp
- Guarda cambios

### 2. Únete al Servicio
- Envía un mensaje a: **+1 415 523 8886**
- Escribe: `join [código]`
- Recibirás confirmación

### 3. ¡Empieza a Usar!
Envía simplemente: `venta` o `gasto`

## Ejemplo: Registrar una Venta

```
📱 Tú: venta

🤖 AI: ¡Perfecto! ¿Qué productos se vendieron?

📱 Tú: 3 coca colas a Juan por $9 total

🤖 AI: Entendido. ¿Cómo pagó?

📱 Tú: efectivo y ya pagó

🤖 AI: Resumen:
     • 3 Coca Cola a $3 c/u = $9
     • Cliente: Juan
     • Pago: Efectivo (Pagado)
     Confirma con SÍ

📱 Tú: sí

🤖 AI: ✅ ¡Venta registrada exitosamente!
     Total: $9.00
     Cliente: Juan
     ✓ Pagado
```

## Comandos Útiles

- `venta` - Registrar una venta
- `gasto` - Registrar un gasto
- `AYUDA` - Ver instrucciones
- `CANCELAR` - Cancelar conversación actual

## Consejos

✅ Habla naturalmente, el AI te entiende
✅ Puedes escribir todo en un mensaje
✅ Revisa el resumen antes de confirmar
✅ Usa cuando estés atendiendo clientes

## Limitaciones Actuales

❌ Notas de voz temporalmente deshabilitadas
✅ Solo mensajes de texto por ahora

## ¿Necesitas Ayuda?

Envía `AYUDA` al WhatsApp del asistente""",
            "duration_minutes": 6,
            "order": 10
        },
        
        # REPORTES
        {
            "title": "Entendiendo tus Reportes",
            "description": "Aprende a leer e interpretar los reportes de IA",
            "category": "reports",
            "content": """# Entendiendo tus Reportes 📊

## ¿Qué son los Reportes de IA?

Los reportes usan Inteligencia Artificial para analizar tu negocio y darte:
- Insights sobre ventas
- Recomendaciones
- Alertas importantes
- Tendencias

## Tipos de Reportes

### 1. Reporte Diario
- Ventas del día
- Productos más vendidos
- Comparación con días anteriores

### 2. Reporte Semanal
- Resumen de la semana
- Top productos
- Clientes frecuentes
- Alertas de stock

### 3. Reporte Mensual
- Análisis profundo del mes
- Rentabilidad
- Tendencias
- Recomendaciones estratégicas

## Cómo Generar un Reporte

### Desde la App:
1. Ve a "Mis Datos"
2. Presiona "Generar Reporte"
3. Espera (puede tardar 10-30 segundos)
4. Lee el análisis
5. **Opcional:** Envíalo a WhatsApp

### Admin Console (Web):
- Dashboard → Reportes
- Historial completo de reportes
- Descargar en PDF (próximamente)

## Interpretando el Reporte

### Ventas
- **Total vendido:** Ingresos brutos
- **Promedio diario:** Ventas típicas
- **Tendencia:** ↗️ Subiendo / ↘️ Bajando

### Productos
- **Top 5:** Más vendidos
- **Sin movimiento:** No vendidos
- **Bajo stock:** Necesitan reposición

### Clientes
- **Frecuentes:** Tus mejores clientes
- **Deudas:** Quién te debe

## Acciones Recomendadas

Cuando el reporte te dice:

📈 "Las ventas están aumentando"
→ Considera aumentar inventario

📉 "Producto X no se vende"
→ Evalúa descontinuarlo o hacer promoción

⚠️ "Stock bajo en Y"
→ Realiza pedido a proveedor

💰 "Cliente Z tiene deuda alta"
→ Haz seguimiento

## Próximo Nivel

Aprende a usar el Admin Console para análisis más profundos""",
            "duration_minutes": 8,
            "order": 11
        },
        
        # INTERMEDIO
        {
            "title": "Gestión de Deudas",
            "description": "Cómo llevar control de cuentas por cobrar y por pagar",
            "category": "intermediate",
            "content": """# Gestión de Deudas 💰

## Tipos de Deudas

### 1. Cuentas por Cobrar (Te deben)
Ventas no pagadas completamente

### 2. Cuentas por Pagar (Debes)
Gastos o compras pendientes de pago

## Registrar una Venta a Crédito

Al registrar una venta:
1. Selecciona el cliente
2. En "¿Ya pagó?" selecciona **NO**
3. La app creará automáticamente la deuda

## Ver Deudas

**Clientes que te deben:**
- Menú → Deudas → Clientes
- Lista ordenada por monto
- Detalle de cada deuda

**Proveedores a quienes debes:**
- Menú → Deudas → Proveedores
- Control de pagos pendientes

## Registrar un Pago

1. Ve a la deuda específica
2. Presiona "Registrar Pago"
3. Ingresa monto pagado
4. Guarda

La deuda se actualizará automáticamente.

## Mejores Prácticas

✅ Establece límites de crédito
✅ Define plazos claros (7, 15, 30 días)
✅ Haz seguimiento semanal
✅ Usa recordatorios automáticos por WhatsApp

## Recordatorios

La app puede enviar recordatorios:
- Automáticos cada X días
- Personalizables por cliente
- Vía WhatsApp

## Consejos

💡 Registra pagos parciales
💡 Documenta todo
💡 Sé consistente con seguimiento
💡 Ofrece incentivos por pago puntual

## Reportes de Deudas

El reporte semanal incluye:
- Total por cobrar
- Deudas vencidas
- Clientes con más deuda
- Recomendaciones de cobranza""",
            "duration_minutes": 7,
            "order": 20
        },
        
        # AVANZADO
        {
            "title": "Análisis Avanzado en Admin Console",
            "description": "Domina el dashboard web para decisiones estratégicas",
            "category": "advanced",
            "content": """# Análisis Avanzado en Admin Console 📊

## ¿Qué es el Admin Console?

Una interfaz web profesional para:
- Analytics profundos
- Comparaciones temporales
- Exportación de datos
- Gestión masiva

## Acceso

**URL:** https://streetbiz.preview.emergentagent.com/admin

**Requisitos:**
- Computadora o tablet
- Navegador web
- Tus credenciales de la app

## Secciones Principales

### 1. Dashboard Ejecutivo

**KPIs Principales:**
- Ventas totales del período
- Margen de ganancia
- Productos en stock
- Clientes activos

**Comparaciones:**
- Semana vs semana anterior
- Mes vs mes anterior
- Tendencias visuales

### 2. Análisis de Productos

**Métricas Disponibles:**
- Rentabilidad por producto
- Frecuencia de venta
- Margen de ganancia
- Rotación de inventario

**Acciones:**
- Identificar bestsellers
- Detectar productos sin movimiento
- Optimizar precios
- Planificar compras

### 3. Análisis de Clientes

**Insights:**
- Clientes más frecuentes
- Ticket promedio
- Productos preferidos
- Historial de compras

**Segmentación:**
- Por frecuencia
- Por monto de compra
- Por productos
- Por deudas

### 4. Proveedores

**Control:**
- Compras por proveedor
- Deudas pendientes
- Productos suministrados
- Confiabilidad

### 5. Centro de Carga Masiva

**Importar CSV:**
- Productos completos
- Clientes en bloque
- Proveedores
- Actualización de inventario

**Formato:**
```csv
nombre,precio,stock,categoria
Coca Cola,2.5,100,Bebidas
Pan,0.25,50,Panadería
```

### 6. Soporte al Cliente

**Widget integrado:**
- Chat directo
- FAQs
- Formulario de contacto
- WhatsApp link

### 7. Historial de Reportes AI

- Todos los reportes generados
- Búsqueda por fecha
- Exportar a PDF
- Comparar reportes

## Tips Avanzados

### Comparación Semana/Semana
Detecta patrones:
- ¿Qué días vendes más?
- ¿Productos de fin de semana?
- ¿Estacionalidad?

### Análisis de Rentabilidad
```
Rentabilidad = (Precio Venta - Precio Compra) / Precio Venta × 100
```

Identifica:
- Productos con mejor margen
- Productos que no convienen
- Oportunidades de ajuste de precio

### Planificación de Compras
Usa los datos de:
- Velocidad de venta
- Stock actual
- Lead time del proveedor

Fórmula:
```
Comprar = (Velocidad × Lead Time) - Stock Actual
```

## Automatización

**Programar:**
- Reportes automáticos
- Alertas personalizadas
- Backups de datos
- Recordatorios de inventario

## Próximos Pasos

1. Exporta tus datos semanalmente
2. Analiza tendencias mensuales
3. Comparte insights con tu equipo
4. Toma decisiones basadas en datos

## ¿Necesitas más ayuda?

Contacta soporte desde el Admin Console""",
            "duration_minutes": 15,
            "order": 30
        }
    ]
    
    # Insert tutorials
    for tutorial in tutorials:
        tutorial["created_at"] = datetime.utcnow()
    
    result = await db.tutorials.insert_many(tutorials)
    
    print(f"✅ {len(result.inserted_ids)} tutoriales creados exitosamente!")
    
    # Print summary
    print("\n📚 Tutoriales por categoría:")
    categories = {}
    for tutorial in tutorials:
        cat = tutorial['category']
        if cat not in categories:
            categories[cat] = 0
        categories[cat] += 1
    
    for cat, count in categories.items():
        print(f"   {cat}: {count}")

if __name__ == "__main__":
    asyncio.run(seed_tutorials())
