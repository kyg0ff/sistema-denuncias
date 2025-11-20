import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Para redirigir al login

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'ciudadano' // Valor por defecto
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Petición al Backend
      const response = await axios.post('https://sistema-denuncias-t26t.onrender.com/api/auth/register', formData);
      alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
      navigate('/'); // Redirigir al Login
    } catch (error) {
      alert(error.response?.data?.error || 'Error al registrarse');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Crear Cuenta</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Nombre Completo:</label>
          <input 
            type="text" 
            name="nombre" 
            required 
            style={{ width: '100%', padding: '8px' }}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <input 
            type="email" 
            name="email" 
            required 
            style={{ width: '100%', padding: '8px' }}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Contraseña:</label>
          <input 
            type="password" 
            name="password" 
            required 
            style={{ width: '100%', padding: '8px' }}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Soy:</label>
          <select name="rol" onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
            <option value="ciudadano">Ciudadano</option>
            <option value="autoridad">Autoridad (Prueba)</option>
          </select>
        </div>

        <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Registrarse
        </button>
      </form>
    </div>
  );
};

export default Register;