import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Comunidades from './pages/Comunidades.jsx';
import Padres from './pages/Padres.jsx';
import Ninos from './pages/Ninos.jsx';
import Vacunas from './pages/Vacunas.jsx';
import Crecimiento from './pages/Crecimiento.jsx';
import Vacunacion from './pages/Vacunacion.jsx';
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
        element={usuario ? <Navigate to="/comunidades" /> : <Login />}
      />
      <Route
        path="/comunidades"
        element={
          usuario ? <Comunidades /> : <Navigate to="/login" />
        }
      />
      <Route
        path="/padres"
        element={usuario ? <Padres /> : <Navigate to="/login" />}
      />
      <Route
        path="/ninos"
        element={usuario ? <Ninos /> : <Navigate to="/login" />}
      />
      <Route
        path="/vacunas"
        element={usuario ? <Vacunas /> : <Navigate to="/login" />}
      />
      <Route
        path="/crecimiento"
        element={usuario ? <Crecimiento /> : <Navigate to="/login" />}
      />
      <Route
        path="/vacunacion"
        element={usuario ? <Vacunacion /> : <Navigate to="/login" />}
      />
      <Route
        path="/"
        element={<Navigate to={usuario ? '/comunidades' : '/login'} />}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
