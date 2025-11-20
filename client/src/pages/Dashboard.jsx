import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Registramos los componentes del gráfico
ChartJS.register(ArcElement, Tooltip, Legend);

// --- COMPONENTE 1: VISTA CIUDADANO (MAPA) ---
const VistaCiudadano = ({ usuario, handleLogout }) => {
  const [posicion, setPosicion] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState(null);
  const center = [-16.4090, -71.5375]; // Coordenadas base

  function LocationMarker() {
    useMapEvents({
      click(e) { setPosicion(e.latlng); },
    });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!posicion || !descripcion) return alert("Faltan datos");

    const formData = new FormData();
    formData.append('latitud', posicion.lat);
    formData.append('longitud', posicion.lng);
    formData.append('descripcion', descripcion);
    formData.append('direccion', 'Ubicación mapa');
    if (archivo) formData.append('foto', archivo);

    try {
      const token = localStorage.getItem('token');
      await axios.post('https://sistema-denuncias-t26t.onrender.com/api/reports', formData, {
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
      });
      alert('¡Denuncia enviada!');
      setDescripcion(''); setPosicion(null); setArchivo(null);
    } catch (error) { alert('Error al enviar'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Panel Ciudadano: {usuario.nombre}</h2>
        <button onClick={handleLogout} style={{background:'red', color:'white'}}>Salir</button>
      </div>
      <div style={{ height: '300px', border: '1px solid #ccc', marginBottom: '20px' }}>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker />
          {posicion && <Marker position={posicion}><Popup>Aquí</Popup></Marker>}
        </MapContainer>
      </div>
      <form onSubmit={handleSubmit} style={{ background: '#eee', padding: '15px' }}>
        <h3>Reportar Problema</h3>
        <p>Ubicación: {posicion ? 'Seleccionada' : 'Haz clic en el mapa'}</p>
        <textarea placeholder="Describe el problema..." value={descripcion} onChange={e=>setDescripcion(e.target.value)} style={{width:'100%', marginBottom:'10px'}} />
        <input type="file" onChange={e=>setArchivo(e.target.files[0])} style={{marginBottom:'10px'}} />
        <br/>
        <button type="submit">Enviar Reporte</button>
      </form>
    </div>
  );
};

// --- COMPONENTE 2: VISTA AUTORIDAD (TABLA) ---
const VistaAutoridad = ({ usuario, handleLogout }) => {
    const [denuncias, setDenuncias] = useState([]);
    const [statsData, setStatsData] = useState(null); // Estado para la gráfica

    const cargarDatos = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };

            // 1. Cargar Lista
            const resLista = await axios.get('https://sistema-denuncias-t26t.onrender.com/api/reports/admin/todas', config);
            setDenuncias(resLista.data);

            // 2. Cargar Estadísticas
            const resStats = await axios.get('https://sistema-denuncias-t26t.onrender.com/api/reports/admin/stats', config);
            prepararGrafico(resStats.data);

        } catch (error) { console.error(error); }
    };

    const prepararGrafico = (datosBackend) => {
        // Transformamos los datos de SQL a formato Chart.js
        // Ejemplo SQL: [{estado: 'pendiente', total: 5}, {estado: 'resuelto', total: 2}]
        
        const contadores = { pendiente: 0, resuelto: 0, rechazado: 0 };
        
        datosBackend.forEach(item => {
            contadores[item.estado] = parseInt(item.total);
        });

        setStatsData({
            labels: ['Pendiente', 'Resuelto', 'Rechazado'],
            datasets: [
                {
                    label: '# de Denuncias',
                    data: [contadores.pendiente, contadores.resuelto, contadores.rechazado],
                    backgroundColor: [
                        'rgba(255, 206, 86, 0.6)', // Amarillo (Pendiente)
                        'rgba(75, 192, 192, 0.6)', // Verde (Resuelto)
                        'rgba(255, 99, 132, 0.6)', // Rojo (Rechazado)
                    ],
                    borderColor: [
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)',
                    ],
                    borderWidth: 1,
                },
            ],
        });
    };

    const cambiarEstado = async (id, nuevoEstado) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`https://sistema-denuncias-t26t.onrender.com/api/reports/${id}/estado`, 
                { estado: nuevoEstado },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            cargarDatos(); // Recargar todo (lista y gráfica)
        } catch (error) { alert('Error al actualizar'); }
    };

    useEffect(() => { cargarDatos(); }, []);

    return (
        <div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>Panel de Control (Autoridad): {usuario.nombre}</h2>
                <button onClick={handleLogout} style={{background:'red', color:'white'}}>Salir</button>
            </div>
            
            {/* SECCIÓN DE ESTADÍSTICAS */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', maxHeight: '300px' }}>
                {statsData ? (
                    <div style={{ width: '300px' }}>
                        <h3 style={{textAlign: 'center'}}>Resumen de Estado</h3>
                        <Pie data={statsData} />
                    </div>
                ) : <p>Cargando estadísticas...</p>}
            </div>

            {/* TABLA DE DATOS */}
            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{background: '#333', color: 'white'}}>
                        <th>Fecha</th>
                        <th>Ciudadano</th>
                        <th>Descripción</th>
                        <th>Foto</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {denuncias.map(d => (
                        <tr key={d.id} style={{textAlign:'center'}}>
                            <td>{new Date(d.fecha_creacion).toLocaleDateString()}</td>
                            <td>{d.ciudadano_nombre}</td>
                            <td>{d.descripcion}</td>
                            <td>
                                {d.foto_url ? (
                                    <a href={`https://sistema-denuncias-t26t.onrender.com${d.foto_url}`} target="_blank" rel="noreferrer">
                                        <img src={`https://sistema-denuncias-t26t.onrender.com${d.foto_url}`} alt="Evidencia" style={{width:'50px', height:'50px', objectFit:'cover'}} />
                                    </a>
                                ) : 'Sin foto'}
                            </td>
                            <td>
                                <span style={{
                                    padding: '5px', 
                                    borderRadius:'4px',
                                    background: d.estado === 'resuelto' ? 'green' : d.estado === 'pendiente' ? 'gold' : 'red',
                                    color: d.estado === 'pendiente' ? 'black' : 'white'
                                }}>
                                    {d.estado.toUpperCase()}
                                </span>
                            </td>
                            <td>
                                {d.estado === 'pendiente' && (
                                    <>
                                        <button onClick={() => cambiarEstado(d.id, 'resuelto')} style={{background:'green', color:'white', marginRight:'5px'}}>Resolver</button>
                                        <button onClick={() => cambiarEstado(d.id, 'rechazado')} style={{background:'red', color:'white'}}>Rechazar</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const Dashboard = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const userStore = localStorage.getItem('usuario');
    if (!userStore) return navigate('/');
    setUsuario(JSON.parse(userStore));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
  };

  if (!usuario) return <p>Cargando...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      {usuario.rol === 'autoridad' ? (
        <VistaAutoridad usuario={usuario} handleLogout={handleLogout} />
      ) : (
        <VistaCiudadano usuario={usuario} handleLogout={handleLogout} />
      )}
    </div>
  );
};

export default Dashboard;