document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos iniciales
    loadProducts();
    loadCustomers();
    loadSales();
    
    // Configurar formularios
    document.getElementById('productoForm').addEventListener('submit', addProduct);
    document.getElementById('clienteForm').addEventListener('submit', addCustomer);
    document.getElementById('buscarCodigoForm').addEventListener('submit', buscarPorCodigo);
    document.getElementById('btnAddLinea').addEventListener('click', addProductLine);
    document.getElementById('btnRegistrarVenta').addEventListener('click', submitSale);
    document.getElementById('btnDescargarPDF').addEventListener('click', descargarReportePDF);

});

// Funciones para cambiar pestañas
function openTab(tabName) {
    const tabs = document.getElementsByClassName('tab-content');
    for (let tab of tabs) {
        tab.style.display = 'none';
    }
    
    const buttons = document.getElementsByClassName('tab-button');
    for (let button of buttons) {
        button.classList.remove('active');
    }
    
    document.getElementById(tabName).style.display = 'block';
    event.currentTarget.classList.add('active');
}

// Funciones para productos
async function loadProducts() {
    const response = await fetch('/productos');
    const products = await response.json();
    
    const productList = document.getElementById('inventarioLista');
    productList.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Código de Barras</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    ${products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.description}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>
                ${product.barcode_path ? 
                    `<img src="/codigo-de-barras/${product.barcode_path}" alt="Código de barras" class="barcode">` : 
                    'No disponible'}
            </td>
            <td>
                <button onclick='loadProductToEdit(${JSON.stringify(product)})'>✏️</button>
                <button onclick='descontinuarProducto("${product.barcode_value}")'>❌</button>
            </td>
        </tr>
    `).join('')}
</tbody>

        </table>
    `;
    
    // Actualizar select de productos para ventas
    updateProductSelect(products);
}

function loadProductToEdit(product) {
    document.getElementById('productoNombre').value = product.name;
    document.getElementById('productoDescripcion').value = product.description;
    document.getElementById('productoPrecio').value = product.price;
    document.getElementById('productoStock').value = product.stock;

    // Guardar el ID en un campo oculto
    let idField = document.getElementById('productoIdEdit');
    if (!idField) {
        idField = document.createElement('input');
        idField.type = 'hidden';
        idField.id = 'productoIdEdit';
        document.getElementById('productoForm').appendChild(idField);
    }
    idField.value = product.id;

    // Cambiar el texto del botón
    document.querySelector('#productoForm button[type="submit"]').textContent = "Actualizar Producto";
}



async function addProduct(event) {
    event.preventDefault();

    const idEdit = document.getElementById('productoIdEdit')?.value;
    const method = idEdit ? 'PUT' : 'POST';
    const url = idEdit ? `/productos/${idEdit}` : '/productos';

    const product = {
        name: document.getElementById('productoNombre').value,
        description: document.getElementById('productoDescripcion').value,
        price: parseFloat(document.getElementById('productoPrecio').value),
        stock: parseInt(document.getElementById('productoStock').value)
    };

    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
    });

    const result = await response.json();
    alert(result.message);

    loadProducts();
    this.reset();

    // Eliminar ID oculto si fue edición
    const idField = document.getElementById('productoIdEdit');
    if (idField) idField.remove();

    // Restaurar texto del botón
    document.querySelector('#productoForm button[type="submit"]').textContent = "Agregar Producto";
}


// Funciones para clientes (similar a productos)
async function loadCustomers() {
    const response = await fetch('/clientes');
    const customers = await response.json();
    const customerList = document.getElementById('clientesLista');

    customerList.innerHTML = `
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Cédula</th>
                <th>Teléfono</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            ${customers.map(customer => `
                <tr>
                    <td>${customer.id}</td>
                    <td>${customer.name}</td>
                    <td>${customer.email}</td>
                    <td>${customer.cedula}</td>
                    <td>${customer.phone || 'N/A'}</td>
                    <td>
                        <button onclick='loadCustomerToEdit(${JSON.stringify(customer)})'>✏️</button>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    `;

    updateCustomerSelect(customers);
}

function loadCustomerToEdit(customer) {
    document.getElementById('clienteNombre').value = customer.name;
    document.getElementById('clienteEmail').value = customer.email;
    document.getElementById('clienteCedula').value = customer.cedula;
    document.getElementById('clienteTelefono').value = customer.phone;

    // Campo oculto con el ID
    let idField = document.getElementById('clienteIdEdit');
    if (!idField) {
        idField = document.createElement('input');
        idField.type = 'hidden';
        idField.id = 'clienteIdEdit';
        document.getElementById('clienteForm').appendChild(idField);
    }
    idField.value = customer.id;

    // Cambiar texto del botón
    document.querySelector('#clienteForm button[type="submit"]').textContent = "Actualizar Cliente";
}

async function addCustomer(event) {
    event.preventDefault();

    const idEdit = document.getElementById('clienteIdEdit')?.value;
    const method = idEdit ? 'PUT' : 'POST';
    const url = idEdit ? `/clientes/${idEdit}` : '/clientes';

    const customerData = {
        name: document.getElementById('clienteNombre').value,
        email: document.getElementById('clienteEmail').value,
        cedula: document.getElementById('clienteCedula').value,
        phone: document.getElementById('clienteTelefono').value
    };

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(customerData)
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            throw new Error(errorDetails.detail || "Error del servidor");
        }

        const result = await response.json();
        alert(result.message);
        loadCustomers();
        event.target.reset();

        // Eliminar campo ID si era edición
        const idField = document.getElementById('clienteIdEdit');
        if (idField) idField.remove();

        // Restaurar texto del botón
        document.querySelector('#clienteForm button[type="submit"]').textContent = "Agregar Cliente";
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}


async function loadSales() {
    const res = await fetch('/ventas');
    const sales = await res.json();

    const tbody = document.querySelector('#tablaVentas tbody');
    tbody.innerHTML = ''; // Limpia contenido anterior

    sales.forEach(sale => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.sale_id}</td>
            <td>${sale.customer.cedula} - ${sale.customer.name}</td>
            <td>
                <ul>
                    ${sale.details.map(item => `
                        <li>${item.product_name} (x${item.quantity}) - $${item.unit_price} = $${item.subtotal}</li>
                    `).join('')}
                </ul>
            </td>
            <td>$${sale.total}</td>
            <td>${new Date(sale.date).toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });
}


function addProductLine() {
    const container = document.getElementById('productosVenta');

    const div = document.createElement('div');
    div.innerHTML = `
        <select class="ventaProducto" required></select>
        <input type="number" class="ventaCantidad" placeholder="Cantidad" required>
    `;
    container.appendChild(div);

    // Llenar el nuevo select
    fetch('/inventario').then(res => res.json()).then(products => {
        const select = div.querySelector('.ventaProducto');
        select.innerHTML = products.map(p => 
            `<option value="${p.id}">${p.name} (Stock: ${p.stock})</option>`
        ).join('');
    });
}
// Envía la venta al backend
async function submitSale() {
  const cedula = document.getElementById('ventaCliente').value;
  const items = [];
  document.querySelectorAll('#tablaProductosVenta tbody tr').forEach(tr => {
    items.push({
      product_id: parseInt(tr.querySelector('.ventaProducto').value),
      quantity: parseInt(tr.querySelector('.ventaCantidad').value)
    });
  });
  if (!cedula || items.length === 0) {
    return alert("Selecciona cliente y al menos un producto.");
  }

  const res = await fetch('/ventas', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ customer_cedula: cedula, items })
  });
  const result = await res.json();
  if (!res.ok) return alert(result.detail || 'Error');

  alert(`${result.message}\nTotal: $${result.total.toFixed(2)}`);
  document.querySelector('#tablaProductosVenta tbody').innerHTML = '';
  loadSales(); loadProducts();
  verificarStockBajo();

}

function updateCustomerSelect(customers) {
    const select = document.getElementById('ventaCliente');
    select.innerHTML = customers.map(c => 
        `<option value="${c.cedula}">${c.cedula} - ${c.name}</option>`
    ).join('');
}

function updateProductSelect(products) {
    document.querySelectorAll('.ventaProducto').forEach(select => {
        select.innerHTML = products.map(p => 
            `<option value="${p.id}">${p.name} (Stock: ${p.stock})</option>`
        ).join('');
    });
}


async function buscarPorCodigo(event) {
    event.preventDefault();
    const codigo = document.getElementById('codigoBusqueda').value;
    const resultadoDiv = document.getElementById('resultadoBusqueda');

    try {
        const response = await fetch(`http://localhost:8000/producto-por-codigo/${codigo}`);
        
        if (!response.ok) {
            const errorResult = await response.json();
            resultadoDiv.innerHTML = `<p style="color:red;">${errorResult.detail || "Error desconocido"}</p>`;
            return;
        }

        const result = await response.json();

        const priceFormatted = (typeof result.price === 'number') ? result.price.toFixed(2) : result.price;

        resultadoDiv.innerHTML = `
            <p><strong>Producto:</strong> ${result.name}</p>
            <p><strong>Descripción:</strong> ${result.description}</p>
            <p><strong>Precio:</strong> $${priceFormatted}</p>
            <p><strong>Stock:</strong> ${result.stock}</p>
        `;

    } catch (error) {
        resultadoDiv.innerHTML = `<p style="color:red;">Error al buscar el producto.</p>`;
        console.error("Error en fetch:", error);
    }
}


// Crea una nueva fila en la tabla
function addProductLine() {
  fetch('/inventario').then(res => res.json()).then(products => {
    const tbody = document.querySelector('#tablaProductosVenta tbody');
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>
        <select class="ventaProducto">
          ${products.map(p =>
            `<option value="${p.id}">${p.name} (Stock: ${p.stock})</option>`
          ).join('')}
        </select>
      </td>
      <td><input type="number" class="ventaCantidad" min="1" value="1"></td>
      <td><button class="btnRemove">Eliminar</button></td>
    `;

    tr.querySelector('.btnRemove').addEventListener('click', () => tr.remove());
    tbody.appendChild(tr);
  });
}

const UMBRAL_STOCK_BAJO = 5;

async function verificarStockBajo() {
  try {
    const response = await fetch('/productos');
    const productos = await response.json();
    
    console.log("Productos cargados:", productos);  // <-- Verifica si llegan productos

    const productosBajos = productos.filter(p => {
      console.log(`Producto: ${p.name}, Stock: ${p.stock}`);
      return p.stock < UMBRAL_STOCK_BAJO;
    });

    if (productosBajos.length > 0) {
      let mensaje = "⚠️ ¡Atención! Los siguientes productos tienen stock bajo:\n\n";
      productosBajos.forEach(p => {
        mensaje += `- ${p.name} (stock: ${p.stock})\n`;
      });
      Swal.fire({
  icon: 'warning',
  title: '⚠️ ¡Atención!',
  html: mensaje.replaceAll('\n', '<br>'),
});

    } else {
      console.log("No hay productos con stock bajo");
    }
  } catch (error) {
    console.error("Error al verificar stock bajo:", error);
  }
}

function descargarReportePDF() {
    fetch('http://localhost:8000/reporte-codigos-barras')
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo generar el PDF');
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_codigos_barras.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error al descargar el PDF:', error);
            Swal.fire('Error', 'No se pudo generar el reporte PDF.', 'error');
        });
}
function descontinuarProducto(barcode) {
    Swal.fire({
        title: '¿Descontinuar producto?',
        text: 'Esto ocultará el producto del catálogo, pero no eliminará ventas pasadas.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, descontinuar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const response = await fetch(`/productos/por-codigo/${barcode}/descontinuar`, {
                method: 'PUT'
            });

            const resultData = await response.json();

            if (response.ok) {
                Swal.fire('Descontinuado', resultData.message, 'success');
                loadProducts();  // recarga la lista de productos activos
            } else {
                Swal.fire('Error', resultData.detail || 'No se pudo descontinuar', 'error');
            }
        }
    });
}

let descontinuadosVisibles = false;

async function toggleProductosDescontinuados() {
    const tabla = document.getElementById("tablaDescontinuados");
    const boton = document.getElementById("btnToggleDescontinuados");
    const tbody = tabla.querySelector("tbody");

    if (!descontinuadosVisibles) {
        // Mostrar productos descontinuados
        const res = await fetch("/productos/descontinuados");
        const data = await res.json();

        tbody.innerHTML = "";
        data.forEach(p => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>${p.description}</td>
                <td>
                    <button onclick="reactivarProducto(${p.id})">Reactivar</button>
                </td>
            `;
            tbody.appendChild(fila);
        });

        tabla.style.display = "table";  // Mostrar tabla
        boton.textContent = "Ocultar productos descontinuados";
        descontinuadosVisibles = true;
    } else {
        // Ocultar tabla y limpiar contenido
        tabla.style.display = "none";
        tbody.innerHTML = "";
        boton.textContent = "Ver productos descontinuados";
        descontinuadosVisibles = false;
    }
}

async function reactivarProducto(id) {
    const res = await fetch(`/productos/${id}/reactivar`, { method: "PUT" });
    if (res.ok) {
        alert("Producto reactivado con éxito");
        toggleProductosDescontinuados();
        loadProducts();  // recargar productos activos
    } else {
        const err = await res.json();
        alert("Error: " + err.detail);
    }
}
