import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './components/Login';
import Home from './components/Home';
import InserimentoRichiestaMutuoPage from './components/InserimentoRichiestaMutuoPage';
import AnagraficaForm from './components/AnagraficaForm';
import RichiesteInoltrate from "./components/RichiesteInoltrate";
import 'bootstrap-icons/font/bootstrap-icons.css';

import { AuthProvider } from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';

// IMPORTAZIONE axios e configurazione interceptor
import axios from 'axios';

axios.interceptors.request.use(
    config => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Rotte protette */}
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Layout>
                                <Home />
                            </Layout>
                        </ProtectedRoute>
                    } />

                    <Route path="/anagrafica" element={
                        <ProtectedRoute>
                            <Layout>
                                <AnagraficaForm />
                            </Layout>
                        </ProtectedRoute>
                    } />

                    <Route path="/richiesta_mutuo" element={
                        <ProtectedRoute>
                            <Layout>
                                <InserimentoRichiestaMutuoPage />
                            </Layout>
                        </ProtectedRoute>
                    } />

                    <Route path="/richieste_inoltrate" element={
                        <ProtectedRoute>
                            <Layout>
                                <RichiesteInoltrate />
                            </Layout>
                        </ProtectedRoute>
                    } />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;