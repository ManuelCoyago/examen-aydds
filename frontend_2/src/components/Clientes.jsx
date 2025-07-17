// src/Clientes.jsx
import { useEffect, useState } from 'react';
import { fetchClientes, addCliente } from '../api';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState({ name: '', email: '' });

  useEffect(() => {
    cargarClientes();
  }, []);

  async function cargarClientes() {
    const data = await fetchClientes();
    setClientes(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await addCliente(form);
    alert(res.message);
    setForm({ name: '', email: '' });
    cargarClientes();
  }

  return (
    <div>
      <h2>Gestión de Clientes</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre"
          required
          value={form.name}
          onChange={e => setForm({...form, name: e.target.value})}
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={e => setForm({...form, email: e.target.value})}
        />
        <button type="submit">Agregar Cliente</button>
      </form>

      <h3>Lista de Clientes</h3>
      <table>
        <thead>
          <tr><th>ID</th><th>Nombre</th><th>Email</th></tr>
        </thead>
        <tbody>
          {clientes.map(c => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.name}</td>
              <td>{c.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
