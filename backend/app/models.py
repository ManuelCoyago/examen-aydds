from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from database import Base
from sqlalchemy.orm import relationship


class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String)
    cedula = Column(String, unique=True)
    phone = Column(String)

    sales = relationship("SaleGroup", back_populates="customer")  # <-- aquí

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    description = Column(String)
    price = Column(Float)
    stock = Column(Integer)
    barcode_value = Column(String, unique=True)
    barcode_path = Column(String)

class SaleGroup(Base):
    __tablename__ = "sale_groups"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    date = Column(DateTime, default=func.now())

    customer = relationship("Customer", back_populates="sales")
    items = relationship("Sale", back_populates="group")

class Sale(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("sale_groups.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    price = Column(Float)
    date = Column(DateTime, default=func.now())

    group = relationship("SaleGroup", back_populates="items")
    product = relationship("Product")
