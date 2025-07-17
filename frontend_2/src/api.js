// src/api.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchProductos() {
  const res = await fetch(`${API_BASE}/productos`);
  return await res.json();
}

export async function addProducto(producto) {
  const res = await fetch(`${API_BASE}/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto)
  });
  return await res.json();
}

export async function fetchProductoPorCodigo(codigo) {
  const res = await fetch(`${API_BASE}/producto-por-codigo/${codigo}`);
  if (!res.ok) throw await res.json();
  return await res.json();
}

export async function fetchClientes() {
  const res = await fetch(`${API_BASE}/clientes`);
  return await res.json();
}

export async function addCliente(cliente) {
  const res = await fetch(`${API_BASE}/clientes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cliente)
  });
  return await res.json();
}

export async function fetchVentas() {
  const res = await fetch(`${API_BASE}/ventas`);
  return await res.json();
}

export async function addVenta(venta) {
  const res = await fetch(`${API_BASE}/ventas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(venta)
  });
  return await res.json();
}
