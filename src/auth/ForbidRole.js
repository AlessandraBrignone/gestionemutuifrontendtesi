import { Navigate } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "./AuthContext";

export default function ForbidRole({ role = "ADMIN", redirect = "/admin/utenti", children }) {
  const ctxUser = useContext(AuthContext)?.user;
  const lsUser = (() => {
    const raw = localStorage.getItem("utente");
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  })();
  const user = ctxUser ?? lsUser;

  const code =
    user?.ruolo?.codice ||
    (user?.ruolo?.descrizioneRuolo
      ? user.ruolo.descrizioneRuolo.toUpperCase().replace(/[^A-Z0-9]/g, "_")
      : "");

  // Se il ruolo è vietato (es. ADMIN), reindirizza alla pagina admin
  return code === role ? <Navigate to={redirect} replace /> : children;
}
