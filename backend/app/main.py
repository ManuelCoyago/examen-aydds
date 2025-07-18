from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware  # <-- Añade esta importación
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import SessionLocal, engine
import models
import barcode_utils
from fastapi.responses import FileResponse
import os

from fastapi import HTTPException
from models import Customer, Product, Sale  # Asegúrate de importar tus modelos

models.Base.metadata.create_all(bind=engine)
app = FastAPI()

# Configuración CORS (Añade esto justo después de crear la app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todos los orígenes (en producción deberías limitarlo)
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos
    allow_headers=["*"],  # Permite todos los headers
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# CLIENTES
class CustomerIn(BaseModel):
    name: str
    email: str
    cedula: str
    phone: str

@app.post("/clientes")
def add_customer(c: CustomerIn, db: Session = Depends(get_db)):
    customer = Customer(**c.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return {"message": "Cliente registrado", "customer_id": customer.id}

@app.get("/clientes")
def list_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).all()

# Producto entrada (request)
class ProductIn(BaseModel):
    name: str
    description: str
    price: float
    stock: int

# Producto salida (response)
class ProductOut(BaseModel):
    id: int
    name: str
    description: str
    price: float
    stock: int
    barcode_value: str
    barcode_path: str

    class Config:
        orm_mode = True

@app.post("/productos")
def add_product(p: ProductIn, db: Session = Depends(get_db)):
    product = models.Product(**p.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)

    barcode_path, code_value = barcode_utils.generate_barcode(p.name, product.id)
    filename = os.path.basename(barcode_path)

    product.barcode_path = filename
    product.barcode_value = code_value
    db.commit()

    return {
        "message": "Producto registrado",
        "barcode_url": f"/codigo-de-barras/{filename}",
        "product": {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "stock": product.stock,
            "barcode_value": product.barcode_value,
            "barcode_path": product.barcode_path
        }
    }


@app.get("/codigo-de-barras/{filename}")
def get_barcode_image(filename: str):
    filepath = f"barcodes/{filename}"
    if os.path.exists(filepath):
        return FileResponse(path=filepath, media_type="image/png", filename=filename)
    return {"error": "No se encontró el código de barras"}

@app.get("/producto-por-codigo/{code}", response_model=ProductOut)
def get_product_by_code(code: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.barcode_value == code).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

@app.get("/productos", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

@app.get("/inventario")
def get_inventory(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

# VENTAS
class SaleIn(BaseModel):
    customer_cedula: str
    product_id: int
    quantity: int

@app.post("/ventas")
def register_sale(s: SaleIn, db: Session = Depends(get_db)):
    # Buscar cliente por cédula
    customer = db.query(models.Customer).filter(models.Customer.cedula == s.customer_cedula).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Buscar producto
    product = db.query(models.Product).get(s.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Validar stock
    if product.stock < s.quantity:
        raise HTTPException(status_code=400, detail="Stock insuficiente")

    # Actualizar stock
    product.stock -= s.quantity
    
    # Crear venta
    sale = models.Sale(
        customer_id=customer.id,
        product_id=s.product_id,
        quantity=s.quantity
    )
    
    db.add(sale)
    db.commit()
    
    # Preparar respuesta
    response = {
        "message": f"Venta registrada para {customer.name} (Cédula: {customer.cedula})",
        "customer_cedula": customer.cedula
    }
    
    # Alertar si el stock es bajo
    if product.stock < 5:
        response["alert"] = f"¡Atención! Stock bajo de {product.name}: {product.stock} unidades restantes"
    
    return response

@app.get("/ventas")
def list_sales(db: Session = Depends(get_db)):
    sales = db.query(models.Sale).all()
    result = []
    for sale in sales:
        customer = db.query(models.Customer).filter(models.Customer.id == sale.customer_id).first()
        product = db.query(models.Product).filter(models.Product.id == sale.product_id).first()
        result.append({
            "sale_id": sale.id,
            "customer_cedula": customer.cedula if customer else "N/A",
            "product_name": product.name if product else "N/A",
            "quantity": sale.quantity,
            "date": sale.date
        })
    return result

@app.get("/ventas/{sale_id}")
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(models.Sale).get(sale_id)
    if not sale:
        return {"error": "Venta no encontrada"}
    
    customer = db.query(models.Customer).get(sale.customer_id)
    product = db.query(models.Product).get(sale.product_id)
    
    return {
        "sale_id": sale.id,
        "customer": {
            "cedula": customer.cedula,
            "name": customer.name,
            "email": customer.email,
            "phone": customer.phone
        },
        "product": {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "stock": product.stock
        },
        "quantity": sale.quantity,
        "date": sale.date
    }