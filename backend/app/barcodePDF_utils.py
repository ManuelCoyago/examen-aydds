from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm
from fastapi.responses import FileResponse
from datetime import datetime
import os

PDF_DIR = "pdf_reports"
os.makedirs(PDF_DIR, exist_ok=True)

def generar_reporte_pdf(productos, filename="reporte_codigos_barras.pdf"):
    filepath = os.path.join(PDF_DIR, filename)
    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter

    y = height - 50  # posición vertical inicial

    for producto in productos:
        # Título del producto
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, f"{producto.name} (Stock: {producto.stock})")
        y -= 20

        # Mostrar valor del código
        c.setFont("Helvetica", 10)
        c.drawString(50, y, f"Código de barras: {producto.barcode_value}")
        y -= 15

        # Incluir imagen del código de barras
        barcode_path = f"barcodes/{producto.barcode_path}"
        if os.path.exists(barcode_path):
            c.drawImage(barcode_path, 50, y - 40, width=150, height=40)
        y -= 60

        if y < 100:  # Si se acaba la página
            c.showPage()
            y = height - 50

    c.save()
    return filepath
