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
    const response = await fetch('/inventario');
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
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    // Actualizar select de productos para ventas
    updateProductSelect(products);
}

async function addProduct(event) {
    event.preventDefault();
    
    const product = {
        name: document.getElementById('productoNombre').value,
        description: document.getElementById('productoDescripcion').value,
        price: parseFloat(document.getElementById('productoPrecio').value),
        stock: parseInt(document.getElementById('productoStock').value)
    };
    
    const response = await fetch('/productos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(product)
    });
    
    const result = await response.json();
    alert(result.message);
    loadProducts();
    this.reset();
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
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    // Actualizar select de clientes para ventas
    updateCustomerSelect(customers);
}

async function addCustomer(event) {
    event.preventDefault();
    
    const customerData = {
        name: document.getElementById('clienteNombre').value,
        email: document.getElementById('clienteEmail').value,
        cedula: document.getElementById('clienteCedula').value,
        phone: document.getElementById('clienteTelefono').value
    };

    console.log("Datos a enviar:", JSON.stringify(customerData, null, 2));
    
    try {
        const response = await fetch('http://localhost:8000/clientes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(customerData)
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error("Error completo:", errorDetails);
            throw new Error(errorDetails.detail || "Error del servidor");
        }

        const result = await response.json();
        alert(result.message);
        loadCustomers();
        event.target.reset();
    } catch (error) {
        console.error("Error completo:", error);
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

