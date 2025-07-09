import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import AuthContext from '../auth/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles.css';

const Layout = ({ children }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const { token, logout } = useContext(AuthContext);
    const [utente, setUtente] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem("utente");
        console.log("Contenuto localStorage.utente:", storedUser);

        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                console.log("Utente:", parsedUser);
                setUtente(parsedUser);
            } catch (e) {
                console.error("Errore parsing utente:", e);
            }
        }
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="layout-wrapper d-flex">
            {/* Sidebar */}
            <div className={`sidebar bg-dark text-white ${isSidebarOpen ? 'open' : 'collapsed'}`}>
                <div className="p-3 d-flex justify-content-center">
                    <span className="fw-bold fs-5 text-center">
                        {isSidebarOpen ? 'Bri-Bank' : 'BB'}
                    </span>
                </div>
                <ul className="nav flex-column mt-4">
                    <li className="nav-item">
                        <NavLink to="/" className="nav-link text-white d-flex align-items-center">
                            <i className="bi bi-house-door me-2"></i>
                            {isSidebarOpen && 'Home'}
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/anagrafica" className="nav-link text-white d-flex align-items-center">
                            <i className="bi bi-person-lines-fill me-2"></i>
                            {isSidebarOpen && 'Anagrafica'}
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/richiesta_mutuo" className="nav-link text-white d-flex align-items-center">
                            <i className="bi bi-cash-coin me-2"></i>
                            {isSidebarOpen && 'Inserimento mutuo'}
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/richieste_inoltrate" className="nav-link text-white d-flex align-items-center">
                            <i className="bi bi-file-earmark-text me-2"></i>
                            {isSidebarOpen && 'Richieste inoltrate'}
                        </NavLink>
                    </li>
                </ul>
            </div>

            {/* Main Content */}
            <div className="flex-grow-1">
                <nav className="navbar navbar-light bg-light px-3">
                    <button className="btn btn-custom-toggle me-3" onClick={() => setSidebarOpen(!isSidebarOpen)}>
                        <i className="bi bi-list"></i>
                    </button>
                    <div className="ms-auto d-flex align-items-center">
                        <span className="me-2">{utente?.email || "Username"}</span>
                        {token && (
                            <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">Logout</button>
                        )}
                    </div>
                </nav>
                <main className="p-4">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
