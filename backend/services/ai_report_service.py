import os
from datetime import datetime, timedelta
from typing import Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv
import traceback

load_dotenv()

class AIReportService:
    """Service for generating comprehensive AI-powered business reports"""
    
    def __init__(self):
        self.api_key = os.getenv('EMERGENT_LLM_KEY')
        
    async def aggregate_business_data(self, db, merchant_id: str, year: int, month: int) -> dict:
        """
        Aggregate all business data for a specific month
        """
        from bson import ObjectId
        
        # Calculate date range for the month
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        # Calculate previous month for comparison
        if month == 1:
            prev_start = datetime(year - 1, 12, 1)
            prev_end = start_date
        else:
            prev_start = datetime(year, month - 1, 1)
            prev_end = start_date
        
        try:
            # Get sales data for current month
            sales = await db.sales.find({
                'merchant_id': merchant_id,
                'date': {'$gte': start_date, '$lt': end_date}
            }).to_list(1000)
            
            # Get sales data for previous month (comparison)
            prev_sales = await db.sales.find({
                'merchant_id': merchant_id,
                'date': {'$gte': prev_start, '$lt': prev_end}
            }).to_list(1000)
            
            # Get expenses for current month
            expenses = await db.expenses.find({
                'merchant_id': merchant_id,
                'date': {'$gte': start_date, '$lt': end_date}
            }).to_list(1000)
            
            # Get previous month expenses
            prev_expenses = await db.expenses.find({
                'merchant_id': merchant_id,
                'date': {'$gte': prev_start, '$lt': prev_end}
            }).to_list(1000)
            
            # Get all products
            products = await db.products.find({'merchant_id': merchant_id}).to_list(500)
            
            # Get all customers with debts
            customers = await db.customers.find({'merchant_id': merchant_id}).to_list(500)
            
            # Analyze sales by day of week
            sales_by_day = {i: {'count': 0, 'total': 0} for i in range(7)}
            sales_by_hour = {i: {'count': 0, 'total': 0} for i in range(24)}
            
            for sale in sales:
                if 'date' in sale and sale['date']:
                    day = sale['date'].weekday()
                    hour = sale['date'].hour
                    total = sale.get('total', 0)
                    
                    sales_by_day[day]['count'] += 1
                    sales_by_day[day]['total'] += total
                    
                    sales_by_hour[hour]['count'] += 1
                    sales_by_hour[hour]['total'] += total
            
            # Product analysis
            product_sales = {}
            for sale in sales:
                for prod in sale.get('products', []):
                    name = prod.get('product_name', 'Desconocido')
                    qty = prod.get('quantity', 0)
                    total = prod.get('total', 0)
                    
                    if name not in product_sales:
                        product_sales[name] = {'quantity': 0, 'revenue': 0}
                    product_sales[name]['quantity'] += qty
                    product_sales[name]['revenue'] += total
            
            # Sort products by revenue
            top_products = sorted(
                product_sales.items(),
                key=lambda x: x[1]['revenue'],
                reverse=True
            )[:10]
            
            # Low selling products
            low_products = sorted(
                product_sales.items(),
                key=lambda x: x[1]['revenue']
            )[:5]
            
            # Customer analysis
            customer_purchases = {}
            for sale in sales:
                customer_name = sale.get('customer_name', 'Público General')
                total = sale.get('total', 0)
                
                if customer_name not in customer_purchases:
                    customer_purchases[customer_name] = {'count': 0, 'total': 0}
                customer_purchases[customer_name]['count'] += 1
                customer_purchases[customer_name]['total'] += total
            
            top_customers = sorted(
                customer_purchases.items(),
                key=lambda x: x[1]['total'],
                reverse=True
            )[:5]
            
            # Debt analysis
            total_debt = sum(abs(c.get('deuda_total', 0)) for c in customers if c.get('deuda_total', 0) < 0)
            top_debtors = sorted(
                [c for c in customers if c.get('deuda_total', 0) < 0],
                key=lambda x: abs(x.get('deuda_total', 0)),
                reverse=True
            )[:5]
            
            # Expense analysis
            expense_by_category = {}
            for exp in expenses:
                cat = exp.get('category', 'Otros')
                amt = exp.get('amount', 0)
                if cat not in expense_by_category:
                    expense_by_category[cat] = 0
                expense_by_category[cat] += amt
            
            # Low stock products
            low_stock = [
                p for p in products 
                if p.get('quantity', 0) <= p.get('min_stock_alert', 10)
            ]
            
            # Calculate totals
            total_sales = sum(s.get('total', 0) for s in sales)
            total_expenses_amt = sum(e.get('amount', 0) for e in expenses)
            prev_total_sales = sum(s.get('total', 0) for s in prev_sales)
            prev_total_expenses = sum(e.get('amount', 0) for e in prev_expenses)
            
            # Calculate changes
            sales_change = ((total_sales - prev_total_sales) / prev_total_sales * 100) if prev_total_sales > 0 else 0
            expenses_change = ((total_expenses_amt - prev_total_expenses) / prev_total_expenses * 100) if prev_total_expenses > 0 else 0
            
            # Day names in Spanish
            day_names = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
            
            # Find best/worst days
            best_day = max(sales_by_day.items(), key=lambda x: x[1]['total'])
            worst_day = min(sales_by_day.items(), key=lambda x: x[1]['total'] if x[1]['count'] > 0 else float('inf'))
            
            # Find best hours
            best_hour = max(sales_by_hour.items(), key=lambda x: x[1]['total'])
            
            return {
                'period': {
                    'year': year,
                    'month': month,
                    'month_name': self._get_month_name(month)
                },
                'sales': {
                    'total': total_sales,
                    'count': len(sales),
                    'average_ticket': total_sales / len(sales) if sales else 0,
                    'previous_month_total': prev_total_sales,
                    'change_percent': round(sales_change, 1)
                },
                'expenses': {
                    'total': total_expenses_amt,
                    'count': len(expenses),
                    'by_category': expense_by_category,
                    'previous_month_total': prev_total_expenses,
                    'change_percent': round(expenses_change, 1)
                },
                'balance': {
                    'net': total_sales - total_expenses_amt,
                    'margin_percent': round((total_sales - total_expenses_amt) / total_sales * 100, 1) if total_sales > 0 else 0
                },
                'patterns': {
                    'best_day': {'name': day_names[best_day[0]], 'sales': best_day[1]['total']},
                    'worst_day': {'name': day_names[worst_day[0]], 'sales': worst_day[1]['total']},
                    'best_hour': {'hour': f"{best_hour[0]:02d}:00", 'sales': best_hour[1]['total']},
                    'sales_by_day': {day_names[k]: v for k, v in sales_by_day.items()}
                },
                'products': {
                    'top_selling': [{'name': n, **d} for n, d in top_products],
                    'low_selling': [{'name': n, **d} for n, d in low_products],
                    'low_stock': [{'name': p.get('nombre', p.get('name', 'N/A')), 'quantity': p.get('quantity', 0)} for p in low_stock[:5]],
                    'total_products': len(products)
                },
                'customers': {
                    'top_buyers': [{'name': n, **d} for n, d in top_customers],
                    'total_customers': len(customers),
                    'new_this_month': len([c for c in customers if c.get('created_at') and c['created_at'] >= start_date])
                },
                'debts': {
                    'total_pending': total_debt,
                    'top_debtors': [{'name': c.get('nombre', 'N/A'), 'amount': abs(c.get('deuda_total', 0))} for c in top_debtors]
                }
            }
        except Exception as e:
            print(f"Error aggregating data: {e}")
            traceback.print_exc()
            return None
    
    def _get_month_name(self, month: int) -> str:
        """Get Spanish month name"""
        months = {
            1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
            5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
            9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
        }
        return months.get(month, '')
    
    async def generate_report(self, db, merchant_id: str, year: int, month: int) -> dict:
        """
        Generate a comprehensive AI-powered business report
        """
        try:
            # Aggregate all business data
            data = await self.aggregate_business_data(db, merchant_id, year, month)
            
            if not data:
                return {'success': False, 'error': 'No se pudieron obtener los datos del negocio'}
            
            # Build comprehensive prompt for Claude
            prompt = self._build_report_prompt(data)
            
            # Generate AI analysis
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"report_{merchant_id}_{year}_{month}_{datetime.now().strftime('%H%M%S')}",
                system_message="""Eres un consultor experto para tiendas de barrio en Ecuador. 
Generas reportes mensuales claros, prácticos y motivadores.
Siempre respondes en español y usas formato estructurado con emojis para mejor lectura.
Das consejos accionables y específicos basados en los datos."""
            ).with_model("anthropic", "claude-4-sonnet-20250514")
            
            user_message = UserMessage(text=prompt)
            ai_response = await chat.send_message(user_message)
            ai_content = ai_response if isinstance(ai_response, str) else str(ai_response)
            
            # Create report document
            report = {
                'merchant_id': merchant_id,
                'year': year,
                'month': month,
                'month_name': data['period']['month_name'],
                'generated_at': datetime.now(),
                'data_summary': data,
                'ai_analysis': ai_content,
                'metrics': {
                    'total_sales': data['sales']['total'],
                    'total_expenses': data['expenses']['total'],
                    'net_balance': data['balance']['net'],
                    'margin_percent': data['balance']['margin_percent'],
                    'sales_change': data['sales']['change_percent'],
                    'total_debt': data['debts']['total_pending']
                }
            }
            
            # Save to database
            result = await db.ai_reports.insert_one(report)
            report['_id'] = str(result.inserted_id)
            
            return {
                'success': True,
                'report': {
                    'id': report['_id'],
                    'year': year,
                    'month': month,
                    'month_name': data['period']['month_name'],
                    'generated_at': report['generated_at'].isoformat(),
                    'ai_analysis': ai_content,
                    'metrics': report['metrics']
                }
            }
            
        except Exception as e:
            print(f"Error generating report: {e}")
            traceback.print_exc()
            return {'success': False, 'error': str(e)}
    
    def _build_report_prompt(self, data: dict) -> str:
        """Build a comprehensive prompt for the AI report"""
        
        # Format top products
        top_products_str = "\n".join([
            f"  {i+1}. {p['name']}: {p['quantity']} unidades, ${p['revenue']:.2f}" 
            for i, p in enumerate(data['products']['top_selling'][:5])
        ]) or "  No hay datos suficientes"
        
        # Format low products
        low_products_str = "\n".join([
            f"  • {p['name']}: {p['quantity']} unidades, ${p['revenue']:.2f}" 
            for p in data['products']['low_selling'][:3]
        ]) or "  No hay datos suficientes"
        
        # Format expenses by category
        expenses_str = "\n".join([
            f"  • {cat}: ${amt:.2f}" 
            for cat, amt in data['expenses']['by_category'].items()
        ]) or "  Sin gastos registrados"
        
        # Format top customers
        top_customers_str = "\n".join([
            f"  {i+1}. {c['name']}: {c['count']} compras, ${c['total']:.2f}" 
            for i, c in enumerate(data['customers']['top_buyers'][:5])
        ]) or "  No hay datos suficientes"
        
        # Format top debtors
        debtors_str = "\n".join([
            f"  • {d['name']}: ${d['amount']:.2f}" 
            for d in data['debts']['top_debtors']
        ]) or "  ¡Sin deudas pendientes!"
        
        # Format low stock
        low_stock_str = "\n".join([
            f"  ⚠️ {p['name']}: {p['quantity']} unidades" 
            for p in data['products']['low_stock']
        ]) or "  ✅ Todo el inventario con stock suficiente"
        
        # Sales change indicator
        sales_change = data['sales']['change_percent']
        sales_indicator = "📈" if sales_change > 0 else "📉" if sales_change < 0 else "➡️"
        
        prompt = f"""Genera un REPORTE MENSUAL COMPLETO para una tienda de barrio en Ecuador.

═══════════════════════════════════════════════════════
DATOS DEL MES: {data['period']['month_name']} {data['period']['year']}
═══════════════════════════════════════════════════════

📊 VENTAS
• Total del mes: ${data['sales']['total']:.2f}
• Transacciones: {data['sales']['count']}
• Ticket promedio: ${data['sales']['average_ticket']:.2f}
• Mes anterior: ${data['sales']['previous_month_total']:.2f}
• Cambio: {sales_indicator} {sales_change:+.1f}%

💸 GASTOS
• Total: ${data['expenses']['total']:.2f}
• Por categoría:
{expenses_str}
• Cambio vs mes anterior: {data['expenses']['change_percent']:+.1f}%

💰 BALANCE
• Ganancia neta: ${data['balance']['net']:.2f}
• Margen: {data['balance']['margin_percent']}%

📅 PATRONES DE VENTA
• Mejor día: {data['patterns']['best_day']['name']} (${data['patterns']['best_day']['sales']:.2f})
• Día más bajo: {data['patterns']['worst_day']['name']} (${data['patterns']['worst_day']['sales']:.2f})
• Mejor hora: {data['patterns']['best_hour']['hour']} (${data['patterns']['best_hour']['sales']:.2f})

🏆 TOP PRODUCTOS
{top_products_str}

📉 PRODUCTOS CON MENOS VENTAS
{low_products_str}

👥 MEJORES CLIENTES
{top_customers_str}

💳 DEUDAS PENDIENTES (${data['debts']['total_pending']:.2f} total)
{debtors_str}

📦 INVENTARIO BAJO
{low_stock_str}

═══════════════════════════════════════════════════════

GENERA UN REPORTE CON ESTA ESTRUCTURA EXACTA:

## 📊 RESUMEN EJECUTIVO
[3-4 oraciones resumiendo el mes: ventas, tendencia, y punto clave]

## 💰 SALUD FINANCIERA
[Análisis del balance, margen, y comparación con mes anterior]

## 🏆 ÉXITOS DEL MES
[Qué funcionó bien: productos estrella, mejores días, clientes leales]

## ⚠️ PUNTOS DE ATENCIÓN
[Problemas a resolver: deudas, stock bajo, productos sin vender]

## 📈 OPORTUNIDADES DETECTADAS
[2-3 oportunidades específicas basadas en los datos]

## 🎯 PLAN DE ACCIÓN (5 tareas)
[5 acciones ESPECÍFICAS y ACCIONABLES para el próximo mes]
1. [Acción 1 - con detalle]
2. [Acción 2 - con detalle]
3. [Acción 3 - con detalle]
4. [Acción 4 - con detalle]
5. [Acción 5 - con detalle]

## 🔮 PREDICCIÓN
[Proyección para el próximo mes basada en tendencias]

---
Sé específico con nombres de productos, clientes y números.
Habla en tono amigable y motivador, como un asesor de confianza.
Todas las recomendaciones deben ser PRÁCTICAS y EJECUTABLES."""
        
        return prompt


# Singleton instance
ai_report_service = AIReportService()
