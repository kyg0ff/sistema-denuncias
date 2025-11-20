import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Placeholder para las páginas (luego crearemos los archivos reales)
// const Login = () => <h2>Página de Login</h2>;
//const Dashboard = () => <h2>Panel de Denuncias (Mapa)</h2>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Definimos las rutas de nuestra app */}
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;