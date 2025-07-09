import { useState, useContext } from "react";
import AuthContext from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import Swal from 'sweetalert2';
import './css/Login.css'

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:8080/api/auth/login", { email, password });

            if (response.data && response.data.token) {
                // Salva il token nel contesto auth
                login(response.data.token);

                sessionStorage.setItem("token", response.data.token);
                //SALVA L'UTENTE NEL LOCAL STORAGE
                localStorage.setItem("utente", JSON.stringify(response.data.utente));

                navigate("/");
            } else {
                throw new Error("Token non ricevuto");
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Login Fallito',
                text: 'Credenziali non valide. Riprova.',
            });
        }
    };

    return (
        <div className="login-page"
            style={{
                backgroundImage: "url('/imgLogin.jpg')",
            }}>
          <div className="login-overlay"></div>
          <div className="login-content">
            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-avatar">
                <img src="/BriBankLogo2.png" alt="BRI-BANK logo" />
              </div>
              <h2>Login</h2>
              <p className="text-muted">Sign in to your member area</p>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">SIGN IN</button>
                    {/*
                    <div className="login-footer">
                        <a href="#">Forgot password?</a>
                        <p>Do not have an account? <span>Sign Up</span></p>
                    </div>
                    */}
                </form>
            </div>
        </div>
    );
};

export default Login;