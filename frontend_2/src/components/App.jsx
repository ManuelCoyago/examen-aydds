// src/App.jsx
import { useState } from 'react';
import Productos from './Productos';
import Clientes from './Clientes';
import Ventas from './Ventas';

export default function App() {
  const [activeTab, setActiveTab] = useState('productos');

  return (
    <div className="container">
      <h1>Sistema de Inventario</h1>

      <div className="tabs">
        {['productos', 'clientes', 'ventas'].map(tab => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'productos' && <Productos />}
      {activeTab === 'clientes' && <Clientes />}
      {activeTab === 'ventas' && <Ventas />}
    </div>
  );
}
