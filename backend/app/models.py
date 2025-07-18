from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from database import Base



class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String)
    cedula = Column(String, unique=True)  # <- aquí debe estar esta columna
    phone = Column(String)  # <- aquí debe estar esta columna

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    description = Column(String)
    price = Column(Float)
    stock = Column(Integer)
    barcode_value = Column(String, unique=True)  # <- aquí debe estar esta columna
    barcode_path = Column(String)  # <- aquí debe estar esta columna


class Sale(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    date = Column(DateTime, default=func.now())
