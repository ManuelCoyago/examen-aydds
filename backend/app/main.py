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
from models import Customer, Product, Sale,SaleGroup 
import barcodePDF_utils
from datetime import datetime

models.Base.metadata.create_all(bind=engine)
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
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
class SaleItem(BaseModel):
    product_id: int
    quantity: int

class SaleIn(BaseModel):
    customer_cedula: str
    items: list[SaleItem]

@app.post("/ventas")
def register_sale(s: SaleIn, db: Session = Depends(get_db)):
    # Buscar cliente
    customer = db.query(models.Customer).filter(models.Customer.cedula == s.customer_cedula).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    total = 0
    sale_details = []

    # Crear grupo de venta
    group = models.SaleGroup(customer_id=customer.id)
    db.add(group)
    db.flush()  # Para obtener el ID del grupo

    for item in s.items:
        product = db.query(models.Product).get(item.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Producto con ID {item.product_id} no encontrado")
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {product.name} (ID {product.id})")

        # Descontar stock
        product.stock -= item.quantity

        # Registrar detalle de venta
        sale = models.Sale(
            group_id=group.id,
            product_id=product.id,
            quantity=item.quantity
        )
        db.add(sale)
        db.flush()

        sale_details.append({
            "product_id": product.id,
            "product_name": product.name,
            "quantity": item.quantity,
            "unit_price": product.price,
            "subtotal": item.quantity * product.price,
            "sale_id": sale.id
        })

        total += item.quantity * product.price

    db.commit()

    return {
        "message": f"Venta registrada para {customer.name}",
        "sale_id": group.id,
        "customer": {
            "cedula": customer.cedula,
            "name": customer.name
        },
        "details": sale_details,
        "total": total
    }



@app.get("/ventas")
def list_sales(db: Session = Depends(get_db)):
    groups = db.query(models.SaleGroup).all()
    result = []

    for group in groups:
        customer = group.customer
        details = []
        total = 0

        for sale in group.items:
            product = sale.product
            subtotal = sale.quantity * product.price
            total += subtotal

            details.append({
                "product_id": product.id,
                "product_name": product.name,
                "quantity": sale.quantity,
                "unit_price": product.price,
                "subtotal": subtotal
            })

        result.append({
            "sale_id": group.id,
            "date": group.date,
            "customer": {
                "cedula": customer.cedula,
                "name": customer.name
            },
            "details": details,
            "total": total
        })

    return result



@app.get("/ventas/{id}")
def get_sale(id: int, db: Session = Depends(get_db)):
    group = db.query(models.SaleGroup).filter(models.SaleGroup.id == id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    customer = group.customer
    details = []
    total = 0

    for sale in group.items:
        product = sale.product
        subtotal = sale.quantity * product.price
        total += subtotal

        details.append({
            "product_id": product.id,
            "product_name": product.name,
            "quantity": sale.quantity,
            "unit_price": product.price,
            "subtotal": subtotal
        })

    return {
        "sale_id": group.id,
        "date": group.date,
        "customer": {
            "cedula": customer.cedula,
            "name": customer.name
        },
        "details": details,
        "total": total
    }

# Reporte PDF de códigos de barras
@app.get("/reporte-codigos-barras")
def descargar_pdf_codigos_barras(db: Session = Depends(get_db)):
    productos = db.query(Product).all()
    if not productos:
        raise HTTPException(status_code=404, detail="No hay productos para generar el reporte")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"reporte_codigos_barras_{timestamp}.pdf"
    filepath = barcodePDF_utils.generar_reporte_pdf(productos, filename)

    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/pdf"
    )
