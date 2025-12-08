"""
Script para restaurar data de prueba en la base de datos
"""

import sys
import os
sys.path.append('/app/backend')

from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random

load_dotenv()
client = MongoClient(os.getenv('MONGO_URL'))
db = client['test_database']

# Buscar el merchant tiendaclave
merchant = db.merchants.find_one({'username': 'tiendaclave'})
if not merchant:
    print("❌ No se encontró el merchant tiendaclave")
    sys.exit(1)

store_id = str(merchant['_id'])
store_name = merchant.get('store_name', merchant.get('nombre'))
print(f"✅ Restaurando data para: {store_name} ({store_id})\n")

# ============================================
# PRODUCTOS
# ============================================
print("📦 Creando productos...")
productos = [
    {"nombre": "Coca Cola 2L", "categoria": "Bebidas", "precio": 2.50, "stock": 45, "stock_minimo": 10},
    {"nombre": "Sprite 2L", "categoria": "Bebidas", "precio": 2.30, "stock": 38, "stock_minimo": 10},
    {"nombre": "Agua Mineral 500ml", "categoria": "Bebidas", "precio": 0.75, "stock": 120, "stock_minimo": 30},
    {"nombre": "Pan Blanco", "categoria": "Panadería", "precio": 0.35, "stock": 80, "stock_minimo": 20},
    {"nombre": "Leche Entera 1L", "categoria": "Lácteos", "precio": 1.20, "stock": 55, "stock_minimo": 15},
    {"nombre": "Arroz 1kg", "categoria": "Granos", "precio": 1.50, "stock": 65, "stock_minimo": 20},
    {"nombre": "Aceite de Cocina 1L", "categoria": "Aceites", "precio": 3.50, "stock": 25, "stock_minimo": 10},
    {"nombre": "Azúcar 1kg", "categoria": "Endulzantes", "precio": 1.10, "stock": 40, "stock_minimo": 15},
    {"nombre": "Sal 500g", "categoria": "Condimentos", "precio": 0.60, "stock": 50, "stock_minimo": 10},
    {"nombre": "Papel Higiénico x4", "categoria": "Higiene", "precio": 2.80, "stock": 35, "stock_minimo": 10},
    {"nombre": "Detergente 500g", "categoria": "Limpieza", "precio": 1.90, "stock": 28, "stock_minimo": 8},
    {"nombre": "Jabón de Baño", "categoria": "Higiene", "precio": 0.85, "stock": 60, "stock_minimo": 15},
    {"nombre": "Atún en Lata", "categoria": "Enlatados", "precio": 1.75, "stock": 42, "stock_minimo": 12},
    {"nombre": "Galletas Saladas", "categoria": "Snacks", "precio": 1.20, "stock": 55, "stock_minimo": 15},
    {"nombre": "Chocolate en Barra", "categoria": "Dulces", "precio": 0.95, "stock": 48, "stock_minimo": 10},
    {"nombre": "Jugo de Naranja 1L", "categoria": "Bebidas", "precio": 2.20, "stock": 32, "stock_minimo": 10},
    {"nombre": "Cerveza Pilsener", "categoria": "Bebidas", "precio": 1.25, "stock": 72, "stock_minimo": 20},
    {"nombre": "Huevos x12", "categoria": "Lácteos", "precio": 2.90, "stock": 18, "stock_minimo": 6},
    {"nombre": "Pasta 500g", "categoria": "Granos", "precio": 1.40, "stock": 45, "stock_minimo": 15},
    {"nombre": "Café Molido 250g", "categoria": "Bebidas", "precio": 3.80, "stock": 22, "stock_minimo": 8},
]

for prod in productos:
    db.products.insert_one({
        **prod,
        "store_id": store_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })

print(f"  ✅ {len(productos)} productos creados")

# ============================================
# CLIENTES
# ============================================
print("\n👥 Creando clientes...")
clientes = [
    {"nombre": "Juan Pérez", "telefono": "+593987654321", "email": "juan@example.com", "direccion": "Av. Principal 123"},
    {"nombre": "María González", "telefono": "+593987654322", "email": "maria@example.com", "direccion": "Calle Secundaria 456"},
    {"nombre": "Carlos Ramírez", "telefono": "+593987654323", "email": "carlos@example.com", "direccion": "Barrio Norte 789"},
    {"nombre": "Ana Torres", "telefono": "+593987654324", "email": "ana@example.com", "direccion": "Centro 012"},
    {"nombre": "Luis Morales", "telefono": "+593987654325", "email": "luis@example.com", "direccion": "Zona Sur 345"},
    {"nombre": "Carmen Silva", "telefono": "+593987654326", "email": "carmen@example.com", "direccion": "Ciudadela Este 678"},
    {"nombre": "Roberto Díaz", "telefono": "+593987654327", "email": "roberto@example.com", "direccion": "Urbanización Oeste 901"},
    {"nombre": "Patricia Ruiz", "telefono": "+593987654328", "email": "patricia@example.com", "direccion": "Conjunto Residencial 234"},
]

for cliente in clientes:
    db.customers.insert_one({
        **cliente,
        "store_id": store_id,
        "deuda_total": 0.0,
        "created_at": datetime.utcnow()
    })

print(f"  ✅ {len(clientes)} clientes creados")

# ============================================
# PROVEEDORES
# ============================================
print("\n🚚 Creando proveedores...")
proveedores = [
    {"nombre": "Distribuidora Central", "contacto": "José Vargas", "telefono": "+593999111222", "email": "ventas@distcentral.com"},
    {"nombre": "Alimentos del Pacífico", "contacto": "Laura Mendoza", "telefono": "+593999222333", "email": "info@alipacifico.com"},
    {"nombre": "Bebidas Andinas", "contacto": "Miguel Ángel", "telefono": "+593999333444", "email": "pedidos@bebidasandinas.com"},
]

for proveedor in proveedores:
    db.suppliers.insert_one({
        **proveedor,
        "store_id": store_id,
        "created_at": datetime.utcnow()
    })

print(f"  ✅ {len(proveedores)} proveedores creados")

# ============================================
# VENTAS (últimos 30 días)
# ============================================
print("\n💰 Creando ventas...")
productos_list = list(db.products.find({"store_id": store_id}))
clientes_list = list(db.customers.find({"store_id": store_id}))

num_ventas = 45
for i in range(num_ventas):
    # Fecha aleatoria en los últimos 30 días
    dias_atras = random.randint(0, 30)
    fecha_venta = datetime.utcnow() - timedelta(days=dias_atras)
    
    # 2-5 productos por venta
    num_items = random.randint(2, 5)
    items = []
    total = 0
    
    for _ in range(num_items):
        prod = random.choice(productos_list)
        cantidad = random.randint(1, 5)
        subtotal = prod['precio'] * cantidad
        total += subtotal
        
        items.append({
            "product_id": str(prod['_id']),
            "product_name": prod['nombre'],
            "quantity": cantidad,
            "unit_price": prod['precio'],
            "subtotal": round(subtotal, 2)
        })
    
    # 70% ventas con cliente, 30% sin cliente
    cliente = random.choice(clientes_list) if random.random() < 0.7 else None
    
    venta = {
        "store_id": store_id,
        "items": items,
        "total": round(total, 2),
        "payment_method": random.choice(["Efectivo", "Transferencia", "Tarjeta"]),
        "created_at": fecha_venta,
        "date": fecha_venta.strftime("%Y-%m-%d"),
        "notes": ""
    }
    
    if cliente:
        venta["customer_id"] = str(cliente['_id'])
        venta["customer_name"] = cliente['nombre']
    
    db.sales.insert_one(venta)

print(f"  ✅ {num_ventas} ventas creadas")

# ============================================
# GASTOS (últimos 30 días)
# ============================================
print("\n💸 Creando gastos...")
categorias_gastos = ["Servicios", "Alquiler", "Compras", "Transporte", "Mantenimiento", "Otros"]
num_gastos = 25

for i in range(num_gastos):
    dias_atras = random.randint(0, 30)
    fecha_gasto = datetime.utcnow() - timedelta(days=dias_atras)
    
    categoria = random.choice(categorias_gastos)
    descripciones = {
        "Servicios": ["Luz", "Agua", "Internet", "Teléfono"],
        "Alquiler": ["Alquiler del local"],
        "Compras": ["Compra de mercadería", "Reposición de stock"],
        "Transporte": ["Gasolina", "Transporte público", "Envíos"],
        "Mantenimiento": ["Reparación de equipos", "Limpieza profunda"],
        "Otros": ["Varios", "Imprevistos"]
    }
    
    gasto = {
        "store_id": store_id,
        "category": categoria,
        "description": random.choice(descripciones[categoria]),
        "amount": round(random.uniform(10, 250), 2),
        "payment_method": random.choice(["Efectivo", "Transferencia"]),
        "created_at": fecha_gasto,
        "date": fecha_gasto.strftime("%Y-%m-%d")
    }
    
    db.expenses.insert_one(gasto)

print(f"  ✅ {num_gastos} gastos creados")

# ============================================
# RESUMEN
# ============================================
print("\n" + "="*60)
print("✅ DATA RESTAURADA EXITOSAMENTE")
print("="*60)
print(f"\n📊 Resumen para {store_name}:")
print(f"   • {len(productos)} productos")
print(f"   • {len(clientes)} clientes")
print(f"   • {len(proveedores)} proveedores")
print(f"   • {num_ventas} ventas")
print(f"   • {num_gastos} gastos")
print("\n✅ Ahora puedes probar la app con data realista\n")
