import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setCargando(false);
      return;
    }

    const cargarUsuario = async () => {
      try {
        const response = await api.get('/auth/perfil');
        setUsuario(response.data.usuario);
      } catch (error) {
        localStorage.removeItem('token');
        setUsuario(null);
      } finally {
        setCargando(false);
      }
    };

    cargarUsuario();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    setUsuario(response.data.usuario);
    return response.data.usuario;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
