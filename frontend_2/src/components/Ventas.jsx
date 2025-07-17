// src/Ventas.jsx
import { useEffect, useState } from 'react';
import { fetchVentas, addVenta, fetchClientes, fetchProductos } from '../api';

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({ customer_id: '', product_id: '', quantity: '' });

  useEffect(() => {
    cargarVentas();
    cargarClientes();
    cargarProductos();
  }, []);

  async function cargarVentas() {
    const data = await fetchVentas();
    setVentas(data);
  }

  async function cargarClientes() {
    const data = await fetchClientes();
    setClientes(data);
  }

  async function cargarProductos() {
    const data = await fetchProductos();
    setProductos(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await addVenta({
      customer_id: parseInt(form.customer_id),
      product_id: parseInt(form.product_id),
      quantity: parseInt(form.quantity)
    });

    if (res.error) {
      alert(res.error);
    } else {
      let mensaje = res.message;
      if (res.alert) mensaje += `\n\n${res.alert}`;
      alert(mensaje);
      setForm({ customer_id: '', product_id: '', quantity: '' });
      cargarVentas();
      cargarProductos();
    }
  }

  return (
    <div>
      <h2>Registro de Ventas</h2>
      <form onSubmit={handleSubmit}>
        <select
          required
          value={form.customer_id}
          onChange={e => setForm({...form, customer_id: e.target.value})}
        >
          <option value="">Seleccione Cliente</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
          ))}
        </select>

        <select
          required
          value={form.product_id}
          onChange={e => setForm({...form, product_id: e.target.value})}
        >
          <option value="">Seleccione Producto</option>
          {productos.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} (Stock: {p.stock})
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Cantidad"
          required
          value={form.quantity}
          onChange={e => setForm({...form, quantity: e.target.value})}
        />

        <button type="submit">Registrar Venta</button>
      </form>

      <h3>Historial de Ventas</h3>
      <table>
        <thead>
          <tr><th>ID Venta</th><th>Cliente</th><th>Producto</th><th>Cantidad</th></tr>
        </thead>
        <tbody>
          {ventas.map(v => (
            <tr key={v.id}>
              <td>{v.id}</td>
              <td>{v.customer_id}</td>
              <td>{v.product_id}</td>
              <td>{v.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
