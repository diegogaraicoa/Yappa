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
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

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
    image: Optional[str] = None
    quantity: Optional[float] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    category_id: Optional[str] = None
    description: Optional[str] = None

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
    
    # Create store
    store = {
        "name": user_data.store_name,
        "owner_id": "",
        "created_at": datetime.utcnow(),
        "active": True
    }
    store_result = await db.stores.insert_one(store)
    store_id = str(store_result.inserted_id)
    
    # Create user
    user = {
        "email": user_data.email,
        "password": get_password_hash(user_data.password),
        "store_id": store_id,
        "role": "owner",
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
async def get_customers(current_user: dict = Depends(get_current_user)):
    customers = await db.customers.find({"store_id": current_user["store_id"]}).to_list(1000)
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
async def get_products(current_user: dict = Depends(get_current_user)):
    products = await db.products.find({"store_id": current_user["store_id"]}).to_list(1000)
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
    update_dict = {k: v for k, v in product.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    result = await db.products.update_one(
        {"_id": ObjectId(product_id), "store_id": current_user["store_id"]},
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
async def get_low_stock_alerts(current_user: dict = Depends(get_current_user)):
    """Get all products with stock below their alert threshold"""
    # Get all products for this store (alert_enabled defaults to True if not set)
    products = await db.products.find({
        "store_id": current_user["store_id"]
    }).to_list(1000)
    
    low_stock_products = []
    for product in products:
        # Only include if alert_enabled is True or not set (default True)
        alert_enabled = product.get("alert_enabled", True)
        min_stock_alert = product.get("min_stock_alert", 10)
        if alert_enabled and product["quantity"] <= min_stock_alert:
            product["_id"] = str(product["_id"])
            product["alert_level"] = "critical" if product["quantity"] == 0 else "warning"
            # Ensure min_stock_alert is always present in response
            product["min_stock_alert"] = min_stock_alert
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
    current_user: dict = Depends(get_current_user)
):
    query = {"store_id": current_user["store_id"]}
    
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
app.include_router(api_router)

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
