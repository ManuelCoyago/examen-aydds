// src/components/Productos.jsx
import { useEffect, useState } from 'react';
import { fetchProductos, addProducto, fetchProductoPorCodigo } from '../api';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '' });
  const [busqueda, setBusqueda] = useState('');
  const [resultadoBusqueda, setResultadoBusqueda] = useState(null);
  const [errorBusqueda, setErrorBusqueda] = useState(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    const prods = await fetchProductos();
    setProductos(prods);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await addProducto({
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      stock: parseInt(form.stock)
    });
    alert(res.message);
    setForm({ name: '', description: '', price: '', stock: '' });
    cargarProductos();
  }

  async function handleBusqueda(e) {
    e.preventDefault();
    setErrorBusqueda(null);
    setResultadoBusqueda(null);

    try {
      const res = await fetchProductoPorCodigo(busqueda);
      setResultadoBusqueda(res);
    } catch (err) {
      setErrorBusqueda(err.detail || 'Error desconocido');
    }
  }

  return (
    <div>
      <h2>Gestión de Productos</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre"
          required
          value={form.name}
          onChange={e => setForm({...form, name: e.target.value})}
        />
        <input
          type="text"
          placeholder="Descripción"
          value={form.description}
          onChange={e => setForm({...form, description: e.target.value})}
        />
        <input
          type="number"
          placeholder="Precio"
          step="0.01"
          required
          value={form.price}
          onChange={e => setForm({...form, price: e.target.value})}
        />
        <input
          type="number"
          placeholder="Stock"
          required
          value={form.stock}
          onChange={e => setForm({...form, stock: e.target.value})}
        />
        <button type="submit">Agregar Producto</button>
      </form>

      <h3>Buscar Producto por Código de Barras</h3>
      <form onSubmit={handleBusqueda}>
        <input
          type="text"
          placeholder="Escanea o escribe el código EAN13"
          required
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <button type="submit">Buscar</button>
      </form>
      {errorBusqueda && <p style={{color: 'red'}}>{errorBusqueda}</p>}
      {resultadoBusqueda && (
        <div>
          <p><strong>Producto:</strong> {resultadoBusqueda.name}</p>
          <p><strong>Descripción:</strong> {resultadoBusqueda.description}</p>
          <p><strong>Precio:</strong> ${typeof resultadoBusqueda.price === 'number' ? resultadoBusqueda.price.toFixed(2) : resultadoBusqueda.price}</p>
          <p><strong>Stock:</strong> {resultadoBusqueda.stock}</p>
        </div>
      )}

      <h3>Inventario</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Nombre</th><th>Descripción</th><th>Precio</th><th>Stock</th><th>Código de Barras</th>
          </tr>
        </thead>
        <tbody>
          {productos.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.description}</td>
              <td>${p.price.toFixed(2)}</td>
              <td>{p.stock}</td>
              <td>
                {p.barcode_path
                  ? <img src={`http://localhost:8000/codigo-de-barras/${p.barcode_path}`} alt="Código de barras" style={{ height: '50px' }} />

                  : 'No disponible'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
