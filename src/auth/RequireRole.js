import { Navigate } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "./AuthContext";

export default function RequireRole({ role = "ADMIN", children }) {
  const ctxUser = useContext(AuthContext)?.user;
  const lsUser = (() => {
    const raw = localStorage.getItem("utente");
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  })();
  const user = ctxUser ?? lsUser;

  if (!user) return <Navigate to="/login" replace />;

  const code =
    user?.ruolo?.codice ||
    (user?.ruolo?.descrizioneRuolo
      ? user.ruolo.descrizioneRuolo.toUpperCase().replace(/[^A-Z0-9]/g, "_")
      : "");

  return code === role ? children : <Navigate to="/" replace />;
}
