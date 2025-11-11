import os
from datetime import datetime, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv

load_dotenv()

class AIInsightsService:
    def __init__(self):
        self.api_key = os.getenv('EMERGENT_LLM_KEY')
        
    async def generate_business_insights(self, sales_data: list, expenses_data: list, products_data: list, customers_data: list) -> dict:
        """
        Generate comprehensive business insights using Claude Sonnet 4
        
        Args:
            sales_data: List of sales transactions
            expenses_data: List of expenses
            products_data: List of products
            customers_data: List of customers
        
        Returns:
            dict with insights and recommendations
        """
        
        # Prepare data summary for AI
        total_sales = sum(sale.get('total', 0) for sale in sales_data)
        total_expenses = sum(expense.get('amount', 0) for expense in expenses_data)
        balance = total_sales - total_expenses
        
        # Product analysis
        product_sales_map = {}
        for sale in sales_data:
            for product in sale.get('products', []):
                product_name = product.get('product_name', 'Desconocido')
                quantity = product.get('quantity', 0)
                total = product.get('total', 0)
                
                if product_name not in product_sales_map:
                    product_sales_map[product_name] = {'quantity': 0, 'revenue': 0}
                
                product_sales_map[product_name]['quantity'] += quantity
                product_sales_map[product_name]['revenue'] += total
        
        # Sort products by revenue
        top_products = sorted(
            product_sales_map.items(),
            key=lambda x: x[1]['revenue'],
            reverse=True
        )[:5]
        
        # Low stock products
        low_stock = [p for p in products_data if p.get('quantity', 0) <= p.get('min_stock_alert', 10)]
        
        # Expense analysis
        expense_by_category = {}
        for expense in expenses_data:
            category = expense.get('category', 'Otros')
            amount = expense.get('amount', 0)
            
            if category not in expense_by_category:
                expense_by_category[category] = 0
            expense_by_category[category] += amount
        
        # Build prompt for AI
        prompt = f"""Eres un asesor de negocios experto que ayuda a pequeños tenderos en Ecuador. Analiza los siguientes datos de negocio y genera insights valiosos y accionables.

DATOS DEL NEGOCIO:

VENTAS:
- Total de ventas: ${total_sales:.2f}
- Número de transacciones: {len(sales_data)}
- Venta promedio: ${total_sales / len(sales_data) if sales_data else 0:.2f}

GASTOS:
- Total de gastos: ${total_expenses:.2f}
- Desglose por categoría:
{chr(10).join([f"  • {cat}: ${amt:.2f}" for cat, amt in expense_by_category.items()])}

BALANCE:
- Balance neto: ${balance:.2f}
- Margen: {(balance / total_sales * 100) if total_sales > 0 else 0:.1f}%

PRODUCTOS MÁS VENDIDOS:
{chr(10).join([f"  {i+1}. {name}: {data['quantity']} unidades vendidas, ${data['revenue']:.2f} generados" for i, (name, data) in enumerate(top_products)])}

PRODUCTOS CON STOCK BAJO:
{chr(10).join([f"  • {p['name']}: {p['quantity']} unidades (mínimo: {p.get('min_stock_alert', 10)})" for p in low_stock[:5]]) if low_stock else "  ✓ Todos los productos tienen stock suficiente"}

ANÁLISIS SOLICITADO:
1. **Productos más vendidos**: Identifica patrones y oportunidades
2. **Tendencias de ventas**: Análisis de desempeño
3. **Rentabilidad**: Evalúa márgenes y salud financiera
4. **Recomendaciones de stock**: Qué reabastecer y cuándo
5. **Análisis de gastos**: Dónde se está gastando más y si es óptimo
6. **Oportunidades de mejora**: 3-5 acciones concretas para aumentar ganancias

FORMATO DE RESPUESTA:
Genera un reporte claro, amigable y accionable en español. Usa emojis para hacer más visual. Estructura:

📊 RESUMEN EJECUTIVO
[2-3 líneas sobre el estado general del negocio]

💰 ANÁLISIS DE RENTABILIDAD
[Análisis del margen, balance, y salud financiera]

🏆 PRODUCTOS ESTRELLA
[Top productos y por qué están funcionando bien]

📈 TENDENCIAS
[Patrones observados en ventas]

💡 RECOMENDACIONES DE STOCK
[Qué productos reabastecer prioritariamente]

💸 ANÁLISIS DE GASTOS
[Evaluación de gastos y oportunidades de optimización]

🎯 ACCIONES RECOMENDADAS
[3-5 acciones específicas y fáciles de implementar]

Sé conciso, práctico y motivador. Habla como un asesor amigo que quiere ayudar al tendero a crecer su negocio."""

        try:
            # Initialize Claude chat
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"insights_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                system_message="Eres un asesor de negocios experto especializado en pequeñas tiendas en Latinoamérica. Generas análisis claros, prácticos y motivadores."
            ).with_model("anthropic", "claude-3-7-sonnet-20250219")
            
            # Send message to AI
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            # Parse response
            insights_text = response if isinstance(response, str) else str(response)
            
            return {
                'success': True,
                'insights': insights_text,
                'metrics': {
                    'total_sales': total_sales,
                    'total_expenses': total_expenses,
                    'balance': balance,
                    'margin': (balance / total_sales * 100) if total_sales > 0 else 0,
                    'num_transactions': len(sales_data),
                    'top_products': [{'name': name, 'quantity': data['quantity'], 'revenue': data['revenue']} for name, data in top_products],
                    'low_stock_count': len(low_stock)
                },
                'generated_at': datetime.now().isoformat()
            }
        
        except Exception as e:
            print(f"Error generating AI insights: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def format_insights_for_whatsapp(self, insights: dict) -> str:
        """Format insights for WhatsApp message"""
        if not insights.get('success'):
            return "❌ No se pudieron generar los insights en este momento."
        
        # Extract key parts from insights text
        insights_text = insights.get('insights', '')
        
        # Header and footer
        header = "📊 *REPORTE DE TU NEGOCIO* 📊\n\n"
        footer = "\n\n💬 Ver reporte completo en la app"
        
        # Calculate max length (Twilio limit is 1600, leave buffer for safety)
        max_content_length = 1500 - len(header) - len(footer)
        
        # Truncate if needed
        if len(insights_text) > max_content_length:
            # Find a good break point (paragraph break)
            truncated = insights_text[:max_content_length]
            last_paragraph = truncated.rfind('\n\n')
            if last_paragraph > 800:  # Keep at least 800 chars
                insights_text = truncated[:last_paragraph]
            else:
                insights_text = truncated
            insights_text += footer
        
        return header + insights_text

# Singleton instance
ai_insights_service = AIInsightsService()
