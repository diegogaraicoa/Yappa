from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'tiendadb')]

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production-tienda-app-2025')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200  # 30 días

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Autenticación compatible con ambos sistemas:
    - Sistema antiguo: token con 'sub' que apunta a 'users'
    - Sistema nuevo: token con 'merchant_id' que apunta a 'merchants'
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Intentar primero con el nuevo sistema (merchant_id)
        merchant_id = payload.get("merchant_id")
        if merchant_id:
            merchant = await db.merchants.find_one({"_id": ObjectId(merchant_id)})
            if merchant:
                # Retornar un objeto compatible con el sistema antiguo
                return {
                    "_id": merchant["_id"],
                    "store_id": str(merchant["_id"]),  # El merchant_id ES el store_id
                    "username": merchant.get("username"),
                    "email": merchant.get("email"),
                    "admin_id": merchant.get("admin_id"),
                    "clerk_id": payload.get("clerk_id"),
                    "whatsapp_number": merchant.get("whatsapp_number"),
                    "expo_push_token": merchant.get("expo_push_token"),
                    "alerts_enabled": merchant.get("alerts_enabled", True),
                    "stock_alerts_enabled": merchant.get("stock_alerts_enabled", True),
                }
        
        # Fallback al sistema antiguo (sub -> users)
        user_id: str = payload.get("sub")
        if user_id:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            if user:
                return user
        
        raise HTTPException(status_code=401, detail="Token inválido - usuario no encontrado")
        
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token inválido: {str(e)}")

# ==================== MODELS ====================

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

# Auth Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    store_name: str
    whatsapp_number: str  # Campo obligatorio

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

# Store Models
class Store(BaseModel):
    id: Optional[str] = Field(alias="_id")
    name: str
    owner_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    active: bool = True

class StoreCreate(BaseModel):
    name: str

# Customer Models
class Customer(BaseModel):
    id: Optional[str] = Field(alias="_id")
    store_id: str
    name: str
    lastname: str
    phone: Optional[str] = None
    email: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CustomerCreate(BaseModel):
    name: str
    lastname: str
    phone: Optional[str] = None
    email: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    nombre: Optional[str] = None
    lastname: Optional[str] = None
    apellido: Optional[str] = None
    phone: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    deuda_total: Optional[float] = None
    balance: Optional[float] = None

# Supplier Models
class Supplier(BaseModel):
    id: Optional[str] = Field(alias="_id")
    store_id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    type: Optional[str] = None
    tax_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SupplierCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    type: Optional[str] = None
    tax_id: Optional[str] = None

# Employee Models
class Employee(BaseModel):
    id: Optional[str] = Field(alias="_id")
    store_id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    salary: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EmployeeCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    salary: float = 0.0

# Category Models
class Category(BaseModel):
    id: Optional[str] = Field(alias="_id")
    store_id: str
    name: str
    type: str  # "product" o "expense"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CategoryCreate(BaseModel):
    name: str
    type: str

# Product Models
class Product(BaseModel):
    id: Optional[str] = Field(alias="_id")
    store_id: str
    name: str
    image: Optional[str] = None  # base64
    quantity: float = 0.0
    price: float = 0.0
    cost: float = 0.0
    category_id: Optional[str] = None
    description: Optional[str] = None
    min_stock_alert: float = 10.0  # Umbral de alerta
    alert_enabled: bool = True  # Activar/desactivar alertas
    preferred_supplier_id: Optional[str] = None  # Proveedor preferido
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    name: str
    image: Optional[str] = None
    quantity: float = 0.0
    price: float = 0.0
    cost: float = 0.0
    category_id: Optional[str] = None
    description: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    nombre: Optional[str] = None
    image: Optional[str] = None
    quantity: Optional[float] = None
    stock: Optional[float] = None
    price: Optional[float] = None
    precio: Optional[float] = None
    cost: Optional[float] = None
    category_id: Optional[str] = None
    description: Optional[str] = None
    stock_minimo: Optional[float] = None
    min_stock_alert: Optional[float] = None

# Sale Models
class SaleProduct(BaseModel):
    product_id: str
    product_name: str
    quantity: float
    price: float
    total: float

class Sale(BaseModel):
    id: Optional[str] = Field(alias="_id")
    store_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    products: List[SaleProduct] = []
    total: float
    payment_method: str
    paid: bool
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    notes: Optional[str] = None
    with_inventory: bool = True
    synced: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SaleCreate(BaseModel):
    date: Optional[datetime] = None
    products: List[SaleProduct] = []
    total: float
    payment_method: str
    paid: bool
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    notes: Optional[str] = None
    with_inventory: bool = True

# Expense Models
class Expense(BaseModel):
    id: Optional[str] = Field(alias="_id")
    store_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    category: str
    amount: float
    supplier_id: Optional[str] = None
    supplier_name: Optional[str] = None
    payment_method: str
    paid: bool
    notes: Optional[str] = None
    employee_id: Optional[str] = None  # For payroll
    product_id: Optional[str] = None  # For product purchases
    synced: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ExpenseCreate(BaseModel):
    date: Optional[datetime] = None
    category: str
    amount: float
    supplier_id: Optional[str] = None
    supplier_name: Optional[str] = None
    payment_method: str
    paid: bool
    notes: Optional[str] = None
    employee_id: Optional[str] = None
    product_id: Optional[str] = None

# Debt Models
class Debt(BaseModel):
    id: Optional[str] = Field(alias="_id")
    store_id: str
    type: str  # "customer" o "supplier"
    amount: float
    customer_id: Optional[str] = None
    supplier_id: Optional[str] = None
    related_name: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None
    paid: bool = False
    synced: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DebtCreate(BaseModel):
    type: str
    amount: float
    customer_id: Optional[str] = None
    supplier_id: Optional[str] = None
    related_name: Optional[str] = None
    date: Optional[datetime] = None
    notes: Optional[str] = None
    paid: bool = False

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Validate WhatsApp number format
    whatsapp_number = user_data.whatsapp_number.strip()
    if not whatsapp_number:
        raise HTTPException(status_code=400, detail="El número de WhatsApp es obligatorio")
    
    # Ensure number starts with + for international format
    if not whatsapp_number.startswith('+'):
        whatsapp_number = '+' + whatsapp_number
    
    # Create store
    store = {
        "name": user_data.store_name,
        "owner_id": "",
        "created_at": datetime.utcnow(),
        "active": True
    }
    store_result = await db.stores.insert_one(store)
    store_id = str(store_result.inserted_id)
    
    # Create user with WhatsApp number
    user = {
        "email": user_data.email,
        "password": get_password_hash(user_data.password),
        "store_id": store_id,
        "role": "owner",
        "whatsapp_number": whatsapp_number,  # Guardar número de WhatsApp
        "alerts_enabled": True,
        "stock_alerts_enabled": True,
        "daily_summary_enabled": True,
        "weekly_summary_enabled": True,
        "created_at": datetime.utcnow()
    }
    user_result = await db.users.insert_one(user)
    user_id = str(user_result.inserted_id)
    
    # Update store owner_id
    await db.stores.update_one({"_id": store_result.inserted_id}, {"$set": {"owner_id": user_id}})
    
    # Create token
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_data.email,
            "store_id": store_id,
            "store_name": user_data.store_name
        }
    }

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    
    # Get store
    store = await db.stores.find_one({"_id": ObjectId(user["store_id"])})
    
    access_token = create_access_token(data={"sub": str(user["_id"])})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "store_id": user["store_id"],
            "store_name": store["name"] if store else ""
        }
    }

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    email: EmailStr
    reset_code: str
    new_password: str

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPassword):
    user = await db.users.find_one({"email": data.email})
    if not user:
        # Don't reveal if user exists
        return {"message": "Si el email existe, recibirás instrucciones de recuperación"}
    
    # Generate 6-digit code
    import random
    reset_code = str(random.randint(100000, 999999))
    
    # Store reset code with expiration (15 minutes)
    await db.password_resets.insert_one({
        "email": data.email,
        "code": reset_code,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=15),
        "used": False
    })
    
    # TODO: Send email/SMS/WhatsApp with reset code
    # For now, just return the code (ONLY FOR DEVELOPMENT)
    print(f"Reset code for {data.email}: {reset_code}")
    
    return {
        "message": "Si el email existe, recibirás instrucciones de recuperación",
        "reset_code": reset_code  # Remove in production
    }

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPassword):
    # Find valid reset code
    reset_request = await db.password_resets.find_one({
        "email": data.email,
        "code": data.reset_code,
        "used": False,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not reset_request:
        raise HTTPException(status_code=400, detail="Código inválido o expirado")
    
    # Update password
    hashed_password = get_password_hash(data.new_password)
    await db.users.update_one(
        {"email": data.email},
        {"$set": {"password": hashed_password}}
    )
    
    # Mark code as used
    await db.password_resets.update_one(
        {"_id": reset_request["_id"]},
        {"$set": {"used": True}}
    )
    
    return {"message": "Contraseña actualizada correctamente"}

# ==================== STORE ENDPOINTS ====================

@api_router.get("/stores/me")
async def get_my_store(current_user: dict = Depends(get_current_user)):
    store = await db.stores.find_one({"_id": ObjectId(current_user["store_id"])})
    if not store:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
    store["_id"] = str(store["_id"])
    return store

# ==================== CUSTOMER ENDPOINTS ====================

@api_router.post("/customers")
async def create_customer(customer: CustomerCreate, current_user: dict = Depends(get_current_user)):
    customer_dict = customer.dict()
    customer_dict["store_id"] = current_user["store_id"]
    customer_dict["created_at"] = datetime.utcnow()
    result = await db.customers.insert_one(customer_dict)
    customer_dict["_id"] = str(result.inserted_id)
    return customer_dict

@api_router.get("/customers")
async def get_customers():
    # Temporary: Use tiendaclave merchant
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        return []
    
    customers = await db.customers.find({"store_id": str(merchant["_id"])}).to_list(1000)
    for customer in customers:
        customer["_id"] = str(customer["_id"])
    return customers

@api_router.get("/customers/{customer_id}")
async def get_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one({"_id": ObjectId(customer_id), "store_id": current_user["store_id"]})
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    customer["_id"] = str(customer["_id"])
    return customer

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.customers.delete_one({"_id": ObjectId(customer_id), "store_id": current_user["store_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"message": "Cliente eliminado"}

@api_router.put("/customers/{customer_id}")
async def update_customer(customer_id: str, customer: CustomerUpdate, current_user: dict = Depends(get_current_user)):
    store_id = current_user["store_id"]
    
    update_dict = {k: v for k, v in customer.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    result = await db.customers.update_one(
        {"_id": ObjectId(customer_id), "store_id": store_id},
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    updated_customer = await db.customers.find_one({"_id": ObjectId(customer_id)})
    updated_customer["_id"] = str(updated_customer["_id"])
    return updated_customer

# ==================== SUPPLIER ENDPOINTS ====================

@api_router.post("/suppliers")
async def create_supplier(supplier: SupplierCreate, current_user: dict = Depends(get_current_user)):
    supplier_dict = supplier.dict()
    supplier_dict["store_id"] = current_user["store_id"]
    supplier_dict["created_at"] = datetime.utcnow()
    result = await db.suppliers.insert_one(supplier_dict)
    supplier_dict["_id"] = str(result.inserted_id)
    return supplier_dict

@api_router.get("/suppliers")
async def get_suppliers(current_user: dict = Depends(get_current_user)):
    suppliers = await db.suppliers.find({"store_id": current_user["store_id"]}).to_list(1000)
    for supplier in suppliers:
        supplier["_id"] = str(supplier["_id"])
    return suppliers

@api_router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.suppliers.delete_one({"_id": ObjectId(supplier_id), "store_id": current_user["store_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return {"message": "Proveedor eliminado"}

# ==================== EMPLOYEE ENDPOINTS ====================

@api_router.post("/employees")
async def create_employee(employee: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    employee_dict = employee.dict()
    employee_dict["store_id"] = current_user["store_id"]
    employee_dict["created_at"] = datetime.utcnow()
    result = await db.employees.insert_one(employee_dict)
    employee_dict["_id"] = str(result.inserted_id)
    return employee_dict

@api_router.get("/employees")
async def get_employees(current_user: dict = Depends(get_current_user)):
    employees = await db.employees.find({"store_id": current_user["store_id"]}).to_list(1000)
    for employee in employees:
        employee["_id"] = str(employee["_id"])
    return employees

@api_router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.employees.delete_one({"_id": ObjectId(employee_id), "store_id": current_user["store_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return {"message": "Empleado eliminado"}

# ==================== CATEGORY ENDPOINTS ====================

@api_router.post("/categories")
async def create_category(category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    category_dict = category.dict()
    category_dict["store_id"] = current_user["store_id"]
    category_dict["created_at"] = datetime.utcnow()
    result = await db.categories.insert_one(category_dict)
    category_dict["_id"] = str(result.inserted_id)
    return category_dict

@api_router.get("/categories")
async def get_categories(type: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"store_id": current_user["store_id"]}
    if type:
        query["type"] = type
    categories = await db.categories.find(query).to_list(1000)
    for category in categories:
        category["_id"] = str(category["_id"])
    return categories

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.categories.delete_one({"_id": ObjectId(category_id), "store_id": current_user["store_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return {"message": "Categoría eliminada"}

# ==================== PRODUCT ENDPOINTS ====================

@api_router.post("/products")
async def create_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    product_dict = product.dict()
    product_dict["store_id"] = current_user["store_id"]
    product_dict["created_at"] = datetime.utcnow()
    result = await db.products.insert_one(product_dict)
    product_dict["_id"] = str(result.inserted_id)
    return product_dict

@api_router.get("/products")
async def get_products():
    # Temporary: Use tiendaclave merchant
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        return []
    
    products = await db.products.find({"store_id": str(merchant["_id"])}).to_list(1000)
    for product in products:
        product["_id"] = str(product["_id"])
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"_id": ObjectId(product_id), "store_id": current_user["store_id"]})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    product["_id"] = str(product["_id"])
    return product

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, product: ProductUpdate, current_user: dict = Depends(get_current_user)):
    store_id = current_user["store_id"]
    
    update_dict = {k: v for k, v in product.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    result = await db.products.update_one(
        {"_id": ObjectId(product_id), "store_id": store_id},
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    updated_product = await db.products.find_one({"_id": ObjectId(product_id)})
    updated_product["_id"] = str(updated_product["_id"])
    return updated_product

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.products.delete_one({"_id": ObjectId(product_id), "store_id": current_user["store_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"message": "Producto eliminado"}

# ==================== SALE ENDPOINTS ====================

@api_router.post("/sales")
async def create_sale(sale: SaleCreate, current_user: dict = Depends(get_current_user)):
    sale_dict = sale.dict()
    sale_dict["store_id"] = current_user["store_id"]
    if not sale_dict.get("date"):
        sale_dict["date"] = datetime.utcnow()
    sale_dict["created_at"] = datetime.utcnow()
    sale_dict["synced"] = True
    
    # If sale with inventory, update product quantities
    if sale.with_inventory and sale.products:
        for product_sale in sale.products:
            await db.products.update_one(
                {"_id": ObjectId(product_sale.product_id), "store_id": current_user["store_id"]},
                {"$inc": {"quantity": -product_sale.quantity}}
            )
    
    # If not paid, create debt
    if not sale.paid and sale.customer_id:
        debt = {
            "store_id": current_user["store_id"],
            "type": "customer",
            "amount": sale.total,
            "customer_id": sale.customer_id,
            "related_name": sale.customer_name,
            "date": sale_dict["date"],
            "notes": f"Venta - {sale.notes or ''}",
            "paid": False,
            "synced": True,
            "created_at": datetime.utcnow()
        }
        await db.debts.insert_one(debt)
    
    result = await db.sales.insert_one(sale_dict)
    sale_dict["_id"] = str(result.inserted_id)
    return sale_dict

@api_router.get("/sales")
async def get_sales(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"store_id": current_user["store_id"]}
    
    if start_date or end_date:
        query["date"] = {}
        if start_date:
            query["date"]["$gte"] = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            query["date"]["$lte"] = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    
    sales = await db.sales.find(query).sort("date", -1).to_list(1000)
    for sale in sales:
        sale["_id"] = str(sale["_id"])
    return sales

@api_router.delete("/sales/{sale_id}")
async def delete_sale(sale_id: str, current_user: dict = Depends(get_current_user)):
    # Get sale first to revert inventory
    sale = await db.sales.find_one({"_id": ObjectId(sale_id), "store_id": current_user["store_id"]})
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    
    # Revert inventory if applicable
    if sale.get("with_inventory") and sale.get("products"):
        for product_sale in sale["products"]:
            await db.products.update_one(
                {"_id": ObjectId(product_sale["product_id"]), "store_id": current_user["store_id"]},
                {"$inc": {"quantity": product_sale["quantity"]}}
            )
    
    result = await db.sales.delete_one({"_id": ObjectId(sale_id)})
    return {"message": "Venta eliminada"}

# ==================== EXPENSE ENDPOINTS ====================

@api_router.post("/expenses")
async def create_expense(expense: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    expense_dict = expense.dict()
    expense_dict["store_id"] = current_user["store_id"]
    if not expense_dict.get("date"):
        expense_dict["date"] = datetime.utcnow()
    expense_dict["created_at"] = datetime.utcnow()
    expense_dict["synced"] = True
    
    # If product purchase with inventory, update product
    if expense.category == "Compra de productos" and expense.product_id:
        # This should ideally include quantity, but for simplicity we just log it
        pass
    
    # If not paid, create debt
    if not expense.paid and expense.supplier_id:
        debt = {
            "store_id": current_user["store_id"],
            "type": "supplier",
            "amount": expense.amount,
            "supplier_id": expense.supplier_id,
            "related_name": expense.supplier_name,
            "date": expense_dict["date"],
            "notes": f"Gasto - {expense.category}",
            "paid": False,
            "synced": True,
            "created_at": datetime.utcnow()
        }
        await db.debts.insert_one(debt)
    
    result = await db.expenses.insert_one(expense_dict)
    expense_dict["_id"] = str(result.inserted_id)
    return expense_dict

@api_router.get("/expenses")
async def get_expenses(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"store_id": current_user["store_id"]}
    
    if start_date or end_date:
        query["date"] = {}
        if start_date:
            query["date"]["$gte"] = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            query["date"]["$lte"] = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    
    expenses = await db.expenses.find(query).sort("date", -1).to_list(1000)
    for expense in expenses:
        expense["_id"] = str(expense["_id"])
    return expenses

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.expenses.delete_one({"_id": ObjectId(expense_id), "store_id": current_user["store_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return {"message": "Gasto eliminado"}

# ==================== DEBT ENDPOINTS ====================

@api_router.post("/debts")
async def create_debt(debt: DebtCreate, current_user: dict = Depends(get_current_user)):
    debt_dict = debt.dict()
    debt_dict["store_id"] = current_user["store_id"]
    if not debt_dict.get("date"):
        debt_dict["date"] = datetime.utcnow()
    debt_dict["created_at"] = datetime.utcnow()
    debt_dict["synced"] = True
    result = await db.debts.insert_one(debt_dict)
    debt_dict["_id"] = str(result.inserted_id)
    return debt_dict

@api_router.get("/debts")
async def get_debts(type: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"store_id": current_user["store_id"]}
    if type:
        query["type"] = type
    debts = await db.debts.find(query).sort("date", -1).to_list(1000)
    for debt in debts:
        debt["_id"] = str(debt["_id"])
    return debts

@api_router.put("/debts/{debt_id}/pay")
async def pay_debt(debt_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.debts.update_one(
        {"_id": ObjectId(debt_id), "store_id": current_user["store_id"]},
        {"$set": {"paid": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Deuda no encontrada")
    return {"message": "Deuda marcada como pagada"}

@api_router.delete("/debts/{debt_id}")
async def delete_debt(debt_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.debts.delete_one({"_id": ObjectId(debt_id), "store_id": current_user["store_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Deuda no encontrada")
    return {"message": "Deuda eliminada"}

# ==================== STOCK ALERTS ENDPOINTS ====================

@api_router.get("/alerts/low-stock")
async def get_low_stock_alerts():
    """Get all products with stock below their alert threshold"""
    # Temporary: Use tiendaclave merchant
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        return []
    
    # Get all products for this store (alert_enabled defaults to True if not set)
    products = await db.products.find({
        "store_id": str(merchant["_id"])
    }).to_list(1000)
    
    low_stock_products = []
    for product in products:
        # Only include if alert_enabled is True or not set (default True)
        alert_enabled = product.get("alert_enabled", True)
        min_stock_alert = product.get("min_stock_alert", product.get("stock_minimo", 10))
        stock = product.get("stock", product.get("quantity", 0))
        
        if alert_enabled and stock <= min_stock_alert:
            product["_id"] = str(product["_id"])
            product["alert_level"] = "critical" if stock == 0 else "warning"
            # Ensure min_stock_alert is always present in response
            product["min_stock_alert"] = min_stock_alert
            product["stock"] = stock  # Normalize field name
            low_stock_products.append(product)
    
    return low_stock_products

@api_router.put("/products/{product_id}/alert-settings")
async def update_alert_settings(
    product_id: str,
    min_stock_alert: float,
    alert_enabled: bool,
    current_user: dict = Depends(get_current_user)
):
    """Update alert settings for a product"""
    result = await db.products.update_one(
        {"_id": ObjectId(product_id), "store_id": current_user["store_id"]},
        {"$set": {
            "min_stock_alert": min_stock_alert,
            "alert_enabled": alert_enabled
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return {"message": "Configuración de alertas actualizada"}

# ==================== BALANCE/REPORTS ENDPOINTS ====================

@api_router.get("/balance")
async def get_balance(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    # TODO: Re-enable auth when fixed
    # current_user: dict = Depends(get_current_user)
):
    # Temporary: Use tiendaclave merchant
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    query = {"store_id": str(merchant["_id"])}
    
    date_filter = {}
    if start_date:
        date_filter["$gte"] = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    if end_date:
        date_filter["$lte"] = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    
    if date_filter:
        query["date"] = date_filter
    
    # Get sales
    sales = await db.sales.find(query).to_list(10000)
    total_sales = sum(sale["total"] for sale in sales if sale.get("paid", False))
    num_sales = len([s for s in sales if s.get("paid", False)])
    cash_sales = sum(sale["total"] for sale in sales if sale.get("paid", False) and sale.get("payment_method") == "Efectivo")
    other_sales = total_sales - cash_sales
    
    # Get expenses
    expenses = await db.expenses.find(query).to_list(10000)
    total_expenses = sum(expense["amount"] for expense in expenses if expense.get("paid", False))
    num_expenses = len([e for e in expenses if e.get("paid", False)])
    cash_expenses = sum(expense["amount"] for expense in expenses if expense.get("paid", False) and expense.get("payment_method") == "Efectivo")
    other_expenses = total_expenses - cash_expenses
    
    balance = total_sales - total_expenses
    
    return {
        "ingresos": total_sales,
        "egresos": total_expenses,
        "balance": balance,
        "resumen_ingresos": {
            "numero_ventas": num_sales,
            "pagos_efectivo": cash_sales,
            "otros_pagos": other_sales
        },
        "resumen_egresos": {
            "numero_gastos": num_expenses,
            "gastos_efectivo": cash_expenses,
            "otros_gastos": other_expenses
        }
    }

# Include the router in the main app
# ==================== NOTIFICATION SETTINGS ====================

class NotificationSettings(BaseModel):
    whatsapp_number: Optional[str] = None
    alert_email: Optional[str] = None
    expo_push_token: Optional[str] = None
    alerts_enabled: bool = True
    stock_alerts_enabled: bool = True
    daily_summary_enabled: bool = True
    weekly_summary_enabled: bool = True

# ==================== BUSINESS ANALYTICS ENDPOINT ====================

@api_router.get("/analytics/business")
async def get_business_analytics(
    days: int = 30
):
    """
    Obtiene analytics del negocio: producto top, mejores días, mejor cliente, tendencias
    """
    from datetime import timedelta
    from collections import Counter
    
    # Temporary: Use tiendaclave merchant
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    store_id = str(merchant["_id"])
    start_date = datetime.now() - timedelta(days=days)
    
    # Query ventas del período
    sales = await db.sales.find({
        "store_id": store_id,
        "date": {"$gte": start_date}
    }).to_list(10000)
    
    # Query clientes
    customers = await db.customers.find({"store_id": store_id}).to_list(1000)
    
    # Query productos
    products = await db.products.find({"store_id": store_id}).to_list(1000)
    products_dict = {str(p["_id"]): p for p in products}
    
    # 1. Producto más vendido
    product_sales = Counter()
    product_revenue = Counter()
    for sale in sales:
        for item in sale.get("products", []):
            product_id = item.get("product_id") or item.get("productId")
            quantity = item.get("quantity", 1)
            price = item.get("price", 0)
            if product_id:
                product_sales[product_id] += quantity
                product_revenue[product_id] += quantity * price
    
    top_product = None
    if product_sales:
        top_product_id = product_sales.most_common(1)[0][0]
        top_product_data = products_dict.get(top_product_id, {})
        top_product = {
            "id": top_product_id,
            "name": top_product_data.get("nombre", top_product_data.get("name", "Producto")),
            "units_sold": product_sales[top_product_id],
            "revenue": product_revenue.get(top_product_id, 0)
        }
    
    # 2. Mejor día de la semana
    day_sales = Counter()
    day_names = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    for sale in sales:
        sale_date = sale.get("date")
        if sale_date:
            day_of_week = sale_date.weekday()
            day_sales[day_of_week] += sale.get("total", 0)
    
    best_day = None
    if day_sales:
        best_day_num = day_sales.most_common(1)[0][0]
        best_day = {
            "day": day_names[best_day_num],
            "day_number": best_day_num,
            "total_sales": day_sales[best_day_num]
        }
    
    # 3. Mejor cliente
    customer_purchases = Counter()
    customers_dict = {str(c["_id"]): c for c in customers}
    for sale in sales:
        customer_id = sale.get("customer_id")
        if customer_id:
            customer_purchases[customer_id] += sale.get("total", 0)
    
    best_customer = None
    if customer_purchases:
        best_customer_id = customer_purchases.most_common(1)[0][0]
        customer_data = customers_dict.get(best_customer_id, {})
        nombre = customer_data.get("nombre", customer_data.get("name", ""))
        apellido = customer_data.get("apellido", customer_data.get("lastname", ""))
        best_customer = {
            "id": best_customer_id,
            "name": f"{nombre} {apellido}".strip() or "Cliente",
            "total_purchases": customer_purchases[best_customer_id],
            "purchase_count": sum(1 for s in sales if s.get("customer_id") == best_customer_id)
        }
    
    # 4. Tendencia de ventas (comparar con período anterior)
    previous_start = start_date - timedelta(days=days)
    previous_sales = await db.sales.find({
        "store_id": store_id,
        "date": {"$gte": previous_start, "$lt": start_date}
    }).to_list(10000)
    
    current_total = sum(s.get("total", 0) for s in sales)
    previous_total = sum(s.get("total", 0) for s in previous_sales)
    
    trend_percentage = 0
    if previous_total > 0:
        trend_percentage = ((current_total - previous_total) / previous_total) * 100
    
    trend = {
        "current_period": current_total,
        "previous_period": previous_total,
        "percentage_change": round(trend_percentage, 1),
        "direction": "up" if trend_percentage > 0 else "down" if trend_percentage < 0 else "stable"
    }
    
    # 5. Estadísticas generales
    total_sales_count = len(sales)
    total_revenue = sum(s.get("total", 0) for s in sales)
    avg_sale = total_revenue / total_sales_count if total_sales_count > 0 else 0
    
    # 6. Top 5 productos
    top_5_products = []
    for product_id, units in product_sales.most_common(5):
        product_data = products_dict.get(product_id, {})
        top_5_products.append({
            "id": product_id,
            "name": product_data.get("nombre", product_data.get("name", "Producto")),
            "units_sold": units,
            "revenue": product_revenue.get(product_id, 0)
        })
    
    return {
        "period_days": days,
        "top_product": top_product,
        "best_day": best_day,
        "best_customer": best_customer,
        "trend": trend,
        "top_5_products": top_5_products,
        "summary": {
            "total_sales": total_sales_count,
            "total_revenue": total_revenue,
            "average_sale": round(avg_sale, 2)
        }
    }

@api_router.get("/user/notification-settings")
async def get_notification_settings(current_user: dict = Depends(get_current_user)):
    """Get user's notification settings"""
    # current_user is already the full user object from get_current_user
    return {
        "whatsapp_number": current_user.get("whatsapp_number"),
        "alert_email": current_user.get("alert_email"),
        "expo_push_token": current_user.get("expo_push_token"),
        "alerts_enabled": current_user.get("alerts_enabled", True),
        "stock_alerts_enabled": current_user.get("stock_alerts_enabled", True),
        "daily_summary_enabled": current_user.get("daily_summary_enabled", True),
        "weekly_summary_enabled": current_user.get("weekly_summary_enabled", True),
    }

@api_router.post("/user/notification-settings")
async def update_notification_settings(
    settings: NotificationSettings,
    current_user: dict = Depends(get_current_user)
):
    """Update user's notification settings"""
    update_data = settings.dict(exclude_unset=True)
    
    result = await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Settings updated successfully"}

@api_router.post("/alerts/test")
async def test_alerts(current_user: dict = Depends(get_current_user)):
    """Send test notifications to user"""
    from services.twilio_service import twilio_service
    from services.sendgrid_service import sendgrid_service
    from services.expo_push_service import expo_push_service
    
    # current_user is already the full user object
    user = current_user
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    results = {
        "whatsapp": None,
        "email": None,
        "push": None
    }
    
    # Test WhatsApp
    if user.get("whatsapp_number"):
        whatsapp_result = twilio_service.send_whatsapp(
            user["whatsapp_number"],
            "🎉 ¡Prueba exitosa! Tu número de WhatsApp está configurado correctamente en Yappa."
        )
        results["whatsapp"] = whatsapp_result
    
    # Email temporarily disabled
    # if user.get("alert_email"):
    #     email_result = sendgrid_service.send_email(
    #         user["alert_email"],
    #         "✅ Prueba de Alertas - Yappa",
    #         """
    #         <html>
    #             <body style="font-family: Arial, sans-serif; padding: 20px;">
    #                 <h2 style="color: #4CAF50;">¡Prueba Exitosa! ✅</h2>
    #                 <p>Tu email está configurado correctamente para recibir alertas de Yappa.</p>
    #                 <p>Recibirás notificaciones sobre:</p>
    #                 <ul>
    #                     <li>📦 Stock bajo</li>
    #                     <li>📊 Resumen diario de ventas</li>
    #                     <li>📈 Resumen semanal</li>
    #                     <li>💰 Recordatorios de deudas</li>
    #                 </ul>
    #             </body>
    #         </html>
    #         """
    #     )
    #     results["email"] = email_result
    results["email"] = {"success": False, "error": "Email temporalmente desactivado"}
    
    # Test Push Notification
    if user.get("expo_push_token"):
        push_result = expo_push_service.send_push_notification(
            user["expo_push_token"],
            "✅ Prueba Exitosa",
            "Las notificaciones push están configuradas correctamente.",
            {"type": "test"}
        )
        results["push"] = push_result
    
    return {
        "message": "Test notifications sent",
        "results": results
    }

# ==================== AI INSIGHTS ====================

@api_router.post("/insights/generate")
async def generate_insights(current_user: dict = Depends(get_current_user)):
    """Generate AI-powered business insights"""
    from services.ai_insights_service import ai_insights_service
    from datetime import datetime, timedelta
    
    try:
        store_id = str(current_user.get("store_id"))
        
        # Get last 30 days of data
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        # Fetch sales data
        sales = await db.sales.find({
            "store_id": store_id,
            "created_at": {"$gte": thirty_days_ago}
        }).to_list(1000)
        
        # Fetch expenses data
        expenses = await db.expenses.find({
            "store_id": store_id,
            "created_at": {"$gte": thirty_days_ago}
        }).to_list(1000)
        
        # Fetch products
        products = await db.products.find({
            "store_id": store_id
        }).to_list(1000)
        
        # Fetch customers
        customers = await db.customers.find({
            "store_id": store_id
        }).to_list(1000)
        
        # Generate insights
        insights = await ai_insights_service.generate_business_insights(
            sales, expenses, products, customers
        )
        
        if not insights.get('success'):
            raise HTTPException(status_code=500, detail=insights.get('error', 'Error generating insights'))
        
        # Save to database
        insight_doc = {
            "store_id": store_id,
            "user_id": str(current_user["_id"]),
            "insights": insights.get('insights'),
            "metrics": insights.get('metrics'),
            "generated_at": datetime.now(),
            "period_days": 30
        }
        
        result = await db.insights.insert_one(insight_doc)
        
        # Return with proper string IDs
        return {
            "_id": str(result.inserted_id),
            "store_id": store_id,
            "user_id": str(current_user["_id"]),
            "insights": insights.get('insights'),
            "metrics": insights.get('metrics'),
            "generated_at": datetime.now().isoformat(),
            "period_days": 30
        }
    
    except Exception as e:
        logger.error(f"Error generating insights: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/insights/latest")
async def get_latest_insight(current_user: dict = Depends(get_current_user)):
    """Get the most recent insight report"""
    store_id = str(current_user.get("store_id"))
    
    insight = await db.insights.find_one(
        {"store_id": store_id},
        sort=[("generated_at", -1)]
    )
    
    if not insight:
        raise HTTPException(status_code=404, detail="No insights found. Generate your first report!")
    
    insight["_id"] = str(insight["_id"])
    insight["user_id"] = str(insight["user_id"])
    
    return insight

@api_router.get("/insights/history")
async def get_insights_history(
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get historical insight reports"""
    store_id = str(current_user.get("store_id"))
    
    insights = await db.insights.find(
        {"store_id": store_id},
        sort=[("generated_at", -1)],
        limit=limit
    ).to_list(limit)
    
    for insight in insights:
        insight["_id"] = str(insight["_id"])
        insight["user_id"] = str(insight["user_id"])
    
    return insights

@api_router.post("/insights/send-whatsapp")
async def send_insight_to_whatsapp(current_user: dict = Depends(get_current_user)):
    """Send latest insight report via WhatsApp"""
    from services.twilio_service import twilio_service
    from services.ai_insights_service import ai_insights_service
    import logging
    
    logger = logging.getLogger(__name__)
    
    try:
        # Check if user has WhatsApp configured
        if not current_user.get("whatsapp_number"):
            raise HTTPException(
                status_code=400, 
                detail="No tienes configurado tu número de WhatsApp. Ve a Configuración para agregarlo."
            )
        
        # Get latest insight
        store_id = str(current_user.get("store_id"))
        insight = await db.insights.find_one(
            {"store_id": store_id},
            sort=[("generated_at", -1)]
        )
        
        if not insight:
            raise HTTPException(status_code=404, detail="No hay reportes para enviar. Genera uno primero.")
        
        # Format for WhatsApp
        message = ai_insights_service.format_insights_for_whatsapp(
            {"success": True, "insights": insight.get("insights")}
        )
        
        logger.info(f"Sending WhatsApp to {current_user['whatsapp_number']}")
        logger.info(f"Message length: {len(message)} characters")
        
        # Send via WhatsApp
        result = twilio_service.send_whatsapp(current_user["whatsapp_number"], message)
        
        logger.info(f"WhatsApp send result: {result}")
        
        if not result.get('success'):
            error_msg = result.get('error', 'Error desconocido')
            logger.error(f"WhatsApp send failed: {error_msg}")
            raise HTTPException(
                status_code=500, 
                detail=f"Error al enviar WhatsApp: {error_msg}"
            )
        
        return {
            "success": True,
            "message": "Reporte enviado a WhatsApp correctamente",
            "whatsapp_number": current_user["whatsapp_number"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error sending WhatsApp: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error inesperado: {str(e)}"
        )


# ==================== ADMIN CONSOLE ENDPOINTS ====================

@api_router.get("/admin/my-merchants")
async def get_my_merchants(current_user: dict = Depends(get_current_user)):
    """
    Get all merchants for the current admin.
    Used for the merchant filter dropdown in Admin Console.
    """
    admin_id = current_user.get("admin_id")
    
    if not admin_id:
        # If no admin_id, the user might be a single-merchant admin
        # Return just their own merchant
        return {
            "merchants": [{
                "id": current_user["store_id"],
                "name": current_user.get("username", "Mi Tienda"),
                "is_current": True
            }],
            "has_multiple": False
        }
    
    # Get all merchants for this admin
    merchants = await db.merchants.find({"admin_id": admin_id}).to_list(1000)
    
    merchants_list = []
    for m in merchants:
        merchants_list.append({
            "id": str(m["_id"]),
            "name": m.get("business_name") or m.get("username") or "Sin nombre",
            "is_current": str(m["_id"]) == current_user["store_id"]
        })
    
    # Sort alphabetically, but put current first
    merchants_list.sort(key=lambda x: (not x["is_current"], x["name"].lower()))
    
    return {
        "merchants": merchants_list,
        "has_multiple": len(merchants_list) > 1
    }

@api_router.get("/admin/analytics")
async def get_admin_analytics(
    current_user: dict = Depends(get_current_user),
    merchant_id: Optional[str] = None
):
    """
    Get analytics for admin console dashboard.
    If merchant_id is provided, filter by that merchant.
    If not provided, show aggregate data for all merchants of the admin.
    """
    admin_id = current_user.get("admin_id")
    
    # Determine which store_ids to query
    if merchant_id:
        # Filter by specific merchant
        store_ids = [merchant_id]
    elif admin_id:
        # Get all merchants for this admin
        merchants = await db.merchants.find({"admin_id": admin_id}).to_list(1000)
        store_ids = [str(m["_id"]) for m in merchants]
    else:
        # Single merchant admin
        store_ids = [current_user["store_id"]]
    
    # Build query filter for store_id
    store_filter = {"store_id": {"$in": store_ids}} if len(store_ids) > 1 else {"store_id": store_ids[0]}
    
    # Get date ranges
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    week_start = today_start - timedelta(days=7)
    month_start = datetime(now.year, now.month, 1)
    
    # Total products - using store_filter for multi-merchant support
    total_products = await db.products.count_documents(store_filter)
    low_stock_query = {**store_filter, "$expr": {"$lte": ["$quantity", "$min_stock_alert"]}, "alert_enabled": True}
    low_stock_count = await db.products.count_documents(low_stock_query)
    
    # Sales analytics - Include paid=True and paid=None (legacy data) but exclude paid=False
    sales_today = await db.sales.find({
        **store_filter,
        "date": {"$gte": today_start},
        "paid": {"$ne": False}  # Include True and None
    }).to_list(10000)
    
    sales_week = await db.sales.find({
        **store_filter,
        "date": {"$gte": week_start},
        "paid": {"$ne": False}
    }).to_list(10000)
    
    sales_month = await db.sales.find({
        **store_filter,
        "date": {"$gte": month_start},
        "paid": {"$ne": False}
    }).to_list(10000)
    
    total_sales_today = sum(s.get("total", 0) for s in sales_today)
    total_sales_week = sum(s.get("total", 0) for s in sales_week)
    total_sales_month = sum(s.get("total", 0) for s in sales_month)
    
    # Expenses analytics - Include paid=True and paid=None
    expenses_month = await db.expenses.find({
        **store_filter,
        "date": {"$gte": month_start},
        "paid": {"$ne": False}
    }).to_list(10000)
    
    total_expenses_month = sum(e.get("amount", 0) for e in expenses_month)
    
    # Customers and suppliers count
    total_customers = await db.customers.count_documents(store_filter)
    total_suppliers = await db.suppliers.count_documents(store_filter)
    
    # Debts
    pending_debts = await db.debts.find({
        **store_filter,
        "paid": False
    }).to_list(10000)
    
    total_pending_debts = sum(d.get("amount", 0) for d in pending_debts)
    
    # Top selling products (this month) - Handle both 'products' and 'items' field names
    product_sales = {}
    for sale in sales_month:
        # Support both 'products' and 'items' field names
        sale_items = sale.get("products") or sale.get("items") or []
        for product in sale_items:
            # Support different field naming conventions
            pid = product.get("product_id") or product.get("productId") or product.get("id")
            pname = product.get("product_name") or product.get("productName") or product.get("name") or product.get("nombre") or "Producto"
            qty = product.get("quantity") or product.get("qty") or product.get("cantidad") or 1
            item_total = product.get("total") or product.get("subtotal") or (product.get("price", 0) * qty)
            
            if pid:
                if pid not in product_sales:
                    product_sales[pid] = {
                        "product_id": pid,
                        "product_name": pname,
                        "quantity_sold": 0,
                        "revenue": 0
                    }
                product_sales[pid]["quantity_sold"] += qty
                product_sales[pid]["revenue"] += item_total
    
    top_products = sorted(product_sales.values(), key=lambda x: x["revenue"], reverse=True)[:5]
    
    return {
        "products": {
            "total": total_products,
            "low_stock": low_stock_count
        },
        "sales": {
            "today": total_sales_today,
            "week": total_sales_week,
            "month": total_sales_month,
            "count_today": len(sales_today),
            "count_week": len(sales_week),
            "count_month": len(sales_month)
        },
        "expenses": {
            "month": total_expenses_month
        },
        "balance": {
            "month": total_sales_month - total_expenses_month
        },
        "customers": total_customers,
        "suppliers": total_suppliers,
        "debts": {
            "total": total_pending_debts,
            "count": len(pending_debts)
        },
        "top_products": top_products
    }

class BulkProductUpload(BaseModel):
    products: List[dict]

@api_router.post("/admin/products/bulk-upload")
async def bulk_upload_products(
    upload_data: BulkProductUpload,
    current_user: dict = Depends(get_current_user)
):
    """Bulk upload products from CSV"""
    store_id = current_user["store_id"]
    
    created_count = 0
    updated_count = 0
    errors = []
    
    for idx, product_data in enumerate(upload_data.products):
        try:
            # Validate required fields
            if not product_data.get("name"):
                errors.append(f"Row {idx + 1}: Name is required")
                continue
            
            # Check if product exists by name
            existing = await db.products.find_one({
                "store_id": store_id,
                "name": product_data["name"]
            })
            
            # Prepare product document
            product_doc = {
                "store_id": store_id,
                "name": product_data["name"],
                "quantity": float(product_data.get("quantity", 0)),
                "price": float(product_data.get("price", 0)),
                "cost": float(product_data.get("cost", 0)),
                "min_stock_alert": float(product_data.get("min_stock_alert", 10)),
                "alert_enabled": product_data.get("alert_enabled", True),
                "description": product_data.get("description", ""),
                "image": product_data.get("image", None),
            }
            
            # Handle category
            if product_data.get("category"):
                # Find or create category
                category = await db.categories.find_one({
                    "store_id": store_id,
                    "name": product_data["category"],
                    "type": "product"
                })
                if not category:
                    cat_result = await db.categories.insert_one({
                        "store_id": store_id,
                        "name": product_data["category"],
                        "type": "product",
                        "created_at": datetime.utcnow()
                    })
                    product_doc["category_id"] = str(cat_result.inserted_id)
                else:
                    product_doc["category_id"] = str(category["_id"])
            
            if existing:
                # Update existing product
                await db.products.update_one(
                    {"_id": existing["_id"]},
                    {"$set": product_doc}
                )
                updated_count += 1
            else:
                # Create new product
                product_doc["created_at"] = datetime.utcnow()
                await db.products.insert_one(product_doc)
                created_count += 1
                
        except Exception as e:
            errors.append(f"Row {idx + 1}: {str(e)}")
    
    return {
        "success": True,
        "created": created_count,
        "updated": updated_count,
        "errors": errors,
        "total_processed": len(upload_data.products)
    }

@api_router.get("/admin/products/template")
async def get_bulk_upload_template():
    """Get CSV template for bulk product upload"""
    return {
        "headers": [
            "name",
            "quantity",
            "price",
            "cost",
            "category",
            "min_stock_alert",
            "alert_enabled",
            "description"
        ],
        "example": {
            "name": "Coca Cola 2L",
            "quantity": "50",
            "price": "2.50",
            "cost": "1.80",
            "category": "Bebidas",
            "min_stock_alert": "10",
            "alert_enabled": "true",
            "description": "Gaseosa Coca Cola 2 litros"
        }
    }

# ==================== ADVANCED ANALYTICS ENDPOINTS ====================

@api_router.get("/admin/products/analytics")
async def get_products_analytics(current_user: dict = Depends(get_current_user)):
    """Get detailed product analytics with profitability, margin, rotation"""
    store_id = current_user["store_id"]
    
    # Get all products
    products = await db.products.find({"store_id": store_id}).to_list(1000)
    
    # Get sales for product analysis
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    sales = await db.sales.find({
        "store_id": store_id,
        "date": {"$gte": thirty_days_ago},
        "paid": True
    }).to_list(5000)
    
    # Calculate metrics per product
    product_metrics = {}
    for product in products:
        pid = str(product["_id"])
        product_metrics[pid] = {
            "_id": pid,
            "name": product["name"],
            "current_stock": product["quantity"],
            "price": product["price"],
            "cost": product["cost"],
            "margin": ((product["price"] - product["cost"]) / product["price"] * 100) if product["price"] > 0 else 0,
            "profit_per_unit": product["price"] - product["cost"],
            "units_sold": 0,
            "revenue": 0,
            "profit": 0,
            "days_to_stockout": None
        }
    
    # Aggregate sales data
    for sale in sales:
        for item in sale.get("products", []):
            pid = item["product_id"]
            if pid in product_metrics:
                product_metrics[pid]["units_sold"] += item["quantity"]
                product_metrics[pid]["revenue"] += item["total"]
                product_metrics[pid]["profit"] += item["total"] - (item["quantity"] * product_metrics[pid]["cost"])
    
    # Calculate rotation and predictions
    for pid, metrics in product_metrics.items():
        if metrics["units_sold"] > 0:
            daily_avg = metrics["units_sold"] / 30
            if daily_avg > 0 and metrics["current_stock"] > 0:
                metrics["days_to_stockout"] = int(metrics["current_stock"] / daily_avg)
            metrics["rotation_rate"] = daily_avg
        else:
            metrics["rotation_rate"] = 0
    
    # Sort by different criteria
    by_profit = sorted(product_metrics.values(), key=lambda x: x["profit"], reverse=True)[:10]
    by_margin = sorted(product_metrics.values(), key=lambda x: x["margin"], reverse=True)[:10]
    low_margin = sorted([p for p in product_metrics.values() if p["margin"] < 20], key=lambda x: x["margin"])[:10]
    stockout_soon = sorted([p for p in product_metrics.values() if p["days_to_stockout"] and p["days_to_stockout"] <= 7], key=lambda x: x["days_to_stockout"])
    
    return {
        "top_by_profit": by_profit,
        "top_by_margin": by_margin,
        "low_margin_alert": low_margin,
        "stockout_predictions": stockout_soon,
        "total_products": len(products),
        "avg_margin": sum(p["margin"] for p in product_metrics.values()) / len(product_metrics) if product_metrics else 0
    }

@api_router.get("/admin/customers/analytics")
async def get_customers_analytics(current_user: dict = Depends(get_current_user)):
    """Get detailed customer analytics"""
    store_id = current_user["store_id"]
    
    # Get all customers
    customers = await db.customers.find({"store_id": store_id}).to_list(1000)
    
    # Get sales and debts
    sales = await db.sales.find({"store_id": store_id, "paid": True}).to_list(5000)
    debts = await db.debts.find({"store_id": store_id, "type": "customer"}).to_list(1000)
    
    # Calculate metrics per customer
    customer_metrics = {}
    for customer in customers:
        cid = str(customer["_id"])
        customer_metrics[cid] = {
            "_id": cid,
            "name": f"{customer['name']} {customer['lastname']}",
            "phone": customer.get("phone", ""),
            "email": customer.get("email", ""),
            "total_revenue": 0,
            "total_purchases": 0,
            "avg_purchase": 0,
            "pending_debt": 0,
            "last_purchase": None,
            "days_since_purchase": None
        }
    
    # Aggregate sales
    for sale in sales:
        if sale.get("customer_id"):
            cid = sale["customer_id"]
            if cid in customer_metrics:
                customer_metrics[cid]["total_revenue"] += sale["total"]
                customer_metrics[cid]["total_purchases"] += 1
                if not customer_metrics[cid]["last_purchase"] or sale["date"] > customer_metrics[cid]["last_purchase"]:
                    customer_metrics[cid]["last_purchase"] = sale["date"]
    
    # Calculate avg and days since
    now = datetime.utcnow()
    for cid, metrics in customer_metrics.items():
        if metrics["total_purchases"] > 0:
            metrics["avg_purchase"] = metrics["total_revenue"] / metrics["total_purchases"]
        if metrics["last_purchase"]:
            metrics["days_since_purchase"] = (now - metrics["last_purchase"]).days
    
    # Aggregate debts
    for debt in debts:
        if debt.get("customer_id") and not debt.get("paid", False):
            cid = debt["customer_id"]
            if cid in customer_metrics:
                customer_metrics[cid]["pending_debt"] += debt["amount"]
    
    # Sort and analyze
    top_by_revenue = sorted(customer_metrics.values(), key=lambda x: x["total_revenue"], reverse=True)[:10]
    with_debts = sorted([c for c in customer_metrics.values() if c["pending_debt"] > 0], key=lambda x: x["pending_debt"], reverse=True)
    inactive = sorted([c for c in customer_metrics.values() if c["days_since_purchase"] and c["days_since_purchase"] > 30], key=lambda x: x["days_since_purchase"], reverse=True)[:10]
    
    return {
        "top_customers": top_by_revenue,
        "customers_with_debts": with_debts,
        "inactive_customers": inactive,
        "total_customers": len(customers),
        "total_debt": sum(c["pending_debt"] for c in customer_metrics.values()),
        "avg_revenue_per_customer": sum(c["total_revenue"] for c in customer_metrics.values()) / len(customer_metrics) if customer_metrics else 0
    }

@api_router.get("/admin/suppliers/analytics")
async def get_suppliers_analytics(current_user: dict = Depends(get_current_user)):
    """Get detailed supplier analytics"""
    store_id = current_user["store_id"]
    
    # Get all suppliers
    suppliers = await db.suppliers.find({"store_id": store_id}).to_list(1000)
    
    # Get expenses and debts
    expenses = await db.expenses.find({"store_id": store_id, "paid": True}).to_list(5000)
    debts = await db.debts.find({"store_id": store_id, "type": "supplier"}).to_list(1000)
    
    # Calculate metrics per supplier
    supplier_metrics = {}
    for supplier in suppliers:
        sid = str(supplier["_id"])
        supplier_metrics[sid] = {
            "_id": sid,
            "name": supplier["name"],
            "phone": supplier.get("phone", ""),
            "email": supplier.get("email", ""),
            "total_spent": 0,
            "total_transactions": 0,
            "avg_transaction": 0,
            "pending_debt": 0,
            "last_transaction": None
        }
    
    # Aggregate expenses
    for expense in expenses:
        if expense.get("supplier_id"):
            sid = expense["supplier_id"]
            if sid in supplier_metrics:
                supplier_metrics[sid]["total_spent"] += expense["amount"]
                supplier_metrics[sid]["total_transactions"] += 1
                if not supplier_metrics[sid]["last_transaction"] or expense["date"] > supplier_metrics[sid]["last_transaction"]:
                    supplier_metrics[sid]["last_transaction"] = expense["date"]
    
    # Calculate averages
    for sid, metrics in supplier_metrics.items():
        if metrics["total_transactions"] > 0:
            metrics["avg_transaction"] = metrics["total_spent"] / metrics["total_transactions"]
    
    # Aggregate debts
    for debt in debts:
        if debt.get("supplier_id") and not debt.get("paid", False):
            sid = debt["supplier_id"]
            if sid in supplier_metrics:
                supplier_metrics[sid]["pending_debt"] += debt["amount"]
    
    top_by_spending = sorted(supplier_metrics.values(), key=lambda x: x["total_spent"], reverse=True)[:10]
    with_debts = sorted([s for s in supplier_metrics.values() if s["pending_debt"] > 0], key=lambda x: x["pending_debt"], reverse=True)
    
    return {
        "top_suppliers": top_by_spending,
        "suppliers_with_debts": with_debts,
        "total_suppliers": len(suppliers),
        "total_debt_to_suppliers": sum(s["pending_debt"] for s in supplier_metrics.values()),
        "total_spent": sum(s["total_spent"] for s in supplier_metrics.values())
    }

@api_router.get("/admin/comparisons")
async def get_period_comparisons(
    current_user: dict = Depends(get_current_user),
    merchant_id: Optional[str] = None
):
    """Get week-over-week and month-over-month comparisons"""
    admin_id = current_user.get("admin_id")
    
    # Determine which store_ids to query
    if merchant_id:
        store_ids = [merchant_id]
    elif admin_id:
        merchants = await db.merchants.find({"admin_id": admin_id}).to_list(1000)
        store_ids = [str(m["_id"]) for m in merchants]
    else:
        store_ids = [current_user["store_id"]]
    
    store_filter = {"store_id": {"$in": store_ids}} if len(store_ids) > 1 else {"store_id": store_ids[0]}
    
    now = datetime.utcnow()
    
    # Define periods
    this_week_start = now - timedelta(days=now.weekday())
    last_week_start = this_week_start - timedelta(days=7)
    this_month_start = datetime(now.year, now.month, 1)
    if now.month == 1:
        last_month_start = datetime(now.year - 1, 12, 1)
        last_month_end = datetime(now.year, 1, 1)
    else:
        last_month_start = datetime(now.year, now.month - 1, 1)
        last_month_end = this_month_start
    
    # Get sales - Include paid=True and paid=None (legacy data) but exclude paid=False
    this_week_sales = await db.sales.find({
        **store_filter,
        "date": {"$gte": this_week_start},
        "paid": {"$ne": False}
    }).to_list(10000)
    
    last_week_sales = await db.sales.find({
        **store_filter,
        "date": {"$gte": last_week_start, "$lt": this_week_start},
        "paid": {"$ne": False}
    }).to_list(10000)
    
    this_month_sales = await db.sales.find({
        **store_filter,
        "date": {"$gte": this_month_start},
        "paid": {"$ne": False}
    }).to_list(10000)
    
    last_month_sales = await db.sales.find({
        **store_filter,
        "date": {"$gte": last_month_start, "$lt": last_month_end},
        "paid": {"$ne": False}
    }).to_list(10000)
    
    # Calculate totals
    this_week_total = sum(s["total"] for s in this_week_sales)
    last_week_total = sum(s["total"] for s in last_week_sales)
    this_month_total = sum(s["total"] for s in this_month_sales)
    last_month_total = sum(s["total"] for s in last_month_sales)
    
    # Calculate changes
    week_change = ((this_week_total - last_week_total) / last_week_total * 100) if last_week_total > 0 else 0
    month_change = ((this_month_total - last_month_total) / last_month_total * 100) if last_month_total > 0 else 0
    
    # Day of week analysis
    day_of_week_sales = {}
    for sale in this_month_sales:
        day_name = sale["date"].strftime("%A")
        if day_name not in day_of_week_sales:
            day_of_week_sales[day_name] = 0
        day_of_week_sales[day_name] += sale["total"]
    
    best_day = max(day_of_week_sales.items(), key=lambda x: x[1]) if day_of_week_sales else ("N/A", 0)
    worst_day = min(day_of_week_sales.items(), key=lambda x: x[1]) if day_of_week_sales else ("N/A", 0)
    
    # Average sale
    avg_sale = this_month_total / len(this_month_sales) if this_month_sales else 0
    
    # Peak hour analysis
    hour_sales = {}
    for sale in this_month_sales:
        hour = sale["date"].hour
        if hour not in hour_sales:
            hour_sales[hour] = 0
        hour_sales[hour] += 1
    
    peak_hour = max(hour_sales.items(), key=lambda x: x[1])[0] if hour_sales else 12
    
    # Translate day names to Spanish
    day_translation = {
        "Monday": "Lunes",
        "Tuesday": "Martes",
        "Wednesday": "Miércoles",
        "Thursday": "Jueves",
        "Friday": "Viernes",
        "Saturday": "Sábado",
        "Sunday": "Domingo"
    }
    
    return {
        "weekly": {
            "this_week": this_week_total,
            "last_week": last_week_total,
            "change_percent": week_change,
            "change_amount": this_week_total - last_week_total
        },
        "monthly": {
            "this_month": this_month_total,
            "last_month": last_month_total,
            "change_percent": month_change,
            "change_amount": this_month_total - last_month_total
        },
        "seasonality": {
            "by_day_of_week": {day_translation.get(k, k): v for k, v in day_of_week_sales.items()},
            "best_day": {"day": day_translation.get(best_day[0], best_day[0]), "total": best_day[1]},
            "worst_day": {"day": day_translation.get(worst_day[0], worst_day[0]), "total": worst_day[1]},
            "avg_sale": avg_sale,
            "peak_hour": peak_hour,
            "total_transactions": len(this_month_sales)
        }
    }

# Bulk upload for customers
class BulkCustomerUpload(BaseModel):
    customers: List[dict]

@api_router.post("/admin/customers/bulk-upload")
async def bulk_upload_customers(
    upload_data: BulkCustomerUpload,
    current_user: dict = Depends(get_current_user)
):
    """Bulk upload customers from CSV"""
    store_id = current_user["store_id"]
    created_count = 0
    updated_count = 0
    errors = []
    
    for idx, customer_data in enumerate(upload_data.customers):
        try:
            if not customer_data.get("name"):
                errors.append(f"Row {idx + 1}: Name is required")
                continue
            
            # Check if exists by name
            existing = await db.customers.find_one({
                "store_id": store_id,
                "name": customer_data["name"],
                "lastname": customer_data.get("lastname", "")
            })
            
            customer_doc = {
                "store_id": store_id,
                "name": customer_data["name"],
                "lastname": customer_data.get("lastname", ""),
                "phone": customer_data.get("phone", ""),
                "email": customer_data.get("email", ""),
            }
            
            if existing:
                await db.customers.update_one({"_id": existing["_id"]}, {"$set": customer_doc})
                updated_count += 1
            else:
                customer_doc["created_at"] = datetime.utcnow()
                await db.customers.insert_one(customer_doc)
                created_count += 1
        except Exception as e:
            errors.append(f"Row {idx + 1}: {str(e)}")
    
    return {
        "success": True,
        "created": created_count,
        "updated": updated_count,
        "errors": errors,
        "total_processed": len(upload_data.customers)
    }

# Bulk upload for suppliers
class BulkSupplierUpload(BaseModel):
    suppliers: List[dict]

@api_router.post("/admin/suppliers/bulk-upload")
async def bulk_upload_suppliers(
    upload_data: BulkSupplierUpload,
    current_user: dict = Depends(get_current_user)
):
    """Bulk upload suppliers from CSV"""
    store_id = current_user["store_id"]
    created_count = 0
    updated_count = 0
    errors = []
    
    for idx, supplier_data in enumerate(upload_data.suppliers):
        try:
            if not supplier_data.get("name"):
                errors.append(f"Row {idx + 1}: Name is required")
                continue
            
            existing = await db.suppliers.find_one({
                "store_id": store_id,
                "name": supplier_data["name"]
            })
            
            supplier_doc = {
                "store_id": store_id,
                "name": supplier_data["name"],
                "phone": supplier_data.get("phone", ""),
                "email": supplier_data.get("email", ""),
                "type": supplier_data.get("type", ""),
                "tax_id": supplier_data.get("tax_id", ""),
            }
            
            if existing:
                await db.suppliers.update_one({"_id": existing["_id"]}, {"$set": supplier_doc})
                updated_count += 1
            else:
                supplier_doc["created_at"] = datetime.utcnow()
                await db.suppliers.insert_one(supplier_doc)
                created_count += 1
        except Exception as e:
            errors.append(f"Row {idx + 1}: {str(e)}")
    
    return {
        "success": True,
        "created": created_count,
        "updated": updated_count,
        "errors": errors,
        "total_processed": len(upload_data.suppliers)
    }

# ==================== SUPPORT ENDPOINTS ====================

class SupportTicket(BaseModel):
    subject: str
    message: str
    priority: str = "medium"
    contact_method: str = "email"

@api_router.post("/support/ticket")
async def create_support_ticket(
    ticket: SupportTicket,
    current_user: dict = Depends(get_current_user)
):
    """Create a support ticket"""
    ticket_doc = {
        "user_id": str(current_user["_id"]),
        "store_id": current_user["store_id"],
        "user_email": current_user["email"],
        "subject": ticket.subject,
        "message": ticket.message,
        "priority": ticket.priority,
        "contact_method": ticket.contact_method,
        "status": "open",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.support_tickets.insert_one(ticket_doc)
    
    # TODO: Send notification to support team
    # For now, just log it
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"New support ticket created: {ticket.subject} from {current_user['email']}")
    
    return {
        "success": True,
        "ticket_id": str(result.inserted_id),
        "message": "Tu solicitud ha sido recibida. Te contactaremos pronto."
    }

@api_router.get("/support/tickets")
async def get_user_tickets(current_user: dict = Depends(get_current_user)):
    """Get all support tickets for current user"""
    tickets = await db.support_tickets.find({
        "user_id": str(current_user["_id"])
    }).sort("created_at", -1).to_list(50)
    
    for ticket in tickets:
        ticket["_id"] = str(ticket["_id"])
    
    return tickets

# ==================== WHATSAPP WEBHOOK ENDPOINTS ====================

from fastapi import Form, Response
from services.whatsapp_conversation_service import get_whatsapp_conversation_service
from services.twilio_service import twilio_service

@api_router.post("/whatsapp/webhook")
async def whatsapp_webhook(
    From: str = Form(...),
    Body: str = Form(None),
    MediaUrl0: str = Form(None),
    NumMedia: int = Form(0)
):
    """Webhook to receive WhatsApp messages from Twilio"""
    
    try:
        # Extract phone number (remove 'whatsapp:' prefix)
        user_phone = From.replace("whatsapp:", "")
        
        # Find user by phone number
        user = await db.users.find_one({"whatsapp_number": user_phone})
        
        if not user:
            # Send error message
            twilio_service.send_whatsapp(
                user_phone,
                "❌ Tu número no está registrado en Yappa. Por favor regístrate primero en el app."
            )
            return Response(content="", media_type="application/xml")
        
        store_id = user["store_id"]
        
        # Get conversation service
        conv_service = get_whatsapp_conversation_service(db)
        
        # Handle audio messages (temporarily disabled)
        if NumMedia > 0 and MediaUrl0:
            twilio_service.send_whatsapp(
                user_phone,
                "🎤 Las notas de voz están temporalmente deshabilitadas.\n\nPor favor, escribe tu mensaje de texto.\n\nEjemplo: 'venta' o 'vendí 2 aguas a Juan por $2'"
            )
            return Response(content="", media_type="application/xml")
        else:
            message_text = Body or ""
        
        if not message_text.strip():
            twilio_service.send_whatsapp(
                user_phone,
                "👋 Envía un mensaje de texto o nota de voz para registrar ventas o gastos.\n\nEscribe 'ayuda' para ver instrucciones."
            )
            return Response(content="", media_type="application/xml")
        
        # Process message
        bot_response = await conv_service.process_message(user_phone, store_id, message_text)
        
        # Send response
        twilio_service.send_whatsapp(user_phone, bot_response)
        
        return Response(content="", media_type="application/xml")
        
    except Exception as e:
        logger.error(f"Error in WhatsApp webhook: {str(e)}")
        return Response(content="", media_type="application/xml")

@api_router.get("/whatsapp/webhook")
async def whatsapp_webhook_verify():
    """Webhook verification for Twilio"""
    return {"status": "ok"}

# ============================================
# TRAINING MODULE ENDPOINTS
# ============================================

class TutorialCreate(BaseModel):
    title: str
    description: str
    category: str  # "basic", "intermediate", "advanced"
    content: str
    video_url: Optional[str] = None
    duration_minutes: Optional[int] = None
    order: Optional[int] = 0

class Tutorial(TutorialCreate):
    id: str = Field(alias="_id")
    created_at: datetime
    
    class Config:
        populate_by_name = True

@api_router.get("/training")
async def get_tutorials(category: Optional[str] = None):
    """Get all tutorials, optionally filtered by category"""
    try:
        query = {}
        if category:
            query["category"] = category
        
        tutorials = await db.tutorials.find(query).sort("order", 1).to_list(100)
        
        return [{
            "_id": str(tutorial["_id"]),
            "title": tutorial["title"],
            "description": tutorial["description"],
            "category": tutorial["category"],
            "content": tutorial.get("content", ""),
            "video_url": tutorial.get("video_url"),
            "duration_minutes": tutorial.get("duration_minutes", 0),
            "order": tutorial.get("order", 0),
            "created_at": tutorial.get("created_at")
        } for tutorial in tutorials]
    except Exception as e:
        logger.error(f"Error getting tutorials: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/training/{tutorial_id}")
async def get_tutorial(tutorial_id: str):
    """Get a specific tutorial by ID"""
    try:
        tutorial = await db.tutorials.find_one({"_id": ObjectId(tutorial_id)})
        
        if not tutorial:
            raise HTTPException(status_code=404, detail="Tutorial not found")
        
        return {
            "_id": str(tutorial["_id"]),
            "title": tutorial["title"],
            "description": tutorial["description"],
            "category": tutorial["category"],
            "content": tutorial.get("content", ""),
            "video_url": tutorial.get("video_url"),
            "duration_minutes": tutorial.get("duration_minutes", 0),
            "order": tutorial.get("order", 0),
            "created_at": tutorial.get("created_at")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tutorial {tutorial_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/training")
async def create_tutorial(tutorial: TutorialCreate, current_user: dict = Depends(get_current_user)):
    """Create a new tutorial (admin only)"""
    try:
        tutorial_dict = tutorial.dict()
        tutorial_dict["created_at"] = datetime.utcnow()
        
        result = await db.tutorials.insert_one(tutorial_dict)
        
        return {
            "_id": str(result.inserted_id),
            **tutorial_dict
        }
    except Exception as e:
        logger.error(f"Error creating tutorial: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/training/categories/list")
async def get_categories():
    """Get list of all tutorial categories"""
    return [
        {"id": "basic", "name": "Básico", "description": "Aprende lo fundamental"},
        {"id": "intermediate", "name": "Intermedio", "description": "Mejora tus habilidades"},
        {"id": "advanced", "name": "Avanzado", "description": "Conviértete en experto"},
        {"id": "whatsapp", "name": "WhatsApp AI", "description": "Usa el asistente de IA"},
        {"id": "reports", "name": "Reportes", "description": "Entiende tus datos"}
    ]

# ========== EXPORT ENDPOINTS (for Admin Console) ==========
@api_router.get("/export/sales")
async def export_sales():
    """Get all sales for export (uses default merchant for demo)"""
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        # Fallback to dgaraicoa store_id
        store_id = "690e264929f0c385565b3a1b"
    else:
        store_id = str(merchant["_id"])
    
    sales = await db.sales.find({"store_id": store_id}).sort("fecha", -1).to_list(1000)
    for sale in sales:
        sale["_id"] = str(sale["_id"])
    return sales

@api_router.get("/export/customers")
async def export_customers():
    """Get all customers for export"""
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        store_id = "690e264929f0c385565b3a1b"
    else:
        store_id = str(merchant["_id"])
    
    customers = await db.customers.find({"store_id": store_id}).to_list(1000)
    for customer in customers:
        customer["_id"] = str(customer["_id"])
    return customers

@api_router.get("/export/products")
async def export_products():
    """Get all products for export"""
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        store_id = "690e264929f0c385565b3a1b"
    else:
        store_id = str(merchant["_id"])
    
    products = await db.products.find({"store_id": store_id}).to_list(1000)
    for product in products:
        product["_id"] = str(product["_id"])
    return products

@api_router.get("/export/suppliers")
async def export_suppliers():
    """Get all suppliers for export"""
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        store_id = "690e264929f0c385565b3a1b"
    else:
        store_id = str(merchant["_id"])
    
    suppliers = await db.suppliers.find({"store_id": store_id}).to_list(1000)
    for supplier in suppliers:
        supplier["_id"] = str(supplier["_id"])
    return suppliers

# Include routers
app.include_router(api_router)

# Include new auth routes
try:
    from routes.auth_routes import router as auth_router
    app.include_router(auth_router, prefix="/api")
    print("✅ New auth routes loaded successfully")
except Exception as e:
    print(f"❌ Error loading auth routes: {e}")
    import traceback
    traceback.print_exc()

# Include onboarding routes (new signup/login flow)
try:
    from routes.onboarding_routes import router as onboarding_router
    app.include_router(onboarding_router, prefix="/api")
    print("✅ Onboarding routes loaded successfully")
except Exception as e:
    print(f"❌ Error loading onboarding routes: {e}")
    import traceback
    traceback.print_exc()

# Include analytics routes
try:
    from routes.analytics_routes import router as analytics_router
    app.include_router(analytics_router, prefix="/api")
    print("✅ Analytics routes loaded successfully")
except Exception as e:
    print(f"❌ Error loading analytics routes: {e}")
    import traceback
    traceback.print_exc()

# Include dashboard routes
try:
    from routes.dashboard_routes import router as dashboard_router
    app.include_router(dashboard_router, prefix="/api")
    print("✅ Dashboard routes loaded successfully")
except Exception as e:
    print(f"❌ Error loading dashboard routes: {e}")
    import traceback
    traceback.print_exc()

# Include KYB routes
try:
    from routes.kyb_routes import router as kyb_router
    app.include_router(kyb_router, prefix="/api")
    print("✅ KYB routes loaded successfully")
except Exception as e:
    print(f"❌ Error loading KYB routes: {e}")
    import traceback
    traceback.print_exc()

# Include Monitoring routes
try:
    from routes.monitoring_routes import router as monitoring_router
    app.include_router(monitoring_router, prefix="/api")
    print("✅ Monitoring routes loaded successfully")
except Exception as e:
    print(f"❌ Error loading monitoring routes: {e}")
    import traceback
    traceback.print_exc()

# Include Admin Ops routes
try:
    from routes.admin_ops_routes import router as admin_ops_router
    app.include_router(admin_ops_router, prefix="/api")
    print("✅ Admin Ops routes loaded successfully")
except Exception as e:
    print(f"❌ Error loading admin ops routes: {e}")
    import traceback
    traceback.print_exc()

# Include AI Insights routes
try:
    from routes.ai_insights_routes import router as ai_insights_router
    app.include_router(ai_insights_router, prefix="/api")
    print("✅ AI Insights routes loaded successfully")
except Exception as e:
    print(f"❌ Error loading AI insights routes: {e}")
    import traceback
    traceback.print_exc()

# Include Notification routes
try:
    from routes.notification_routes import router as notification_router
    app.include_router(notification_router, prefix="/api")
    print("✅ Notification routes loaded successfully")
except Exception as e:
    print(f"❌ Error loading notification routes: {e}")
    import traceback
    traceback.print_exc()

# Include AI Report routes
try:
    from routes.ai_report_routes import router as ai_report_router
    app.include_router(ai_report_router, prefix="/api")
    print("✅ AI Report routes loaded successfully")
except Exception as e:
    print(f"❌ Error loading AI report routes: {e}")
    import traceback
    traceback.print_exc()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize alert scheduler
from services.alert_scheduler import start_scheduler, stop_scheduler

@app.on_event("startup")
async def startup_event():
    """Start the alert scheduler when the app starts"""
    start_scheduler()
    logger.info("Application started successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    """Cleanup on shutdown"""
    stop_scheduler()
    client.close()
    logger.info("Application shutdown complete")
