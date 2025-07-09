import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import AuthContext from "./AuthContext";

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(sessionStorage.getItem("token"));

    const login = (newToken) => {
        sessionStorage.setItem("token", newToken);
        setToken(newToken);
    };

    const logout = () => {
        setToken(null);
        sessionStorage.removeItem("token");
    };

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
