import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Swal from 'sweetalert2';
import { useLocation, useNavigate } from 'react-router-dom';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import CaricaDocumenti from './CaricaDocumenti';
import './css/RichiesteInoltrate.css'
import Modal from 'react-bootstrap/Modal';

function formatCurrency(value) {
    if (!value && value !== 0) return "";
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
}

const RichiesteInoltrate = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const richiestaIdParam = new URLSearchParams(location.search).get("id");

    const [utente, setUtente] = useState(null);
    const [ruoloId, setRuoloId] = useState(null);
    const [richieste, setRichieste] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [durate, setDurate] = useState([]);
    const [cadenze, setCadenze] = useState([]);
    const [tipiMutuo, setTipiMutuo] = useState([]);
    const [posizioneLavorativaIn, setPosizioneLavorativaIn] = useState([]);
    const [filtrate, setFiltrate] = useState([]);
    const [search, setSearch] = useState({ nome: '', cognome: '', codiceFiscale: '', idMutuo: '', statoRichiesta: '' });
    const [openRow, setOpenRow] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [richiestaSelezionata, setRichiestaSelezionata] = useState(null);
    const [showRifiutoModal, setShowRifiutoModal] = useState(false);
    const [noteRifiuto, setNoteRifiuto] = useState("");

    //Recuperare l'utente connesso
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("utente"));
        console.log("storedUser:", storedUser);
        if (storedUser) {
            setUtente(storedUser);
            setRuoloId(storedUser?.ruolo?.id);
        }
    }, []);

    //Recupera l'utente loggato
    useEffect(() => {
        if (!utente) return;
        const params = { nomeRicercaRichiedente: null, cognomeRicercaRichiedente: null, codiceFiscaleRicercaRichiedente: null, idMutuo: null };

        axios.post("/richiesta_mutuo/ricerca", params)
            .then(res => {
                let richieste = res.data.data;
                if (ruoloId === 2) {
                    richieste = richieste.filter(r => r.statoRichiesta === "INVIATA");
                }
                setRichieste(richieste);
                setFiltrate(richieste);
            })
            .catch(() => Swal.fire("Errore", "Errore nel caricamento delle richieste", "error"));
    }, [utente, ruoloId]);

    // Caricare dati Durata, cadenza rata e tipo mutuo
    useEffect(() => {
        axios.get('/durata').then(res => setDurate(res.data));
        axios.get('/cadenza_rata').then(res => setCadenze(res.data));
        axios.get('/tipo_mutuo').then(res => setTipiMutuo(res.data));
        axios.get('/posizione_lavorativa').then(res => setPosizioneLavorativaIn(res.data));
    }, []);

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearch(prev => ({ ...prev, [name]: value }));
    };

    //Funzione ricerca
    const handleSearch = (e) => {
        e.preventDefault();
        const searchParams = {
            nomeRicercaRichiedente: search.nome ? `%${search.nome}%` : null,
            cognomeRicercaRichiedente: search.cognome ? `%${search.cognome}%` : null,
            codiceFiscaleRicercaRichiedente: search.codiceFiscale ? `%${search.codiceFiscale}%` : null,
            idMutuo: search.idMutuo ? parseInt(search.idMutuo) : null,
            statoRichiesta: search.statoRichiesta || null
        };
        console.log("SearchParms: ", searchParams);
        axios.post('/richiesta_mutuo/ricerca', searchParams)
            .then(res => {
                if (res.data.found) {
                    setFiltrate(res.data.data);
                    setShowResults(true);
                } else {
                    setFiltrate([]);
                    setShowResults(true);
                    Swal.fire({ icon: 'info', title: 'Nessun risultato', text: 'Nessun elemento presente.' });
                }
            })
            .catch(err => {
                Swal.fire({ icon: 'error', title: 'Errore', text: 'Errore nella ricerca' });
            });
    };

    //Funzione per la modifica
    const handleModifica = (id) => {
        navigate(`/richiesta_mutuo?id=${id}`);
    };

    //Funzione per il caricamento dei documenti da parte del gestore
    const handleVaiACaricaDocumenti = (id) => {
        navigate(`/carica_gestore?id=${id}`);
    };

    //Funzione per la validazione della richiesta da parte del gestore
    //Prima devono essere caricati i documenti
    const handleInviaAValidazione = async (id) => {
        try {
            const res = await axios.get(`/documenti/caricati/${id}`);
            const docs = res.data || [];
            const richiesti = [11, 12, 13, 14];
            const mancanti = richiesti.filter(docId => !docs.some(d => d.tipoDocumento === docId));

            if (mancanti.length > 0) {
                Swal.fire("Errore", "Errore nell'invio della validazione, caricare i documenti", "error");
                return;
            }

            const conferma = await Swal.fire({
                title: 'Sei sicuro?',
                text: 'Vuoi inviare la richiesta in validazione?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sì, invia',
                cancelButtonText: 'Annulla'
            });

            if (conferma.isConfirmed) {
                await axios.put(`/richiesta_mutuo/richiesta/${id}`);
                Swal.fire('Inviata', 'La richiesta è stata inviata in validazione.', 'success');
                setFiltrate(prev => prev.map(r => r.id === id ? { ...r, statoRichiesta: 'VALIDAZIONE' } : r));
            }
        } catch (err) {
            Swal.fire('Errore', 'Errore durante la validazione.', 'error');
        }
    };

    // Funzione per scaricare tutti i documenti in zip
    const handleDownloadZip = async (id) => {
        try {
            const response = await axios.get(`/documenti/download-zip/${id}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `documenti_richiesta_${id}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            Swal.fire("Errore", "Impossibile scaricare il pacchetto documenti.", "error");
        }
    };

    // Funzione per approvare la richiesta
    const handleApprovaRichiesta = async (id) => {
        try {
            const conferma = await Swal.fire({
                title: 'Conferma Approvazione',
                text: 'Vuoi approvare questa richiesta?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sì, approva',
                cancelButtonText: 'Annulla'
            });

            if (conferma.isConfirmed) {
                await axios.put(`/richiesta_mutuo/approva/${id}`);
                Swal.fire("Approvata", "Richiesta approvata con successo.", "success");
                setFiltrate(prev => prev.map(r => r.id === id ? { ...r, statoRichiesta: 'VALIDATO' } : r));
            }
        } catch (err) {
            Swal.fire("Errore", "Errore durante l'approvazione.", "error");
        }
   }

    //Funzione per l'eliminazione
    const handleElimina = (id) => {
        Swal.fire({
            title: 'Sei sicuro?',
            text: 'Questa operazione eliminerà la richiesta in modo permanente.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla'
        }).then((result) => {
            if (result.isConfirmed) {
                axios.delete(`/richiesta_mutuo/elimina/${id}`)
                    .then(() => {
                        Swal.fire("Eliminata", "La richiesta è stata eliminata", "success");
                        setFiltrate(prev => prev.filter(r => r.id !== id));
                    })
                    .catch(() => {
                        Swal.fire("Errore", "Errore durante l'eliminazione", "error");
                    });
            }
        });
    };

    //Funzione per il download del file
    const handleDownload = (path) => {
        axios.get(`http://localhost:8080/api/documenti/download`, {
            params: { path },
            responseType: 'blob'
        }).then((response) => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Prova a estrarre il nome file dal path
            const filename = path.split('/').pop();
            link.setAttribute('download', filename || 'documento.pdf');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }).catch(() => {
            Swal.fire("Errore", "Impossibile scaricare il file", "error");
        });
    };

    //Funzione per rifiutare la richiesta
    const handleRifiutaRichiesta = () => {
        if (!noteRifiuto.trim()) {
            Swal.fire("Errore", "Inserire una nota per il rifiuto", "error");
            return;
        }
        console.log("Note rifiuto", noteRifiuto);
        axios.post(`/richiesta_mutuo/rifiuto`, {
            note: noteRifiuto
        }, {
            params: { richiestaId: richiestaSelezionata.id , noteRifiuto: noteRifiuto }
        }).then(() => {
            Swal.fire("Rifiutata", "La richiesta è stata rifiutata e notificata al funzionario", "success");
            setShowRifiutoModal(false);
            setNoteRifiuto("");
            setFiltrate(prev => prev.filter(r => r.id !== richiestaSelezionata.id));
        }).catch(() => {
            Swal.fire("Errore", "Errore nel rifiuto della richiesta", "error");
        });
    };

    //Funzione per scaricare il pdf finale
    const handleDownloadPdf = async (id) => {
        try {
            const response = await axios.get(`/documenti/pdf/${id}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `riepilogo_richiesta_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            Swal.fire("Errore", "Impossibile generare il PDF.", "error");
        }
    };

    const toggleAccordion = (id) => {
        setOpenRow(prev => (prev === id ? null : id));
    };

    //Funzione per riportare l'utente nella sezione di visualizzazione dei dati
    const handleVisualizza = (id) => {
        navigate(`/richiesta_mutuo?id=${id}`, {
            state: { readonly: true }
        });
    };

    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">RICHIESTE MUTUO INVIATE</h2>

            {/* Sezione Ricerca */}
            <section className="mb-5 p-4 rounded shadow-sm" style={{ backgroundColor: '#fff' }}>
                <h4 className="text-center mb-5" style={{ fontWeight: 700, fontSize: '2.5rem', color: '#111' }}>Ricerca anagrafica</h4>
                <form className="mb-4" onSubmit={handleSearch}>
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label htmlFor="nomeRicercaRichiedente" className="form-label">Nome del richiedente</label>
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
                            <label htmlFor="cognomeRicercaRichiedente" className="form-label">Cognome del richiedente</label>
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
                            <label htmlFor="codiceFiscaleRicercaRichiedente" className="form-label">Codice Fiscale del richiedente</label>
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
                        <div className="col-md-4">
                            <label htmlFor="idMutuo" className="form-label">Id mutuo</label>
                            <input
                                type="text"
                                className="form-control"
                                id="idMutuo"
                                name="idMutuo"
                                value={search.idMutuo || ''}
                                onChange={handleSearchChange}
                                placeholder="Inserisci l'id del mutuo"
                                autoComplete="off"
                            />
                        </div>
                        <div className="col-md-4">
                            <label htmlFor="statoRichiesta" className="form-label">Stato richiesta</label>
                            <select
                                className="form-select"
                                name="statoRichiesta"
                                id="statoRichiesta"
                                value={search.statoRichiesta}
                                onChange={handleSearchChange}
                                style={{ maxWidth: '250px' }}
                            >
                                <option value="">Tutti</option>
                                <option value="Bozza">Bozza</option>
                                <option value="Inviata">Inviata</option>
                                <option value="Validazione">Validazione</option>
                                <option value="Validato">Validato</option>
                                <option value="Rifiutata">Rifiutata</option>
                                <option value="Eliminata">Eliminata</option>
                            </select>
                        </div>
                    </div>
                    <div className="text-center mt-4">
                        <button type="submit" className="btn btn-primary px-5 py-2" style={{ fontWeight: 600 }}>
                            Cerca
                        </button>
                    </div>
                </form>
            </section>

            {/* Tabella risultati */}
            {filtrate.length > 0 ? (
                <div className="table-responsive">
                    <table className="table table-bordered">
                        <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Cognome</th>
                            <th>Codice Fiscale</th>
                            <th>Importo</th>
                            <th>Stato</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtrate.map(r => {
                            const durataSelezionata = durate.find(d => d.id === r.durata);
                            const cadenzaSelezionata = cadenze.find(c => c.id === r.cadenzaRata);
                            const tipoMutuoSelezionato = tipiMutuo.find(t => t.id === r.tipoMutuo);

                            return (
                                <React.Fragment key={r.id}>
                                    <tr>
                                        <td>{r.nome || '-'}</td>
                                        <td>{r.cognome || '-'}</td>
                                        <td>{r.codiceFiscale || '-'}</td>
                                        <td>{formatCurrency(r.importo)}</td>
                                        <td>{r.statoRichiesta}</td>
                                        <td className="d-flex gap-2">
                                            <button
                                              type="button"
                                              className="btn btn-sm rounded-circle btn-info"
                                              onClick={() => toggleAccordion(r.id)}
                                              aria-label={openRow === r.id ? "Chiudi dettagli" : "Apri dettagli"}
                                              title={openRow === r.id ? "Chiudi dettagli" : "Apri dettagli"}
                                            >
                                              <i
                                                className={
                                                  openRow === r.id
                                                    ? "fa-solid fa-chevron-up"
                                                    : "fa-solid fa-chevron-down"
                                                }
                                                aria-hidden="true"
                                              />
                                            </button>
                                            {/*Tooltip per la nota in caso di rifiuto */}
                                            {r.statoRichiesta === "RIFIUTATA" && r.noteRifiuto && (
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={
                                                        <Tooltip id={`tooltip-${r.id}`}>
                                                            {r.noteRifiuto}
                                                        </Tooltip>
                                                    }
                                                >
                                                     <span className="d-inline-flex align-items-center">
                                                        <i
                                                            className="fa-solid fa-circle-exclamation text-danger"
                                                            aria-hidden="true">
                                                        </i>
                                                     </span>
                                                </OverlayTrigger>
                                            )}
                                        </td>
                                    </tr>

                                    {openRow === r.id && (
                                        <tr>
                                            <td colSpan="7">
                                            <div className="table-responsive">
                                                <table className="table table-sm table-bordered mb-0">
                                                <thead>
                                                    <tr>
                                                    <th>Valore Immobile</th>
                                                    <th>Durata</th>
                                                    <th>Cadenza Rata</th>
                                                    <th>Tipo Mutuo</th>
                                                    <th>Interesse Annuo</th>
                                                    <th>Azioni</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                    <td>{formatCurrency(r.valoreImmobile)}</td>
                                                    <td>{durataSelezionata?.descrizioneDurata || '-'} anni</td>
                                                    <td>{cadenzaSelezionata?.descrizioneTipoRata || '-'}</td>
                                                    <td>{tipoMutuoSelezionato?.descrizioneTipoMutuo || '-'}</td>
                                                    <td>{r.interesseAnnuo ? `${r.interesseAnnuo}%` : '-'}</td>
                                                    <td>
                                                        {ruoloId === 2 && r.statoRichiesta === "INVIATA" && (
                                                             <>
                                                             {/*Button: Carica documenti*/}
                                                                <button
                                                                    className="btn btn-sm rounded-circle btn-outline-primary"
                                                                    onClick={() => {
                                                                        setRichiestaSelezionata(r);
                                                                        setShowModal(true);
                                                                    }}
                                                                >
                                                                    <i
                                                                        className="fas fa-upload"
                                                                        aria-hidden="true">
                                                                    </i>
                                                                </button>

                                                                {/*Button: Invia validazione*/}
                                                                <button
                                                                    className="btn btn-sm btn-outline-success rounded-circle"
                                                                    title="Invia validazione"
                                                                    title="Invia validazione"
                                                                    type="button"
                                                                    onClick={() => handleInviaAValidazione(r.id)}
                                                                >
                                                                    <i className="fas fa-check" aria-hidden="true"></i>
                                                                </button>

                                                                {/*Button: Rifiuta richiesta*/}
                                                                    <button
                                                                        className="btn btn-sm btn-outline-danger rounded-circle"
                                                                        title="Rifiuta richiesta"
                                                                        title="Rifiuta richiesta"
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setRichiestaSelezionata(r);
                                                                            setShowRifiutoModal(true);
                                                                        }}
                                                                    >
                                                                    <i className="fas fa-solid fa-xmark" aria-hidden="true"></i>
                                                                </button>
                                                             </>
                                                        )}
                                                        {ruoloId === 3 && r.statoRichiesta === "VALIDAZIONE" && (
                                                            <>
                                                                {/*Button: Scarica documenti*/}
                                                                <button
                                                                    className="btn btn-sm rounded-circle btn-outline-primary"
                                                                    title="Scarica documenti"
                                                                    onClick={() => {
                                                                        handleDownloadZip(r.id)
                                                                    }}
                                                                >
                                                                    <i className="fas fa-solid fa-download" aria-hidden="true"></i>
                                                                </button>

                                                                {/*Button: Validata*/}
                                                                <button
                                                                     className="btn btn-sm btn-outline-success rounded-circle"
                                                                     title="Validata"
                                                                     type="button"
                                                                     onClick={() => handleApprovaRichiesta(r.id)}
                                                                >
                                                                    <i className="fas fa-check" aria-hidden="true"></i>
                                                                </button>

                                                                {/*Button: Rifiuta validazione*/}
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger rounded-circle"
                                                                    title="Rifiuta validazione"
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setRichiestaSelezionata(r);
                                                                        setShowRifiutoModal(true);
                                                                    }}
                                                                 >
                                                                    <i className="fas fa-solid fa-xmark" aria-hidden="true"></i>
                                                                </button>
                                                            </>
                                                        )}
                                                        {(r.statoRichiesta === 'BOZZA' || r.statoRichiesta === 'RIFIUTATA') && (
                                                        <>
                                                            {/*Button modifica*/}
                                                            <button
                                                                className="btn btn-sm btn-outline-primary rounded-circle"
                                                                aria-label="Clicca per modificare"
                                                                title="Clicca per modificare"
                                                                type="button"
                                                                onClick={() => handleModifica(r.id)}
                                                            >
                                                                <i className="fas fa-edit" aria-hidden="true"></i>
                                                            </button>
                                                            {/*Button elimina*/}
                                                            <button
                                                                className="btn btn-sm btn-outline-danger rounded-circle"
                                                                aria-label="Clicca per eliminare"
                                                                title="Clicca per eliminare"
                                                                type="button"
                                                                onClick={() => handleElimina(r.id)}
                                                            >
                                                                <i className="fas fa-trash" aria-hidden="true"></i>
                                                            </button>
                                                        </>
                                                        )}
                                                        {r.statoRichiesta === "VALIDATO" && (
                                                            <button
                                                                className="btn btn-sm btn-outline-primary rounded-circle"
                                                                aria-label="Clicca per estrarre il pdf"
                                                                title="Clicca per estrarre il pdf"
                                                                type="button"
                                                                onClick={() => handleDownloadPdf(r.id)}
                                                            >
                                                            <i className="fas fa-solid fa-file-pdf" aria-hidden="true"></i>
                                                          </button>
                                                        )}
                                                        <button
                                                            className="btn btn-sm btn-outline-secondary rounded-circle"
                                                            title="Visualizza"
                                                            type="button"
                                                            onClick={() => handleVisualizza(r.id)}
                                                        >
                                                            <i className="fas fa-eye" aria-hidden="true"></i>
                                                        </button>
                                                    </td>
                                                    </tr>
                                                </tbody>
                                                </table>
                                            </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                        </tbody>
                    </table>
                    <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                         <Modal.Header closeButton>
                            <Modal.Title>Carica documenti</Modal.Title>
                         </Modal.Header>
                         <Modal.Body>
                            {richiestaSelezionata && (
                                <CaricaDocumenti
                                    richiesta={richiestaSelezionata}
                                    utente={utente}
                                    onCompletamento={() => {
                                        setShowModal(false);
                                        setRichiestaSelezionata(null);
                                        Swal.fire("Completato", "Tutti i documenti sono stati caricati", "success");
                                    }}
                                />
                            )}
                         </Modal.Body>
                    </Modal>
                    <Modal show={showRifiutoModal} onHide={() => setShowRifiutoModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Rifiuta Richiesta</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-3">
                                <label htmlFor="noteRifiuto" className="form-label">Note per il rifiuto</label>
                                <textarea
                                    id="noteRifiuto"
                                    className="form-control"
                                    rows="4"
                                    value={noteRifiuto}
                                    onChange={(e) => setNoteRifiuto(e.target.value)}
                                    placeholder="Inserisci le motivazioni del rifiuto"
                                />
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <button className="btn btn-secondary" onClick={() => setShowRifiutoModal(false)}>Annulla</button>
                            <button className="btn btn-danger" onClick={handleRifiutaRichiesta}>Conferma Rifiuto</button>
                        </Modal.Footer>
                    </Modal>

                </div>
            ) : (
                <div className="alert alert-warning text-center">Nessun risultato da mostrare</div>
            )}
        </div>
    );
};

export default RichiesteInoltrate;