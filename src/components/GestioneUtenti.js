import { useEffect, useState } from "react";
import axios from "../api/axiosInstance"; // usa il tuo axios con interceptor
import Swal from "sweetalert2";

const emptyForm = { nome:"", cognome:"", email:"", password:"", ruoloId:"", filialeId:"" };

export default function GestioneUtenti() {
  const [utenti, setUtenti] = useState([]);
  const [ruoli, setRuoli] = useState([]);
  const [filiali, setFiliali] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [uRes, rRes, fRes] = await Promise.all([
        axios.get("/users"),
        axios.get("/ruoli").catch(() => ({ data: [] })),
        axios.get("/filiali").catch(() => ({ data: [] }))
      ]);
      setUtenti(uRes.data || []);
      setRuoli(rRes.data || []);
      setFiliali(fRes.data || []);
    } catch (e) {
      Swal.fire({ icon:"error", title:"Errore", text:"Impossibile caricare utenti/ruoli/filiali" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleModifica = (u) => {
    setEditId(u.id);
    setForm({
      nome: u.nome || "",
      cognome: u.cognome || "",
      email: u.email || "",
      password: "",
      ruoloId: u.ruoloId || u?.ruolo?.id || "",
      filialeId: u.filialeId || u?.filiale?.id || ""
    });
    setShowForm(true);
  };

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nome: form.nome,
        cognome: form.cognome,
        email: form.email,
        ruoloId: form.ruoloId ? Number(form.ruoloId) : null,
        filialeId: form.filialeId ? Number(form.filialeId) : null
      };
      if (!editId) payload.password = form.password;

      if (editId) {
        // se password valorizzata, la inviamo (cambio password)
        if (form.password && form.password.trim()) payload.password = form.password;
        await axios.put(`/users/${editId}`, payload);
      } else {
        await axios.post("/users", payload);
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditId(null);
      await loadAll();
      Swal.fire({ icon:"success", title:"Operazione riuscita" });
    } catch (err) {
      Swal.fire({
        icon:"error",
        title:"Errore",
        text: err.response?.data?.message || "Salvataggio non riuscito"
      });
    }
  };

  const handleElimina = async (id) => {
    const ok = await Swal.fire({
      title:"Eliminare l'utente?",
      text:"L'utente verrà disattivato.",
      icon:"warning",
      showCancelButton:true,
      confirmButtonText:"Sì, elimina",
      cancelButtonText:"Annulla"
    }).then(r => r.isConfirmed);
    if (!ok) return;

    try {
      await axios.delete(`/users/${id}`);
      await loadAll();
      Swal.fire({ icon:"success", title:"Utente eliminato" });
    } catch {
      Swal.fire({ icon:"error", title:"Errore", text:"Eliminazione non riuscita" });
    }
  };

const handleRestore = async (id) => {
  try {
    await axios.put(`/users/${id}/restore`);
    await loadAll();
    Swal.fire({ icon: "success", title: "Utente ripristinato" });
  } catch {
    Swal.fire({ icon: "error", title: "Errore", text: "Ripristino non riuscito" });
  }
};

  const ruoloLabel = (u) => u.ruoloDescrizione || u?.ruolo?.descrizioneRuolo || "-";
  const ruoloCodice = (u) => u.ruoloCodice || u?.ruolo?.codice || "";
  const filialeLabel = (u) => {
    const descrizione = u.filialeDescrizione || u?.filiale?.descrizioneFiliale || "-";
    const indirizzo = u.filialeIndirizzo || u?.filiale?.indirizzo || "-";
    return indirizzo ? `${descrizione} - ${indirizzo}` : descrizione;
  }
  const filialeCodice = (u) => u.filialeCodice || u?.filiale?.codice || "";

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="m-0">Gestione utenti</h3>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg me-1" /> Nuovo utente
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">{editId ? "Modifica utente" : "Nuovo utente"}</h5>
            <form className="row g-3" onSubmit={save}>
              <div className="col-md-3">
                <label className="form-label">Nome</label>
                <input className="form-control" name="nome" value={form.nome} onChange={onChange} required/>
              </div>
              <div className="col-md-3">
                <label className="form-label">Cognome</label>
                <input className="form-control" name="cognome" value={form.cognome} onChange={onChange} required/>
              </div>
              <div className="col-md-3">
                <label className="form-label">Email / Username</label>
                <input className="form-control" name="email" value={form.email} onChange={onChange} required/>
              </div>
              <div className="col-md-3">
                <label className="form-label">Ruolo</label>
                <select className="form-select" name="ruoloId" value={form.ruoloId} onChange={onChange} required>
                  <option value="">Seleziona…</option>
                  {ruoli.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.descrizioneRuolo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Filiale</label>
                <select className="form-select" name="filialeId" value={form.filialeId} onChange={onChange} required>
                    <option value="">Seleziona…</option>
                    {filiali.map(f => (
                        <option key={f.id} value={f.id}>
                            {f.descrizioneFiliale}{f.indirizzo ? ` - ${f.indirizzo}` : ""}
                        </option>
                    ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">{editId ? "Nuova password (opzionale)" : "Password"}</label>
                <input type="password" className="form-control"
                       name="password" value={form.password} onChange={onChange}
                       {...(editId ? {} : {required: true})}/>
              </div>
              <div className="col-12 d-flex gap-2">
                <button type="submit" className="btn btn-success">
                  {editId ? "Aggiorna" : "Crea"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}>
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th>Nome</th>
              <th>Cognome</th>
              <th>Email</th>
              <th>Password</th>
              <th>Ruolo</th>
              <th>Filiale</th>
              <th>Stato</th>
              <th className="text-center" style={{width: 160}}>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-4">Caricamento…</td></tr>
            ) : utenti.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-4">Nessun utente presente.</td></tr>
            ) : (
              utenti.map(u => (
                <tr key={u.id}>
                  <td>{u.nome}</td>
                  <td>{u.cognome}</td>
                  <td>{u.email}</td>
                  {/* Password nascosta (placeholder) */}
                  <td>••••••••</td>
                  <td>
                    {ruoloLabel(u)}
                    {ruoloCodice(u) ? ` (${ruoloCodice(u)})` : ""}
                  </td>
                  <td>
                    {filialeLabel(u)}
                    {filialeCodice(u) ? ` (${filialeCodice(u)})` : ""}
                  </td>
                  <td>{u.stato === 1 ? "Attivo" : "Disattivo"}</td>
                  <td className="text-center">
                    {u.stato === 1 ? (
                        <>
                            {/*Button modifica*/}
                            <button
                                className="btn btn-sm btn-outline-primary rounded-circle"
                                aria-label="Clicca per modificare"
                                title="Clicca per modificare"
                                type="button"
                                onClick={() => handleModifica(u)}
                            >
                                <i className="fas fa-edit" aria-hidden="true"></i>
                            </button>
                            {/*Button elimina*/}
                            <button
                                className="btn btn-sm btn-outline-danger rounded-circle"
                                aria-label="Clicca per eliminare"
                                title="Clicca per eliminare"
                                type="button"
                                onClick={() => handleElimina(u.id)}
                            >
                                <i className="fas fa-trash" aria-hidden="true"></i>
                            </button>
                        </>
                    ) :(
                        <button
                            className="btn btn-sm btn-outline-primary rounded-circle"
                            aria-label="Clicca per ripristinare"
                            title="Clicca per ripristinare"
                            type="button"
                            onClick={() => handleRestore(u.id)}
                        >
                            <i className="fas fa-undo" aria-hidden="true"></i>
                        </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
