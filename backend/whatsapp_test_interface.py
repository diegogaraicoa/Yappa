#!/usr/bin/env python3
"""
WhatsApp Test Interface - Placeholder para probar sin Twilio
Ejecutar: python3 whatsapp_test_interface.py
"""

import sys
sys.path.append('/app/backend')

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from services.whatsapp_conversation_service import WhatsAppConversationService
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

class WhatsAppTestInterface:
    def __init__(self):
        self.client = AsyncIOMotorClient("mongodb://localhost:27017")
        self.db = self.client["test_database"]
        self.service = WhatsAppConversationService(self.db)
        self.user_phone = "+593992913093"
        self.store_id = "690e264929f0c385565b3a1b"
        
    async def clear_active_conversations(self):
        """Limpia conversaciones activas para empezar de cero"""
        await self.db.whatsapp_conversations.update_many(
            {"user_phone": self.user_phone, "status": "active"},
            {"$set": {"status": "cancelled"}}
        )
    
    async def show_recent_sales(self):
        """Muestra ventas recientes"""
        from datetime import timedelta
        recent = datetime.utcnow() - timedelta(minutes=5)
        sales = await self.db.sales.find({
            "store_id": self.store_id,
            "created_at": {"$gte": recent}
        }).sort("created_at", -1).to_list(10)
        
        if sales:
            print("\n" + "="*60)
            print("💰 VENTAS REGISTRADAS (últimos 5 minutos):")
            print("="*60)
            for sale in sales:
                print(f"\n✅ Venta ID: {sale['_id']}")
                print(f"   Total: ${sale['total']}")
                print(f"   Cliente: {sale.get('customer_name', 'N/A')}")
                print(f"   Productos:")
                for p in sale.get('products', []):
                    print(f"      • {p['product_name']}: {p['quantity']} x ${p['price']}")
    
    async def show_recent_expenses(self):
        """Muestra gastos recientes"""
        from datetime import timedelta
        recent = datetime.utcnow() - timedelta(minutes=5)
        expenses = await self.db.expenses.find({
            "store_id": self.store_id,
            "created_at": {"$gte": recent}
        }).sort("created_at", -1).to_list(10)
        
        if expenses:
            print("\n" + "="*60)
            print("💸 GASTOS REGISTRADOS (últimos 5 minutos):")
            print("="*60)
            for expense in expenses:
                print(f"\n✅ Gasto ID: {expense['_id']}")
                print(f"   Monto: ${expense['amount']}")
                print(f"   Concepto: {expense.get('notes', 'N/A')}")
                print(f"   Categoría: {expense.get('category', 'N/A')}")
    
    async def test_conversation(self):
        """Prueba conversación interactiva"""
        print("\n" + "="*60)
        print("🤖 SIMULADOR DE WHATSAPP - BarrioShop")
        print("="*60)
        print(f"📱 Usuario: {self.user_phone}")
        print(f"🏪 Tienda: {self.store_id}")
        print("\nComandos especiales:")
        print("  • 'salir' - Terminar simulación")
        print("  • 'nuevo' - Empezar nueva conversación")
        print("  • 'ver' - Ver ventas/gastos recientes")
        print("\nEjemplos de uso:")
        print("  1. Escribe 'venta'")
        print("  2. 'vendí 2 aguas a Juan por $2 total'")
        print("  3. 'efectivo y ya pagó'")
        print("  4. 'sí'")
        print("\n" + "="*60 + "\n")
        
        while True:
            try:
                user_input = input("📱 TÚ: ").strip()
                
                if not user_input:
                    continue
                    
                if user_input.lower() == 'salir':
                    print("\n👋 ¡Hasta luego!")
                    break
                    
                if user_input.lower() == 'nuevo':
                    await self.clear_active_conversations()
                    print("✅ Nueva conversación iniciada\n")
                    continue
                    
                if user_input.lower() == 'ver':
                    await self.show_recent_sales()
                    await self.show_recent_expenses()
                    print()
                    continue
                
                # Procesar mensaje
                print("⏳ Procesando...", end="", flush=True)
                response = await self.service.process_message(
                    self.user_phone,
                    self.store_id,
                    user_input
                )
                print("\r" + " "*20 + "\r", end="")  # Limpiar "Procesando..."
                
                print(f"🤖 AI: {response}\n")
                
                # Si fue confirmación exitosa, mostrar resultados
                if "registrad" in response.lower() and "exitosamente" in response.lower():
                    await asyncio.sleep(1)
                    if "venta" in response.lower():
                        await self.show_recent_sales()
                    elif "gasto" in response.lower():
                        await self.show_recent_expenses()
                    print()
                    
            except KeyboardInterrupt:
                print("\n\n👋 ¡Hasta luego!")
                break
            except Exception as e:
                print(f"\n❌ Error: {str(e)}\n")

async def main():
    interface = WhatsAppTestInterface()
    await interface.test_conversation()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 ¡Hasta luego!")
