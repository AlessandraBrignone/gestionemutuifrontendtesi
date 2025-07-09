import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Swal from 'sweetalert2';

export default function CaricaDocumenti({ richiesta, onCompletamento }) {
    const [tipiDocumento, setTipiDocumento] = useState([]);
    const [utente, setUtente] = useState(null);
    const [ruoloId, setRuoloId] = useState(null);
    const [caricati, setCaricati] = useState({});
    const [uploading, setUploading] = useState({});

    //Recuperare l'utente connesso
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("utente"));
        if (storedUser) {
            setUtente(storedUser);
            setRuoloId(storedUser?.ruolo?.id);
        }
    }, []);

    useEffect(() => {
        axios.get('/documenti/tipi')
            .then(res => setTipiDocumento(res.data))
            .catch(() => Swal.fire("Errore", "Errore nel caricamento dei tipi documento", "error"));
    }, []);

    useEffect(() => {
        if (!richiesta?.id || !ruoloId) return;

        axios.get(`/documenti/caricati/${richiesta.id}`)
            .then(res => {
                const status = {};
                res.data?.forEach(d => {
                    if (d.tipoDocumento != null) {
                        status[d.tipoDocumento] = true;
                    }
                });
                setCaricati(status);
            })
            .catch((err) => {
                console.warn("Nessun documento caricato per questa richiesta.", err);
                Swal.fire("Attenzione", "Impossibile recuperare i documenti caricati", "warning");
            });
    }, [richiesta?.id, ruoloId]);

    //Gestione caricamento docuemnti
    const canUpload = (docId) => {
        //Il funzionario non può caricare i documenti da id 11 a 14
        if (ruoloId === 1 && docId >= 11 && docId <=14 ){
            return false;
        }
        return true;
    };

    //Gestione per il download dei documenti
    const canDownload = (docId) => {
        if (ruoloId === 3) return true;
        if (ruoloId === 2 && docId >= 1 && docId <= 10) return true;
        return false;
    };

    const handleUpload = async (idTipoDocumento, file) => {
        console.log("Upload effettuato per richiesta ID:", richiesta?.id);
        if (!file || !richiesta?.id) {
            Swal.fire("Errore", "File mancante o richiesta non valida", "error");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("idMutuo", richiesta.id);
        console.log("ID MUTUO:", richiesta.id)
        formData.append("idTipoDocumento", idTipoDocumento);

        setUploading(prev => ({ ...prev, [idTipoDocumento]: true }));

        try {
            await axios.post("/documenti/upload", formData);
            Swal.fire("Successo", "Documento caricato con successo", "success");
            // Ricarica i documenti salvati effettivi dal backend
            axios.get(`/documenti/caricati/${richiesta.id}`)
              .then(res => {
                  const status = {};
                  res.data?.forEach(d => {
                      // Uniformiamo la chiave come in altri punti del codice
                      status[d.tipoDocumento] = true;
                  });
                  setCaricati(status);
              })
                .catch((err) => {
                    console.error("Errore aggiornamento stato locale:", err);
                    Swal.fire("Attenzione", "Documento caricato, ma impossibile aggiornare lo stato locale", "warning");
                });
        } catch {
            Swal.fire("Errore", "Caricamento fallito", "error");
        } finally {
            setUploading(prev => ({ ...prev, [idTipoDocumento]: false }));
        }
    };

    const handleDownload = async (idTipoDocumento) => {
        try {
            const response = await axios.get(`/documenti/download`, {
                params: { idMutuo: richiesta.id, idTipoDocumento },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `documento_${idTipoDocumento}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            Swal.fire("Errore", "Download fallito", "error");
        }
    };

    const almenoUnoCaricato = tipiDocumento
        .filter(doc => canUpload(doc.id))
        .some(doc => caricati[doc.id]);

    const handleContinua = () => {
      Swal.fire({
        title: 'Procedere?',
        text: 'Hai caricato tutta la documentazione richiesta?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sì, continua',
        cancelButtonText: 'Annulla'
      }).then((result) => {
        if (result.isConfirmed) {
          onCompletamento();
        }
      });
    };

    return (
        <div>
            <h5>Documenti richiesti per la richiesta</h5>
            <h6>id richiesta {richiesta?.id}</h6>

            <ul className="list-group mb-4">
                {tipiDocumento.map(doc => {
                    const uploadPermesso = canUpload(doc.id);
                    const downloadPermesso = canDownload(doc.id);
                    const giaCaricato = caricati[doc.id];

                    return (
                        <li
                        key={doc.id}
                        className="list-group-item d-flex justify-content-between align-items-center"
                        >
                            <span>{doc.descrizioneTipoDocumento}</span>
                            <div className="d-flex align-items-center">
                                {giaCaricato &&
                                    <span
                                        className="btn btn-sm btn-success rounded-circle"
                                        title="Documento caricato"
                                    >️
                                        <i className="fas fa-check" aria-hidden="true"></i>
                                    </span>
                                }
                                {uploadPermesso && (
                                  <>
                                    <input
                                        type="file"
                                        id={`upload-${doc.id}`}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        style={{ display: 'none' }}
                                        onChange={(e) => handleUpload(doc.id, e.target.files[0])}
                                        disabled={uploading[doc.id]}
                                    />
                                    <label
                                        htmlFor={`upload-${doc.id}`}
                                        className={
                                            `btn btn-sm rounded-circle ` +
                                                (giaCaricato ? "btn-outline-warning"
                                                             : "btn-outline-primary")
                                        }
                                        title={giaCaricato ? "Sostituisci" : "Carica"}
                                        aria-label={giaCaricato ? "Sostituisci file" : "Carica file"}
                                    >
                                         <i
                                            className={giaCaricato ? "fas fa-sync-alt" : "fas fa-upload"}
                                            style={{ color: giaCaricato ? "#ffc107" : "inherit" }}
                                            aria-hidden="true">
                                         </i>
                                    </label>
                                  </>
                                )}
                                {downloadPermesso && (
                                    <button
                                        className="btn btn-sm btn-outline-secondary rounded-circle"
                                        onClick={() => handleDownload(doc.id)}
                                        disabled={!giaCaricato}
                                        title={!giaCaricato ? "Documento non ancora caricato" : ""}
                                    >
                                        <i className="fas fa-solid fa-download" aria-hidden="true"></i>
                                    </button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            <div className="text-end">
                <button
                    type="submit"
                    className="btn btn-success"
                    onClick={handleContinua}
                    disabled={!almenoUnoCaricato}
                >
                    Continua
                </button>
            </div>
        </div>
    );
}
