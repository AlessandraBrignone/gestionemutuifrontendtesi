import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Swal from 'sweetalert2';
import { searchAnagrafica } from '../services/AnagraficaSearch';
import CodiceFiscale from 'codice-fiscale-js';
// const sezioneInserimento = document.getElementById("sezioneInserimento");

// Funzione di conversione data da formato italiano a ISO
function convertToDb(dateStr) {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    const parts = dateStr.split('/');
    if (parts.length !== 3) return "";
    let [day, month, year] = parts;
    day = day.padStart(2, '0');
    month = month.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Funzione di conversione data da formato ISO a italiano
function convertItalian(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const formDati = () => ({
    nome: '',
    cognome: '',
    sesso: 'M',
    codiceFiscale: '',
    dataNascita: '',
    email: '',
    telefono: '',
    cellulare: '',
    indirizzoResidenza: '',
    capResidenza: '',
    provinciaResidenza: '',
    comuneResidenza: '',
    domicilioUguale: 'SI',
    indirizzoDomicilio: '',
    capDomicilio: '',
    provinciaDomicilio: '',
    comuneDomicilio: '',
    stato: '',
    privacyAcettata: 'false'
})

// Componente principale per la gestione dell'anagrafica
const AnagraficaForm = () => {
    const [anagrafiche, setAnagrafiche] = useState([]);
    const [comuni, setComuni] = useState([]);
    const [error, setError] = useState(null);
    const [showInsert, setShowInsert] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [search, setSearch] = useState({ nome: '', cognome: '', codiceFiscale: '' });
    const [form, setForm] = useState(formDati);
    const [isEditMode, setIsEditMode] = useState(false);

    // Effetto per caricare dati iniziali
    useEffect(() => {
        fetchData();
        axios.get('/comuni')
            .then(res => setComuni(res.data))
            .catch(() => {
                setError("Errore nel caricamento dei comuni. Verificare che il backend sia in esecuzione.");
                Swal.fire({
                    icon: 'error',
                    title: 'Errore',
                    text: 'Errore nel caricamento dei comuni. Verificare che il backend sia in esecuzione.'
                });
            });
    }, []);

    // Funzione per recuperare tutte le anagrafiche
    function fetchData() {
        axios.get("/anagrafica")
            .then(res => {
                setAnagrafiche(res.data);
                setError(null);
            })
            .catch(() => {
                setError("Impossibile connettersi al server. Verificare che il backend sia in esecuzione.");
                Swal.fire({
                    icon: 'error',
                    title: 'Errore di connessione',
                    text: 'Impossibile connettersi al server. Verificare che il backend sia in esecuzione.'
                });
            });
    }

    // Funzione per gestire il click su "Nuovo Inserimento"
    function handleNuovo() {
        setForm(formDati());
        setShowInsert(true);
        setShowResults(false);
        setIsEditMode(false); // Modalità inserimento
    }

    // Funzione per annullare l'inserimento/modifica
    function handleAnnulla() {
        setShowInsert(false);
        setForm(formDati());
    }

    // Funzione per gestire il cambiamento dei campi del form
    function handleChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }

    // Funzione per gestire il cambiamento dei campi di ricerca
    function handleSearchChange(e) {
        const { name, value } = e.target;
        setSearch(prev => ({ ...prev, [name]: value }));
    }

    // Funzione per gestire la modifica di una riga
    function handleEditClick(item) {
        setForm({
            ...formDati(),
            ...item,

            //Data di nascita
            dataNascita: item.dataNascita
                        ? item.dataNascita.slice(0,10)
                        : '',
            //Radio domicilio
            domicilioUguale: item.domUgualeRes,
            //Comuni
            comuneNascita: item.comuneNascita?.id || '',
            comuneResidenza: item.comuneResidenza?.id || '',
            comuneDomicilio: item.comuneDomicilio?.id || '',
            //Privacy
            privacyAccettata:  item.privacyAccettata
        });

        setShowInsert(true);
        setShowResults(false);
        setIsEditMode(true);
    }

    function buildPayload(form) {
        const payload = {
            ...form,
            dataNascita: form.dataNascita,
            comuneNascita: form.comuneNascita ? parseInt(form.comuneNascita) : null,
            comuneResidenza: form.comuneResidenza ? parseInt(form.comuneResidenza) : null,
            comuneDomicilio: form.comuneDomicilio ? parseInt(form.comuneDomicilio) : null,
            domUgualeRes: form.domicilioUguale
        };

        //Nel caso domicilio uguale residenza clona i campi presenti in residenza
        if(form.domicilioUguale === 'SI'){
            payload.indirizzoDomicilio = form.indirizzoResidenza;
            payload.capDomicilio = form.capResidenza;
            payload.provinciaDomicilio = form.provinciaResidenza;
            payload.comuneDomicilio = form.comuneResidenza ? parseInt(form.comuneResidenza) : null;
        }

        return payload;
    }

    // Funzione per il submit del form (salvataggio)
    function handleSubmit(e) {
        e.preventDefault();
        const formData = buildPayload(form);

        axios.post('/anagrafica/salva', formData)
            .then(res => {
                Swal.fire({ icon: 'success', title: 'Salvataggio riuscito', text: 'Dati salvati con successo!' });
                setShowInsert(false);
                fetchData();
            })
            .catch(err => {
                Swal.fire({ icon: 'error', title: 'Errore', text: err.response?.data?.message || 'Errore nel salvataggio' });
            });
    }

    // Funzione per aggiornare un record esistente tramite id
    function handleUpdate(e) {
        e.preventDefault();
        const formData = buildPayload(form);

        axios.put(`/anagrafica/update/${form.id}`, formData)
            .then(res => {
                Swal.fire({ icon: 'success', title: 'Aggiornamento riuscito', text: 'Dati aggiornati con successo!' });
                setShowInsert(false);
                fetchData();
            })
            .catch(err => {
                Swal.fire({ icon: 'error', title: 'Errore', text: err.response?.data?.message || 'Errore nell\'aggiornamento' });
            });
    }

    // Funzione per la ricerca (LIKE)
    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const risultati = await searchAnagrafica( search, { activeIfEmpty: true } );

            if (risultati.length) {
              setAnagrafiche(risultati);
            } else {
                setAnagrafiche([]);
                Swal.fire({ icon: 'info', title: 'Nessun risultato', text: 'Nessun elemento presente.' });
            }
            setShowResults(true);
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Errore', text: 'Errore nella ricerca' });
        }
    };

    // Funzione per eliminare una anagrafica tramite id
    function handleDelete(id) {
        Swal.fire({
            title: 'Sei sicuro di voler eliminare questa anagrafica?',
            text: 'Questa operazione non può essere annullata!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla'
        }).then((result) => {
            if (result.isConfirmed) {
                axios.delete(`/anagrafica/elimina/${id}`)
                    .then(() => {
                        Swal.fire({ icon: 'success', title: 'Eliminazione riuscita', text: 'Anagrafica eliminata con successo!' });
                        fetchData();
                    })
                    .catch(err => {
                        Swal.fire({ icon: 'error', title: 'Errore', text: err.response?.data?.message || 'Errore nell\'eliminazione' });
                    });
            }
        });
    }

    // Funzione per ripristinare una anagrafica tramite id
    const handleRestore = async (id) => {
        axios.put(`/anagrafica/ripristina/${id}`)
            .then(res => {
                Swal.fire({
                    icon: 'success',
                    title: 'Ripristino riuscito',
                    text: 'Ripristino riuscito!'
                });
                setShowInsert(false);
                fetchData();
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Errore',
                    text: err.response?.data?.message || 'Errore nell\'aggiornamento'
                });
            });
    };

    // Funzione per il submit del form (salvataggio o aggiornamento)
    function handleFormSubmit(e) {
        e.preventDefault();
        if (isEditMode) {
            handleUpdate(e);
        } else {
            handleSubmit(e);
        }
    }

    //Funzione per generare il codice fiscale
    function generaCodiceFiscale() {
        let { nome, cognome, dataNascita, comuneNascita, sesso } = form;

        nome = nome?.trim().toUpperCase() || '';
        cognome = cognome?.trim().toUpperCase() || '';

        // I campi nome, cognome, data di nascita e comune di nascita devono essere valorizzati
        if (!nome || !cognome || !dataNascita || !comuneNascita) {
            Swal.fire({
                icon: 'warning',
                title: 'Dati mancanti',
                text: 'Compila nome, cognome, data di nascita e comune prima di generare il CF.'
            });
            return;
        }

        // Recupero del codice catastale dal select dei comuni
        const comuneObj = comuni.find(c => c.id === parseInt(comuneNascita));
        const codice = comuneObj?.codiceCatastale ?? comuneObj?.codice_catastale;
            if (!codice) {
                Swal.fire({ icon: 'error', title: 'Comune non valido', text: 'Codice catastale mancante.' });
                return;
            }

            // Converto la data in oggetto Date
            const [yyyy, mm, dd] = convertToDb(dataNascita).split('-');
            const cf = new CodiceFiscale({
                name: nome,
                surname: cognome,
                gender: sesso,
                day: parseInt(dd, 10),
                month: parseInt(mm, 10),
                year: parseInt(yyyy, 10),
                birthplace: codice,
                birthplaceProvincia: comuneObj.provincia
            });

        setForm(prev => ({ ...prev, codiceFiscale: cf.cf }));
    }

    // Render del componente
    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">ANAGRAFICA</h2>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {/*Button Nuovo inserimento*/}
            <div className="text-right mt-3 mb-4">
                <button className="btn btn-success" onClick={handleNuovo}>Nuovo Inserimento</button>
            </div>

            {/* Sezione Ricerca */}
            <section className="mb-5 p-4 rounded shadow-sm" style={{ backgroundColor: '#fff' }}>
                <h4 className="text-center mb-5" style={{ fontWeight: 700, fontSize: '2.5rem', color: '#111' }}>Ricerca anagrafica</h4>
                 <form className="mb-4" onSubmit={handleSearch}>
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label htmlFor="nomeRicerca" className="form-label">Nome</label>
                            <input
                                type="text"
                                className="form-control"
                                id="nomeRicerca"
                                name="nome"
                                value={search.nome}
                                onChange={handleSearchChange}
                                placeholder="Inserisci nome"
                                autoComplete="off"
                            />
                        </div>
                        <div className="col-md-4">
                            <label htmlFor="cognomeRicerca" className="form-label">Cognome</label>
                            <input
                                type="text"
                                className="form-control"
                                id="cognomeRicerca"
                                name="cognome"
                                value={search.cognome}
                                onChange={handleSearchChange}
                                placeholder="Inserisci cognome"
                                autoComplete="off"
                            />
                        </div>
                        <div className="col-md-4">
                            <label htmlFor="codiceFiscaleRicerca" className="form-label">Codice Fiscale</label>
                            <input
                                type="text"
                                className="form-control"
                                id="codiceFiscaleRicerca"
                                name="codiceFiscale"
                                value={search.codiceFiscale}
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

            {/* Risultati Ricerca */}
            {showResults && (
                <div id="risultatiRicerca">
                    {anagrafiche.length > 0 ? (
                        <div id="tabellaRisultati" className="table-responsive">
                            <table className="table table-bordered">
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
                                    {/* Ciclo sulle anagrafiche per mostrare ogni riga con i pulsanti Modifica ed Elimina */}
                                    {anagrafiche.map(a => (
                                        <tr key={a.id}>
                                            <td>{a.codiceFiscale}</td>
                                            <td>{a.nome}</td>
                                            <td>{a.cognome}</td>
                                            <td>{convertItalian(a.dataNascita)}</td>
                                            <td>
                                                {a.stato === 1 ? (
                                                    <>
                                                    {/*Button modifica*/}
                                                        <button
                                                            className="btn btn-sm btn-outline-primary rounded-circle"
                                                            aria-label="Clicca per modificare"
                                                            title="Clicca per modificare"
                                                            type="button"
                                                            onClick={() => handleEditClick(a)}
                                                        >
                                                            <i className="fas fa-edit" aria-hidden="true"></i>
                                                        </button>
                                                        {/*Button elimina*/}
                                                        <button
                                                            className="btn btn-sm btn-outline-danger rounded-circle"
                                                            aria-label="Clicca per eliminare"
                                                            title="Clicca per eliminare"
                                                            type="button"
                                                            onClick={() => handleDelete(a.id)}
                                                        >
                                                            <i className="fas fa-trash" aria-hidden="true"></i>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        className="btn btn-sm btn-outline-primary rounded-circle"
                                                        aria-label="Clicca per ripristinare"
                                                        title="Clicca per ripristinare"
                                                        type="button"
                                                        onClick={() => handleRestore(a.id)}
                                                    >
                                                        <i className="fas fa-undo" aria-hidden="true"></i>
                                                    </button>
                                                )}
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
            )}
            {/* Sezione Inserimento */}
            {showInsert && (
                <section className="mb-5 p-4 rounded shadow-sm" style={{ backgroundColor: '#fff' }}>
                    <h4 className="mb-4 text-center" style={{ fontWeight: 600, color: '#333' }}>Inserimento anagrafica</h4>
                    <form className="mb-4" onSubmit={handleFormSubmit}>
                        <section className="border p-4 rounded bg-light mb-4">
                            <h5 className="mb-3">Dati anagrafici</h5>

                            <div className="row mb-3">
                                <div className="col-md-4">
                                    <label className="fw-bold text-dark d-block" htmlFor="nome">Nome *</label>
                                    <input
                                        type="text"
                                        name="nome"
                                        id="nome"
                                        className="form-control"
                                        value={form.nome}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="fw-bold text-dark d-block" htmlFor="cognome">Cognome *</label>
                                    <input
                                        type="text"
                                        name="cognome"
                                        id="cognome"
                                        className="form-control"
                                        value={form.cognome}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="row mb-3">
                                    <div className="col-md-4">
                                        <label className="fw-bold text-dark d-block">Sesso</label>
                                        {/*Radio Femmina*/}
                                        <div className="form-check form-check-inline">
                                            <label className="fw-bold text-dark d-block" htmlFor="radioFemmina">F</label>
                                            <input
                                                type="radio"
                                                name="sesso"
                                                id="radioFemmina"
                                                className="form-check-input"
                                                value="F"
                                                checked={form.sesso === 'F'}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        {/*Radio Maschio*/}
                                        <div className="form-check form-check-inline">
                                            <label className="fw-bold text-dark d-block" htmlFor="radioMaschio">M</label>
                                            <input
                                                type="radio"
                                                name="sesso"
                                                id="radioMaschio"
                                                className="form-check-input"
                                                value="M"
                                                checked={form.sesso === 'M'}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                   </div>
                                </div>
                                <div className="col-md-4">
                                     <label className="fw-bold text-dark d-block" htmlFor="dataNascita">Data di nascita *</label>
                                     <input
                                         type="date"
                                         name="dataNascita"
                                         id="dataNascita"
                                         className="form-control"
                                         placeholder="gg/mm/aaaa"
                                         value={form.dataNascita}
                                         onChange={handleChange}
                                         required
                                     />
                                </div>
                                <div className="col-md-4">
                                    <label className="fw-bold text-dark">Comune di nascita *</label>
                                    <select
                                        className="form-select"
                                        name="comuneNascita"
                                        id="comuneNascita"
                                        value={form.comuneNascita}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Seleziona un comune</option>
                                        {comuni.map(comune => (
                                            <option key={comune.id} value={comune.id}>{comune.descrizioneComune}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="row mb-3">
                                    <div className="col-md-4">
                                        <label className="fw-bold text-dark d-block" htmlFor="codiceFiscale">Codice fiscale *</label>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                name="codiceFiscale"
                                                id="codiceFiscale"
                                                className="form-control"
                                                value={form.codiceFiscale}
                                                onChange={handleChange}
                                                required
                                            />
                                            <button
                                                className="btn btn-sm btn-outline-primary rounded-circle"
                                                aria-label="Genera"
                                                title="Genera"
                                                type="button"
                                                onClick={generaCodiceFiscale}
                                            >
                                                <i class="fas fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section className="border p-4 rounded bg-light mb-4">
                            <h5 className="mb-3">Contatti</h5>

                                <div className="row mb-3">
                                    <div className="col-md-4">
                                        <label className="fw-bold text-dark d-block" htmlFor="email">Email *</label>
                                        <input
                                            type="text"
                                            name="email"
                                            id="email"
                                            className="form-control"
                                            value={form.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-4">
                                         <label className="fw-bold text-dark d-block" htmlFor="cellulare">Cellulare *</label>
                                         <input
                                             type="text"
                                             name="cellulare"
                                             id="cellulare"
                                             className="form-control"
                                             value={form.cellulare}
                                             onChange={handleChange}
                                             placeholder="+39"
                                             required
                                         />
                                     </div>
                                    <div className="col-md-4">
                                         <label className="fw-bold text-dark d-block" htmlFor="telefono">Telefono</label>
                                         <input
                                             type="text"
                                             name="telefono"
                                             id="telefono"
                                             className="form-control"
                                             value={form.telefono}
                                             onChange={handleChange}
                                             placeholder="+39"
                                         />
                                    </div>
                                </div>
                        </section>
                        <section className="border p-4 rounded bg-light mb-4">
                            <h5 className="mb-3">Residenza</h5>

                                <div className="row mb-3">
                                    <div className="col-md-4">
                                        <label className="fw-bold text-dark d-block" htmlFor="indirizzoResidenza">Indirizzo *</label>
                                        <input
                                            type="text"
                                            name="indirizzoResidenza"
                                            id="indirizzoResidenza"
                                            className="form-control"
                                            value={form.indirizzoResidenza}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-4">
                                         <label className="fw-bold text-dark d-block" htmlFor="capResidenza">Cap *</label>
                                         <input
                                             type="text"
                                             name="capResidenza"
                                             id="capResidenza"
                                             className="form-control"
                                             value={form.capResidenza}
                                             onChange={handleChange}
                                             required
                                         />
                                     </div>
                                    <div className="col-md-4">
                                         <label className="fw-bold text-dark d-block" htmlFor="provinciaResidenza">Provincia *</label>
                                         <input
                                             type="text"
                                             name="provinciaResidenza"
                                             id="provinciaResidenza"
                                             className="form-control"
                                             value={form.provinciaResidenza}
                                             onChange={handleChange}
                                             required
                                         />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="fw-bold text-dark">Comune di residenza *</label>
                                        <select
                                            className="form-select"
                                            name="comuneResidenza"
                                            id="comuneResidenza"
                                            value={form.comuneResidenza}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Seleziona un comune</option>
                                            {comuni.map(comune => (
                                                <option key={comune.id} value={comune.id}>{comune.descrizioneComune}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="row mb-3">
                                       <div className="col-md-4">
                                            <label className="fw-bold text-dark d-block">Domicilio uguale a residenza?</label>
                                            {/*Radio SI*/}
                                            <div className="form-check form-check-inline">
                                                <label className="fw-bold text-dark d-block" htmlFor="radioSi">Si</label>
                                                 <input
                                                     type="radio"
                                                     name="domicilioUguale"
                                                     id="radioSi"
                                                     className="form-check-input"
                                                     value="SI"
                                                     checked={form.domicilioUguale === 'SI'}
                                                     onChange={handleChange}
                                                     required
                                                 />
                                            </div>
                                            {/*Radio NO*/}
                                            <div className="form-check form-check-inline">
                                                <label className="fw-bold text-dark d-block" htmlFor="radioNo">No</label>
                                                 <input
                                                     type="radio"
                                                     name="domicilioUguale"
                                                     id="radioNo"
                                                     className="form-check-input"
                                                     value="NO"
                                                     checked={form.domicilioUguale === 'NO'}
                                                     onChange={handleChange}
                                                     required
                                                 />
                                            </div>
                                       </div>
                                   </div>
                                </div>
                            </section>

                        {/* Domicilio (visibile solo se radioNo è selezionato) */}
                        {form.domicilioUguale === 'NO' && (
                            <>
                                <section className="border p-4 rounded bg-light mb-4">
                                    <h5 className="mb-3">Domicilio</h5>
                                        <div className="row mb-3">
                                            <div className="col-md-4">
                                                <label className="fw-bold text-dark d-block" htmlFor="indirizzoDomicilio">Indirizzo *</label>
                                                <input
                                                    type="text"
                                                    name="indirizzoDomicilio"
                                                    id="indirizzoDomicilio"
                                                    className="form-control"
                                                    value={form.indirizzoDomicilio}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                 <label className="fw-bold text-dark d-block" htmlFor="capDomicilio">Cap *</label>
                                                 <input
                                                     type="text"
                                                     name="capDomicilio"
                                                     id="capDomicilio"
                                                     className="form-control"
                                                     value={form.capDomicilio}
                                                     onChange={handleChange}
                                                     required
                                                 />
                                             </div>
                                            <div className="col-md-4">
                                                 <label className="fw-bold text-dark d-block" htmlFor="provinciaDomicilio">Provincia *</label>
                                                 <input
                                                     type="text"
                                                     name="provinciaDomicilio"
                                                     id="provinciaDomicilio"
                                                     className="form-control"
                                                     value={form.provinciaDomicilio}
                                                     onChange={handleChange}
                                                     required
                                                 />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="fw-bold text-dark">Comune di domicilio *</label>
                                                <select
                                                    className="form-select"
                                                    name="comuneDomicilio"
                                                    id="comuneDomicilio"
                                                    value={form.comuneDomicilio}
                                                    onChange={handleChange}
                                                    required
                                                >
                                                    <option value="">Seleziona un comune</option>
                                                    {comuni.map(comune => (
                                                        <option key={comune.id} value={comune.id}>{comune.descrizioneComune}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                </section>
                            </>
                        )}

                        <div className="form-check mt-3 text-start">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="privacyCheckbox"
                                required
                            />
                            <label className="form-check-label" htmlFor="privacyCheckbox">
                                Dichiaro di aver preso visione dell'
                                <a href="/documenti/InformativaPrivacy.pdf" download target="_blank" rel="noopener noreferrer">
                                    Informativa sulla privacy
                                </a>
                            </label>
                        </div>

                        <div className="text-center mt-4">
                            <button type="submit" className="btn btn-success">SALVA</button>
                            <button type="button" className="btn btn-secondary" onClick={handleAnnulla} style={{ marginLeft: '10px' }}>Annulla</button>
                        </div>

                    </form>
                </section>

            )}
        </div>
    );
};

export default AnagraficaForm;
