import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
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
          usuario ? (
            <div style={{ padding: 20 }}>
              <h1>Bienvenido {usuario.nombre}</h1>
              <p>Rol: {usuario.rol}</p>
              <p>(Aquí irá la pantalla de comunidades)</p>
            </div>
          ) : (
            <Navigate to="/login" />
          )
        }
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
