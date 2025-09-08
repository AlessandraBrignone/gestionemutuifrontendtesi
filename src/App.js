import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './components/Login';
import Home from './components/Home';
import InserimentoRichiestaMutuoPage from './components/InserimentoRichiestaMutuoPage';
import AnagraficaForm from './components/AnagraficaForm';
import RichiesteInoltrate from "./components/RichiesteInoltrate";
import GestioneUtenti from "./components/GestioneUtenti";
import 'bootstrap-icons/font/bootstrap-icons.css';

import { AuthProvider } from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import RequireRole from './auth/RequireRole';
import ForbidRole from "./auth/ForbidRole";

import axios from 'axios';

// Interceptor: prende il token da sessionStorage (e fallback su localStorage)
axios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Rotte protette (solo autenticati) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ForbidRole role="ADMIN" redirect="/admin/utenti">
                    <Layout>
                      <Home />
                    </Layout>
                </ForbidRole>
              </ProtectedRoute>
            }
          />

          <Route
              path="/anagrafica"
              element={
                <ProtectedRoute>
                  <ForbidRole role="ADMIN" redirect="/admin/utenti">
                    <Layout>
                      <AnagraficaForm />
                    </Layout>
                  </ForbidRole>
                </ProtectedRoute>
              }
            />

          <Route
              path="/richiesta_mutuo"
              element={
                <ProtectedRoute>
                  <ForbidRole role="ADMIN" redirect="/admin/utenti">
                    <Layout>
                      <InserimentoRichiestaMutuoPage />
                    </Layout>
                  </ForbidRole>
                </ProtectedRoute>
              }
            />

            <Route
              path="/richieste_inoltrate"
              element={
                <ProtectedRoute>
                  <ForbidRole role="ADMIN" redirect="/admin/utenti">
                    <Layout>
                      <RichiesteInoltrate />
                    </Layout>
                  </ForbidRole>
                </ProtectedRoute>
              }
            />

          {/* Rotta ADMIN: autenticato + ruolo ADMIN */}
          <Route
            path="/admin/utenti"
            element={
              <ProtectedRoute>
                <RequireRole role="ADMIN">
                  <Layout>
                    <GestioneUtenti />
                  </Layout>
                </RequireRole>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;