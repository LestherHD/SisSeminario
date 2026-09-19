import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext();
const TIEMPO_INACTIVIDAD_MS = 30 * 60 * 1000;

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const temporizadorInactividad = useRef(null);

  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    setUsuario(null);
  }, []);

  useEffect(() => {
    // Elimina tokens persistentes creados por versiones anteriores.
    localStorage.removeItem('token');
    const token = sessionStorage.getItem('token');

    if (!token) {
      setCargando(false);
      return;
    }

    const cargarUsuario = async () => {
      try {
        const response = await api.get('/auth/perfil');
        setUsuario(response.data.usuario);
      } catch (error) {
        sessionStorage.removeItem('token');
        setUsuario(null);
      } finally {
        setCargando(false);
      }
    };

    cargarUsuario();
  }, []);

  useEffect(() => {
    if (!usuario) return undefined;

    const reiniciarTemporizador = () => {
      clearTimeout(temporizadorInactividad.current);
      temporizadorInactividad.current = setTimeout(logout, TIEMPO_INACTIVIDAD_MS);
    };

    const eventosActividad = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    eventosActividad.forEach((evento) =>
      window.addEventListener(evento, reiniciarTemporizador, { passive: true })
    );
    reiniciarTemporizador();

    return () => {
      clearTimeout(temporizadorInactividad.current);
      eventosActividad.forEach((evento) =>
        window.removeEventListener(evento, reiniciarTemporizador)
      );
    };
  }, [logout, usuario]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    sessionStorage.setItem('token', response.data.token);
    setUsuario(response.data.usuario);
    return response.data.usuario;
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
