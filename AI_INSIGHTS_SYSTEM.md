# Sistema de Reportes Inteligentes con IA - PRIORIDAD CRÍTICA ⚠️

## 🎯 IMPORTANCIA
**IGUAL DE IMPORTANTE QUE EL SISTEMA DE ALERTAS DE STOCK**

## 📋 Descripción General

Sistema automatizado de análisis inteligente que:
- Se genera automáticamente al final de cada mes
- Usa IA para analizar todos los datos del negocio
- Proporciona insights accionables y sugerencias personalizadas
- Se envía automáticamente por WhatsApp y Email
- Se guarda como reporte histórico mensual

## 📊 Insights y Análisis Incluidos

### 1. Análisis de Ventas
- **Días con mayores ventas**: Identificar patrones semanales
- **Días con menores ventas**: Detectar oportunidades de mejora
- **Horas con mayores ventas**: Optimizar horarios y staff
- **Horas con menores ventas**: Identificar períodos bajos
- **Tendencias mensuales**: Comparar con meses anteriores
- **Productos más vendidos**: Top 10 del mes
- **Productos menos vendidos**: Identificar stock muerto

### 2. Análisis de Clientes
- **Mejor cliente del mes**: Mayor volumen de compras
- **Clientes frecuentes**: Patrones de compra
- **Nuevos clientes**: Crecimiento de base
- **Clientes inactivos**: Recuperación de ventas
- **Promedio de compra por cliente**: Métricas de valor

### 3. Análisis de Deudas
- **Quién debe más plata**: Top deudores
- **Total por cobrar**: Flujo de caja pendiente
- **Deudas vencidas**: Priorización de cobros
- **Tendencia de pago**: Clientes cumplidos vs morosos
- **Recomendaciones de cobro**: Estrategias sugeridas por IA

### 4. Análisis de Proveedores
- **Proveedores más utilizados**: Frecuencia de compras
- **Costo promedio por proveedor**: Comparativas
- **Productos por proveedor**: Diversificación
- **Sugerencias de negociación**: Basado en volumen

### 5. Análisis de Inventario
- **Productos de alta rotación**: Stock a mantener
- **Productos de baja rotación**: Considerar descontinuar
- **Margen de ganancia por producto**: Rentabilidad
- **Predicción de restock**: Cuándo y qué comprar

### 6. Análisis Financiero
- **Ingresos totales del mes**: Con comparativa
- **Gastos totales del mes**: Desglosados por categoría
- **Margen de ganancia**: Rentabilidad general
- **Flujo de caja**: Disponibilidad vs compromisos
- **Proyección próximo mes**: Basado en tendencias

## 🤖 Sugerencias con IA

### Tipos de Sugerencias:

1. **Planes de Acción**
   - "Aumenta stock de [producto] - se vende más los [días]"
   - "Considera promoción en [días bajos] para aumentar ventas"
   - "Contacta a [cliente] - no ha comprado en [días]"

2. **Optimizaciones**
   - "Horario óptimo: [horas] - considera ajustar staff"
   - "Elimina [producto] del inventario - baja rotación"
   - "Negocia mejor precio con [proveedor] - alto volumen"

3. **Alertas Proactivas**
   - "Ventas bajaron [%] vs mes anterior - acción requerida"
   - "Deudas aumentaron [%] - revisar política de crédito"
   - "Margen reducido en [categoría] - ajustar precios"

4. **Oportunidades**
   - "Cliente [nombre] puede comprar más - historial indica potencial"
   - "Día [día] tiene bajo tráfico - oportunidad de eventos"
   - "[Producto] complementa bien con [otro] - sugerir combo"

## 🏗️ Arquitectura Técnica

### Backend Components

#### 1. Data Aggregation Service
**Archivo:** `/app/backend/services/data_aggregator.py`

```python
class DataAggregator:
    """
    Agrega y procesa todos los datos del mes para análisis
    """
    async def aggregate_monthly_data(self, store_id: str, year: int, month: int):
        return {
            'sales_data': await self.get_sales_analysis(),
            'customer_data': await self.get_customer_analysis(),
            'debt_data': await self.get_debt_analysis(),
            'supplier_data': await self.get_supplier_analysis(),
            'inventory_data': await self.get_inventory_analysis(),
            'financial_data': await self.get_financial_analysis(),
        }
```

#### 2. AI Insights Generator
**Archivo:** `/app/backend/services/ai_insights.py`

**Integración con LLM:**
- OpenAI GPT-4 (Recomendado)
- Claude Sonnet 4
- Gemini 2.5 Pro

```python
import openai

class AIInsightsGenerator:
    """
    Usa IA para generar insights y sugerencias personalizadas
    """
    def __init__(self):
        self.client = openai.OpenAI(api_key=EMERGENT_LLM_KEY)
    
    async def generate_insights(self, aggregated_data: dict, store_context: dict):
        prompt = self._build_analysis_prompt(aggregated_data, store_context)
        
        response = self.client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "Eres un experto consultor de negocios para tiendas de barrio en Ecuador. Analiza datos y proporciona sugerencias accionables en español."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7
        )
        
        return self._parse_ai_response(response)
```

#### 3. Report Generator
**Archivo:** `/app/backend/services/report_generator.py`

```python
class ReportGenerator:
    """
    Genera reporte visual en HTML/PDF
    """
    async def generate_monthly_report(
        self,
        aggregated_data: dict,
        ai_insights: dict,
        store_info: dict
    ):
        # Genera HTML con gráficos
        html = self._generate_html_report()
        
        # Convierte a PDF
        pdf = self._convert_to_pdf(html)
        
        # Guarda en DB
        await self._save_report(pdf)
        
        return pdf
```

#### 4. Notification Service
**Archivo:** `/app/backend/services/monthly_notifications.py`

```python
class MonthlyNotificationService:
    """
    Envía reportes por WhatsApp y Email
    """
    async def send_monthly_report(
        self,
        store_id: str,
        report_pdf: bytes,
        insights_summary: str
    ):
        # Enviar por Email (SendGrid)
        await self.send_email(report_pdf, insights_summary)
        
        # Enviar por WhatsApp (Twilio)
        await self.send_whatsapp(insights_summary, report_pdf)
```

#### 5. Scheduled Task
**Archivo:** `/app/backend/tasks/monthly_report_task.py`

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', day='last', hour=23, minute=30)
async def generate_monthly_reports():
    """
    Se ejecuta el último día del mes a las 23:30
    """
    stores = await db.stores.find({'active': True}).to_list(None)
    
    for store in stores:
        try:
            # 1. Agregar datos
            data = await aggregator.aggregate_monthly_data(store['_id'])
            
            # 2. Generar insights con IA
            insights = await ai_generator.generate_insights(data, store)
            
            # 3. Crear reporte
            report = await report_gen.generate_monthly_report(data, insights, store)
            
            # 4. Enviar notificaciones
            await notifier.send_monthly_report(store['_id'], report, insights)
            
            logger.info(f"✅ Reporte mensual generado para {store['name']}")
        except Exception as e:
            logger.error(f"❌ Error generando reporte para {store['name']}: {e}")
```

### Backend Endpoints

```python
# Obtener reporte del mes actual
GET /api/reports/current-month

# Obtener reporte de un mes específico
GET /api/reports/{year}/{month}

# Lista de todos los reportes
GET /api/reports/history

# Forzar generación de reporte (para testing)
POST /api/reports/generate

# Vista previa de insights (sin generar reporte completo)
GET /api/insights/preview
```

### Frontend Components

#### 1. Pantalla Principal de Reportes
**Archivo:** `/app/frontend/app/insights.tsx`

```typescript
// Pantalla con:
// - Resumen del mes actual
// - Sugerencias destacadas (cards)
// - Botón "Ver Reporte Completo"
// - Historial de reportes anteriores
```

#### 2. Componente de Card de Sugerencia
**Archivo:** `/app/frontend/components/InsightCard.tsx`

```typescript
interface InsightCardProps {
  type: 'action' | 'opportunity' | 'alert' | 'optimization';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionButton?: string;
}
```

#### 3. Visor de Reporte PDF
**Archivo:** `/app/frontend/app/report-viewer.tsx`

```typescript
// Muestra reporte PDF con:
// - Navegación de secciones
// - Gráficos interactivos
// - Botones de compartir
```

## 📱 UI/UX en Explorar Tab

### Ubicación
**Sección:** Explorar → "Reportes Inteligentes" (Nuevo botón)

### Diseño del Botón
```
┌─────────────────────────────────────┐
│  🤖  Reportes Inteligentes          │
│                                     │
│  Insights y sugerencias con IA      │
│  • [2] sugerencias nuevas           │
└─────────────────────────────────────┘
```

### Pantalla Principal
```
┌─────────────────────────────────────┐
│ ← Reportes Inteligentes             │
├─────────────────────────────────────┤
│                                     │
│  📊 Reporte de [Mes Actual]         │
│  ─────────────────────────────      │
│  🎯 Sugerencias Destacadas          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ⚠️ ACCIÓN REQUERIDA          │   │
│  │ Contacta a Juan Pérez       │   │
│  │ No compra hace 15 días      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 💡 OPORTUNIDAD               │   │
│  │ Sábados = Mayor ventas      │   │
│  │ Considera más stock         │   │
│  └─────────────────────────────┘   │
│                                     │
│  📈 Ver Reporte Completo            │
│                                     │
│  📅 Reportes Anteriores             │
│  • Noviembre 2024                   │
│  • Octubre 2024                     │
└─────────────────────────────────────┘
```

## 🔧 Dependencias y Setup

### Backend Dependencies
```bash
pip install openai anthropic google-generativeai  # LLM APIs
pip install apscheduler  # Tareas programadas
pip install plotly kaleido  # Gráficos
pip install weasyprint  # HTML to PDF
pip install jinja2  # Templates
```

### Environment Variables
```bash
# .env backend
EMERGENT_LLM_KEY=xxx  # Ya disponible en sistema
OPENAI_MODEL=gpt-4-turbo
REPORT_GENERATION_TIME=23:30  # Hora de generación
```

### Database Collections
```javascript
// reports_monthly
{
  _id: ObjectId,
  store_id: ObjectId,
  year: 2024,
  month: 11,
  generated_at: DateTime,
  data_summary: {...},
  ai_insights: [...],
  report_pdf_base64: "...",
  sent_email: true,
  sent_whatsapp: true
}

// insights_history
{
  _id: ObjectId,
  store_id: ObjectId,
  date: DateTime,
  type: "action|opportunity|alert|optimization",
  title: "...",
  description: "...",
  priority: "high|medium|low",
  dismissed: false,
  completed: false
}
```

## 📊 Datos que Analiza la IA

### Input para el Modelo de IA:
```json
{
  "periodo": "Noviembre 2024",
  "tienda": {
    "nombre": "Mi Tienda",
    "ubicacion": "Ecuador",
    "tipo": "Tienda de barrio"
  },
  "ventas": {
    "total_mes": 5420.50,
    "numero_transacciones": 234,
    "ticket_promedio": 23.16,
    "mejor_dia": {"dia": "Sábado", "ventas": 890.20},
    "peor_dia": {"dia": "Lunes", "ventas": 234.50},
    "mejor_hora": {"hora": "18:00-19:00", "ventas": 1200.00},
    "productos_top": [
      {"nombre": "Coca Cola 600ml", "unidades": 150, "ingresos": 225.00}
    ]
  },
  "clientes": {
    "total": 45,
    "nuevos_mes": 8,
    "mejor_cliente": {"nombre": "Juan Pérez", "compras": 450.00},
    "clientes_inactivos": [
      {"nombre": "María López", "dias_sin_comprar": 30}
    ]
  },
  "deudas": {
    "total_por_cobrar": 890.50,
    "deudores_top": [
      {"nombre": "Pedro García", "monto": 234.00, "dias": 15}
    ]
  },
  "inventario": {
    "productos_bajo_stock": 3,
    "productos_sin_rotacion": 5,
    "margen_promedio": 35
  },
  "comparativa_mes_anterior": {
    "ventas_cambio": "+15%",
    "gastos_cambio": "+5%",
    "margen_cambio": "+3%"
  }
}
```

### Output Esperado de la IA:
```json
{
  "resumen_ejecutivo": "Tu tienda tuvo un excelente mes con 15% de crecimiento...",
  "sugerencias": [
    {
      "tipo": "accion",
      "prioridad": "alta",
      "titulo": "Contactar a María López",
      "descripcion": "No ha comprado en 30 días. Era cliente frecuente.",
      "accion": "Llamar o enviar promoción personalizada"
    },
    {
      "tipo": "oportunidad",
      "prioridad": "media",
      "titulo": "Optimizar inventario de sábados",
      "descripcion": "Los sábados representan 30% de ventas semanales",
      "accion": "Aumentar stock de productos top para sábados"
    }
  ],
  "metricas_clave": [
    {"nombre": "Crecimiento", "valor": "+15%", "tendencia": "positiva"},
    {"nombre": "Ticket Promedio", "valor": "$23.16", "tendencia": "estable"}
  ]
}
```

## 🎨 Prompt Template para IA

```
Eres un consultor experto para tiendas de barrio en Ecuador. Analiza los siguientes datos del mes y proporciona:

1. Resumen ejecutivo (2-3 oraciones)
2. 5-7 sugerencias accionables priorizadas
3. Identificación de oportunidades específicas
4. Alertas sobre problemas potenciales
5. Predicciones para el próximo mes

Datos del negocio:
{datos_json}

Formato de respuesta: JSON estructurado
Idioma: Español (Ecuador)
Tono: Profesional pero amigable, práctico y accionable
```

## 🚀 Plan de Implementación

### Fase 1: Infraestructura (2-3 horas)
- ✅ Crear modelos de datos en MongoDB
- ✅ Configurar APScheduler
- ✅ Setup de DataAggregator service
- ✅ Endpoints básicos

### Fase 2: Integración IA (2-3 horas)
- ✅ Integrar Emergent LLM Key con OpenAI
- ✅ Crear AIInsightsGenerator
- ✅ Diseñar prompts efectivos
- ✅ Testing de calidad de insights

### Fase 3: Generación de Reportes (2-3 horas)
- ✅ Plantillas HTML con gráficos
- ✅ Conversión a PDF
- ✅ Sistema de almacenamiento

### Fase 4: Frontend (2-3 horas)
- ✅ Pantalla de insights en Explorar
- ✅ Cards de sugerencias
- ✅ Visor de reportes
- ✅ Historial

### Fase 5: Notificaciones (2 horas)
- ✅ Integrar con WhatsApp service
- ✅ Integrar con Email service
- ✅ Templates de mensajes

### Fase 6: Testing y Ajustes (2 horas)
- ✅ Pruebas de generación
- ✅ Validación de insights
- ✅ Ajuste de prompts
- ✅ Performance optimization

**TIEMPO TOTAL ESTIMADO: 12-16 horas**

## ⚠️ Consideraciones Importantes

1. **Costo de IA**: 
   - GPT-4: ~$0.03-0.05 por reporte
   - Recomendado: Presupuesto ~$2-3/mes por tienda

2. **Privacidad de Datos**:
   - Datos sensibles deben ser anonimizados para IA
   - No enviar información personal identificable

3. **Calidad de Insights**:
   - Mejorar prompts basado en feedback
   - A/B testing de diferentes modelos
   - Validar sugerencias con usuarios

4. **Performance**:
   - Generación puede tomar 30-60 segundos
   - Ejecutar en background
   - Cache de reportes generados

## 📝 Notas del Usuario

**Importancia:** IGUAL DE CRÍTICA que sistema de alertas de stock
**Estado:** Documentado, esperando implementación
**Placeholder:** Agregar en sección Explorar
**Próximos pasos:** Implementar después de completar alertas de stock

---

**DOCUMENTADO: 7 de Noviembre, 2024**
**ESTADO: PENDIENTE IMPLEMENTACIÓN**
**PRIORIDAD: CRÍTICA ⚠️**
