document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos iniciales
    loadProducts();
    loadCustomers();
    loadSales();
    
    // Configurar formularios
    document.getElementById('productoForm').addEventListener('submit', addProduct);
    document.getElementById('clienteForm').addEventListener('submit', addCustomer);
    document.getElementById('ventaForm').addEventListener('submit', addSale);
    document.getElementById('buscarCodigoForm').addEventListener('submit', buscarPorCodigo);

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
                </tr>
            </thead>
            <tbody>
                ${customers.map(customer => `
                    <tr>
                        <td>${customer.id}</td>
                        <td>${customer.name}</td>
                        <td>${customer.email}</td>
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
    
    const customer = {
        name: document.getElementById('clienteNombre').value,
        email: document.getElementById('clienteEmail').value
    };
    
    const response = await fetch('/clientes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(customer)
    });
    
    const result = await response.json();
    alert(result.message);
    loadCustomers();
    this.reset();
}

// Funciones para ventas
async function loadSales() {
    const response = await fetch('/ventas');
    const sales = await response.json();
    
    const saleList = document.getElementById('ventasLista');
    saleList.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID Venta</th>
                    <th>Cliente</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                </tr>
            </thead>
            <tbody>
                ${sales.map(sale => `
                    <tr>
                        <td>${sale.id}</td>
                        <td>${sale.customer_id}</td>
                        <td>${sale.product_id}</td>
                        <td>${sale.quantity}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function addSale(event) {
    event.preventDefault();
    
    const sale = {
        customer_id: parseInt(document.getElementById('ventaCliente').value),
        product_id: parseInt(document.getElementById('ventaProducto').value),
        quantity: parseInt(document.getElementById('ventaCantidad').value)
    };
    
    const response = await fetch('/ventas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sale)
    });
    
    const result = await response.json();
    if (result.error) {
    alert(result.error);
} else {
    let mensaje = result.message;
    if (result.alert) {
        mensaje += `\n\n${result.alert}`;
    }
    alert(mensaje);
    loadSales();
    loadProducts(); // Para actualizar el stock
    this.reset();
}

}

// Funciones auxiliares
function updateCustomerSelect(customers) {
    const select = document.getElementById('ventaCliente');
    select.innerHTML = customers.map(c => 
        `<option value="${c.id}">${c.name} (${c.email})</option>`
    ).join('');
}

function updateProductSelect(products) {
    const select = document.getElementById('ventaProducto');
    select.innerHTML = products.map(p => 
        `<option value="${p.id}">${p.name} (Stock: ${p.stock})</option>`
    ).join('');
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
