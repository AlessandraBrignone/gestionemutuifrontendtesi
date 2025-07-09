import React, { useState } from 'react';
import axios from '../api/axiosInstance';
import Swal from 'sweetalert2';
import { searchAnagrafica } from '../services/AnagraficaSearch';

// Funzione di conversione data da formato ISO a italiano
function formatDateForDisplay(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const AnagraficaRichiedente = ({ onCompletamento, selezionati, setSelezionati }) => {
    const [tipoRichiedente, setTipoRichiedente] = useState('intestatario');
//    const [includeGarante, setIncludeGarante] = useState(false);
    const [anagrafiche, setAnagrafiche] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState({});

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearch(prev => ({ ...prev, [name]: value }));
    };

    //Funzione per la ricerca
    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const risultati = await searchAnagrafica(search, { onlyActive: true });

            if (risultati.length) {
                setAnagrafiche(risultati);
                setShowModal(true);           // mostra la modale come prima
            } else {
                setAnagrafiche([]);
                Swal.fire({ icon:'info', title:'Nessun risultato', text:'Nessun elemento presente.' });
            }
        } catch {
            Swal.fire({ icon:'error', title:'Errore', text:'Errore nella ricerca' });
        }
    };

    //Funzione per aggiungere l'utente selezionato
    const aggiungiSelezionato = (persona) => {
        if (!selezionati.some(p => p.codiceFiscale === persona.codiceFiscale)) {
            const nuoviSelezionati = [...selezionati, { ...persona, tipo: tipoRichiedente }];
            setSelezionati(nuoviSelezionati);
            setShowModal(false);
        } else {
            Swal.fire('Attenzione', 'Questa persona è già stata aggiunta.', 'warning');
        }
    };

    //Funzione per cambiare il tipo richeidente
    const handleTipoRichiedenteChange = (index, value) => {
        const nuoviSelezionati = [...selezionati];
        nuoviSelezionati[index].tipo = value;
        setSelezionati(nuoviSelezionati);
    };

    //Funzione per rimuovere l'utente
    const rimuoviUtente = (index) => {
        const nuovi = selezionati.filter((_, i) => i !== index);
        setSelezionati(nuovi);
    }

    //Funzione per andare Avanti
    const handleAvanti = () => {
        if (selezionati.length === 0) {
            Swal.fire('Attenzione', 'Devi selezionare almeno una persona prima di proseguire.', 'warning');
            return;
        }
        //Verifica che intestatario sia presente
        const intestatarioPresent = selezionati.some(p => p.tipo === "intestatario");
        if (!intestatarioPresent) {
            Swal.fire('Attenzione', 'Impossibile procedere, indicare almeno un intestatario', 'warning');
            return;
        }

        if (onCompletamento) {
            onCompletamento(selezionati);
        }
    };

    return (
        <div className="container py-5" style={{ maxWidth: 1200 }}>
            <h2 className="text-center mb-5" style={{ fontWeight: 700, fontSize: '2.5rem', color: '#111' }}>Anagrafica richiedente</h2>

            {/* Sezione Ricerca */}
            <section className="mb-5 p-4 rounded shadow-sm" style={{ backgroundColor: '#fff' }}>
                <h4 className="mb-4" style={{ fontWeight: 600, color: '#333' }}>Anagrafica richiedente</h4>
                <form className="mb-4" onSubmit={handleSearch}>
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label htmlFor="nomeRicercaRichiedente" className="form-label">Nome</label>
                            <input
                                type="text"
                                className="form-control"
                                id="nomeRicercaRichiedente"
                                name="nome"
                                value={search.nome || ''}
                                onChange={handleSearchChange}
                                placeholder="Inserisci nome"
                                autoComplete="off"
                            />
                        </div>
                        <div className="col-md-4">
                            <label htmlFor="cognomeRicercaRichiedente" className="form-label">Cognome</label>
                            <input
                                type="text"
                                className="form-control"
                                id="cognomeRicercaRichiedente"
                                name="cognome"
                                value={search.cognome || ''}
                                onChange={handleSearchChange}
                                placeholder="Inserisci cognome"
                                autoComplete="off"
                            />
                        </div>
                        <div className="col-md-4">
                            <label htmlFor="codiceFiscaleRicercaRichiedente" className="form-label">Codice Fiscale</label>
                            <input
                                type="text"
                                className="form-control"
                                id="codiceFiscaleRicercaRichiedente"
                                name="codiceFiscale"
                                value={search.codiceFiscale || ''}
                                onChange={handleSearchChange}
                                placeholder="Inserisci codice fiscale"
                                autoComplete="off"
                            />
                        </div>
                    </div>
                    <div className="text-center mt-4">
                        <button type="submit" className="btn btn-primary px-5 py-2" style={{ fontWeight: 600 }}>
                            Cerca
                        </button>
                    </div>
                </form>
            </section>

            {/* Risultati Ricerca nella modale */}
            {showModal && (
                <div
                    className="modal show fade d-block"
                    tabIndex="-1"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modalTitle"
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                        <div className="modal-content rounded shadow-sm">
                            <div className="modal-header">
                                <h5 className="modal-title" id="modalTitle" style={{ fontWeight: 600 }}>
                                    Risultati Ricerca
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    aria-label="Close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {anagrafiche.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-bordered align-middle mb-0">
                                            <thead>
                                            <tr>
                                                <th>Codice Fiscale</th>
                                                <th>Nome</th>
                                                <th>Cognome</th>
                                                <th>Data di Nascita</th>
                                                <th>Azioni</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {anagrafiche.map((a) => (
                                                <tr key={a.id || a.codiceFiscale}>
                                                    <td>{a.codiceFiscale}</td>
                                                    <td>{a.nome}</td>
                                                    <td>{a.cognome}</td>
                                                    <td>{formatDateForDisplay(a.dataNascita)}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary rounded-circle"
                                                            aria-label={`Aggiungi ${a.nome} ${a.cognome}`}
                                                            title="Clicca per aggiungere"
                                                            type="button"
                                                            onClick={() => aggiungiSelezionato(a)}
                                                        >
                                                            <i className="fas fa-check" aria-hidden="true"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="alert alert-warning text-center">Nessun elemento presente.</div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    Chiudi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabella con anagrafiche selezionate*/}
            {selezionati.length > 0 && (
                <section className="mb-5 p-4 rounded shadow-sm" style={{ backgroundColor: '#fff' }}>
                    <h4 className="mb-4" style={{ fontWeight: 600, color: '#333' }}>Anagrafiche selezionate</h4>
                    <div className="table-responsive">
                        <table className="table table-bordered align-middle mb-3">
                            <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Cognome</th>
                                <th>Codice fiscale</th>
                                <th>Tipo richiedente</th>
                                <th>Azioni</th>
                            </tr>
                            </thead>
                            <tbody>
                            {selezionati.map((a, idx) => (
                                <tr key={a.codiceFiscale + idx}>
                                    <td>{a.nome}</td>
                                    <td>{a.cognome}</td>
                                    <td>{a.codiceFiscale}</td>
                                    <td>
                                        <select
                                            className="form-select"
                                            aria-label={`Seleziona tipo richiedente per ${a.nome} ${a.cognome}`}
                                            value={a.tipo || 'intestatario'}
                                            onChange={(e) => handleTipoRichiedenteChange(idx, e.target.value)}
                                            style={{ maxWidth: '180px' }}
                                        >
                                            <option value="intestatario">Intestatario</option>
                                            <option value="cointestatario">Cointestatario</option>
                                            <option value="garante">Garante</option>
                                        </select>
                                    </td>
                                    <td className="text-center">
                                        <button
                                            className="btn btn-sm btn-outline-danger rounded-circle"
                                            aria-label={'Rimuovi $(a.nome) $(a.cognome)'}
                                            title="Rimuovi"
                                            type="button"
                                            onClick={() => rimuoviUtente(idx)}
                                        >
                                            <i className="fas fa-trash" aria-hidden="true"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="text-center">
                        <button
                            className="btn btn-success px-4 py-2"
                            style={{ fontWeight: 600 }}
                            onClick={handleAvanti}
                            aria-label="Avanti al tab successivo"
                        >
                            Avanti
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
};

export default AnagraficaRichiedente;
