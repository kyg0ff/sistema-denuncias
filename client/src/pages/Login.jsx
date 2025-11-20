import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', formData);
      
      // GUARDAR EL TOKEN: Esto es clave. Lo guardamos en el navegador.
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));

      alert('Bienvenido ' + response.data.usuario.nombre);
      navigate('/dashboard'); // Redirigir al mapa/dashboard

    } catch (error) {
      alert(error.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <input 
          type="email" 
          name="email" 
          placeholder="Tu correo electrónico"
          required 
          style={{ padding: '10px' }}
          onChange={handleChange}
        />

        <input 
          type="password" 
          name="password" 
          placeholder="Tu contraseña"
          required 
          style={{ padding: '10px' }}
          onChange={handleChange}
        />

        <button type="submit" style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}>
          Entrar
        </button>
      </form>
      
      <p style={{ marginTop: '20px' }}>
        ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
      </p>
    </div>
  );
};

export default Login;