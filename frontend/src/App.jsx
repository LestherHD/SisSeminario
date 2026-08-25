import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import ConsultarCarnet from './pages/ConsultarCarnet.jsx';
import Inicio from './pages/Inicio.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Comunidades from './pages/Comunidades.jsx';
import Padres from './pages/Padres.jsx';
import Ninos from './pages/Ninos.jsx';
import Vacunas from './pages/Vacunas.jsx';
import Crecimiento from './pages/Crecimiento.jsx';
import Vacunacion from './pages/Vacunacion.jsx';
import Alertas from './pages/Alertas.jsx';
import { useAuth } from './context/AuthContext.jsx';

function App() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <p>Cargando...</p>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={usuario ? <Navigate to="/inicio" /> : <Login />}
      />
      <Route path="/consultar" element={<ConsultarCarnet />} />
      <Route path="/carnet/:codigo" element={<ConsultarCarnet />} />

      <Route element={usuario ? <Layout /> : <Navigate to="/login" />}>
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/comunidades" element={<Comunidades />} />
        <Route path="/padres" element={<Padres />} />
        <Route path="/ninos" element={<Ninos />} />
        <Route path="/vacunas" element={<Vacunas />} />
        <Route path="/crecimiento" element={<Crecimiento />} />
        <Route path="/vacunacion" element={<Vacunacion />} />
        <Route path="/alertas" element={<Alertas />} />
      </Route>

      <Route
        path="/"
        element={<Navigate to={usuario ? '/inicio' : '/login'} />}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
