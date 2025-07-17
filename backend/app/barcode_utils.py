from barcode import EAN13
from barcode.writer import ImageWriter
from pathlib import Path
import hashlib

def generate_barcode(product_name: str, product_id: int = None) -> tuple[str, str]:
    """Genera un código de barras único para cada producto y retorna (ruta, valor EAN13)"""
    Path("barcodes").mkdir(exist_ok=True)
    
    # Crear un código base usando el nombre y/o ID del producto
    if product_id is not None:
        base_str = f"{product_id}{product_name}"
    else:
        base_str = product_name
    
    # Generar un hash único de 12 dígitos
    hash_digest = hashlib.md5(base_str.encode()).hexdigest()
    numeric_code = ''.join(c for c in hash_digest if c.isdigit())[:12].ljust(12, '0')

    # Asegurarse de que el código tiene exactamente 12 dígitos (EAN13 agrega el dígito de control)
    numeric_code = numeric_code[:12]
    
    # Nombre del archivo (solo caracteres alfanuméricos)
    clean_name = ''.join(c for c in product_name if c.isalnum())
    filename = f"barcodes/{clean_name[:20]}_{numeric_code}"
    
    # Generar y guardar el código de barras
    barcode = EAN13(numeric_code, writer=ImageWriter())
    saved_file = barcode.save(filename)

    return saved_file, barcode.get_fullcode()  # ← Ruta del PNG, y el código EAN13 con dígito de control
