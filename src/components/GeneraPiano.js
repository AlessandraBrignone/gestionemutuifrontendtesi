import React, {useEffect, useState, useMemo} from 'react';
import axios from '../api/axiosInstance';
import Swal from "sweetalert2";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const GeneraPiano = ({ onCompletamento, richiesta, anagrafiche }) => {
    const [piano, setPiano] = useState([]);
    const [paginaCorrente, setPaginaCorrente] = useState(1);
    const righePerPagina = 12;

    const [loading, setLoading] = useState(false);
    const [richiesteMutuo, setRichiesteMutuo] = useState([]);
    const [durate, setDurate] = useState([]);
    const [cadenze, setCadenze] = useState([]);
    const [tipiMutuo, setTipiMutuo] = useState([]);
    const [error, setError] = useState(null);
    //State per la modale per l'esportazione
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState("pdf");

    //Formattazione euro per renderlo leggibile nel pdf
    const toNum = (v) => {
      if (typeof v === 'string') {
        // se arriva "1234,56" lo converto in "1234.56", altrimenti lo lascio
        const s = v.includes(',') && !v.includes('.') ? v.replace(',', '.') : v;
        const n = Number(s);
        return isNaN(n) ? 0 : n;
      }
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    };
    const formatEuro = (val) =>
      new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })
        .format(toNum(val));

    // Effetto per caricare dati Durata, cadenza rata e tipo mutuo
    useEffect(() => {
        axios.get('/durata').then(res => setDurate(res.data));
        axios.get('/cadenza_rata').then(res => setCadenze(res.data));
        axios.get('/tipo_mutuo').then(res => setTipiMutuo(res.data));
    }, []);

    const durataSelezionata = durate.find(d => d.id === richiesta.durata);
    const cadenzaSelezionata = cadenze.find(c => c.id === richiesta.cadenzaRata);
    const tipoMutuoSelezionato = tipiMutuo.find(t => t.id === richiesta.tipoMutuo);


    //Click su Genera piano ammortamento
    const genera = async () => {
      setLoading(true);
      try {
        const res = await axios.post("/genera_piano", { richiestaId: richiesta.id });
        setPiano(res.data);
        setPaginaCorrente(1);
      } catch (err) {
        console.error("Genera piano - errore:", err);
        const msg = err.response?.data?.error || err.response?.data || "Impossibile generare il piano";
        Swal.fire("Errore", msg, "error");
      } finally {
        setLoading(false);
      }
    };

    //Calcolo Piano ammortamento
    const calcolaPianoConQuote = () => {

        const interesse = parseFloat(richiesta.interesseAnnuo) / 100;
        const importoTotale = parseFloat(richiesta.importo);
        const durataAnni = parseInt(durataSelezionata?.descrizioneDurata || 0);
        const cadenza = cadenzaSelezionata?.descrizioneTipoRata?.toUpperCase() || '';

        if(!interesse || !importoTotale || !durataAnni || !cadenza ) return [];

        let rateTotali;
        if (cadenza.includes("MENSILE")) rateTotali = durataAnni * 12;
        else if (cadenza.includes("TRIMESTRALE")) rateTotali = durataAnni * 4;
        else if (cadenza.includes("SEMESTRALE")) rateTotali = durataAnni * 2;
        else rateTotali = durataAnni; // fallback annuale

        const tassoPeriodico = interesse / (rateTotali / durataAnni);
        const rataCostante = importoTotale * (tassoPeriodico / (1 - Math.pow(1 + tassoPeriodico, -rateTotali)));

        const nuovoPiano = [];
        let capitaleResiduo = importoTotale;

        for (let i = 1; i <= rateTotali; i++) {
          const quotaInteressi = capitaleResiduo * tassoPeriodico;
          const quotaCapitale = rataCostante - quotaInteressi;
          const totaleRata = quotaInteressi + quotaCapitale;   // <--- NEW
          capitaleResiduo -= quotaCapitale;

          nuovoPiano.push({
            idMutuo: richiesta.id,
            numeroRata: i,
            quotaInteressi: quotaInteressi.toFixed(2),
            quotaCapitale: quotaCapitale.toFixed(2),
            totaleRata: totaleRata.toFixed(2),                 // <--- NEW
            capitaleResiduo: capitaleResiduo > 0 ? capitaleResiduo.toFixed(2) : '0.00',
          });
        }

        return nuovoPiano;
    };

    const pianoCalcolato = useMemo(
    () => calcolaPianoConQuote(),
    [richiesta, durataSelezionata, cadenzaSelezionata]
    );

    const pianoDaMostrare = useMemo(
      () => (piano?.length ? piano : pianoCalcolato),
      [piano, pianoCalcolato]
    );
    const totalePagine = Math.max(1, Math.ceil(pianoDaMostrare.length / righePerPagina));
    const righeMostrate = pianoDaMostrare.slice(
      (paginaCorrente - 1) * righePerPagina,
      paginaCorrente * righePerPagina
    );

    //Funzione per l'esportazione
    const handleEsporta = () => {
        setShowExportModal(false);

        if (exportFormat === "pdf") {
          const doc = new jsPDF();
          doc.text("Piano Ammortamento", 14, 10);
          autoTable(doc, {
            startY: 20,
            head: [['#', 'Totale Rata', 'Quota Interessi', 'Quota Capitale', 'Capitale Residuo']],
            body: pianoDaMostrare.map((riga) => [
              riga.numeroRata,
              formatEuro(riga.totaleRata),
              formatEuro(riga.quotaInteressi),
              formatEuro(riga.quotaCapitale),
              formatEuro(riga.capitaleResiduo),
            ])
          });
          doc.save(`PianoAmmortamento_${richiesta.id}.pdf`);
        }

        if (exportFormat === "excel") {
          const ws = XLSX.utils.json_to_sheet(
            pianoDaMostrare.map((riga) => ({
              "Numero Rata": riga.numeroRata,
              "Totale Rata": parseFloat(riga.totaleRata),       // NEW
              "Quota Interessi": parseFloat(riga.quotaInteressi),
              "Quota Capitale": parseFloat(riga.quotaCapitale),
              "Capitale Residuo": parseFloat(riga.capitaleResiduo),
            }))
          );

          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Piano Ammortamento");

          const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
          const data = new Blob([excelBuffer], { type: "application/octet-stream" });
          saveAs(data, `PianoAmmortamento_${richiesta.id}.xlsx`);
        }
    };

    //Funzione per l'invio della richiesta
    const handleInviaRichiesta = async () => {
        try {
            await axios.post("/richiesta_mutuo/invia", { richiestaId: richiesta.id });

            Swal.fire("Inviata", "La richiesta è stata inoltrata con successo!", "success").then(() => {
                // Vai alla pagina con tutte le richieste inoltrate
                window.location.href = "/richieste_inoltrate"; // oppure usa navigate() di react-router-dom
            });
        } catch (error) {
            Swal.fire("Errore", "Impossibile inviare la richiesta", "error");
        }
    };

    //Funzione per annullare la richiesta
    const handleAnnulla = () => {
        if (typeof onCompletamento === 'function') {
            onCompletamento(null); // oppure un flag che ti faccia tornare indietro al tab mutuo
        }
    };

    //Funzione per la paginazione
    const getPageItems = (total, current, max = 7) => {
        if (total <= max) return [...Array(total)].map((_, i) => i + 1);

        //Prime 3, corrente, ultime 3
        const pages = new Set([1, 2, 3, total - 2, total - 1, total, current, current+1, current-1]);

        // ordina
        const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);

        // inserisci puntini quando c'è un buco > 1
        const out = [];
        sorted.forEach((p, i) => {
            if (i && p - sorted[i - 1] > 1) out.push('...');
            out.push(p);
        });
        return out;
    };

    return (
        <div className="container py-4">
            <h2 className="text-center mb-4">Genera piano</h2>

            {anagrafiche && anagrafiche.length > 0 && (
                <div className="row mb-2">
                    <h4 className="col-6 col-md-3">Dati</h4>
                    {anagrafiche.map((r, idx) => (
                        <div key={r.codiceFiscale + idx} className="border rounded p-3 mb-3">
                            <div className="row">
                                <div className="col-md-3 col-6 mb-2">
                                    <span className="fw-bold text-dark d-block">Codice Fiscale</span>
                                    <p className="mb-0">{r.codiceFiscale}</p>
                                </div>
                                <div className="col-md-3 col-6 mb-2">
                                    <span className="fw-bold text-dark d-block">Nome</span>
                                    <p className="mb-0">{r.nome}</p>
                                </div>
                                <div className="col-md-3 col-6 mb-2">
                                    <span className="fw-bold text-dark d-block">Cognome</span>
                                    <p className="mb-0">{r.cognome}</p>
                                </div>
                                <div className="col-md-3 col-6 mb-2">
                                    <span className="fw-bold text-dark d-block">Tipo Richiedente</span>
                                    <p className="mb-0">{r.tipo}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <h5>Richiesta</h5>
            <div className="row mb-2">
                <div className="col-6 col-md-3">
                    <span className="fw-bold text-dark d-block">Id mutuo</span>
                    <p className="mt-2 mb-0">{richiesta.id}</p>
                </div>
                <div className="col-6 col-md-3">
                    <span className="fw-bold text-dark d-block">Importo</span>
                    <p className="mt-2 mb-0">
                        {new Intl.NumberFormat('it-IT', {
                            style: 'currency',
                            currency: 'EUR',
                            minimumFractionDigits: 2
                        }).format(richiesta.importo)}
                    </p>
                </div>
                <div className="col-6 col-md-3">
                    <span className="fw-bold text-dark d-block">Durata</span>
                    <p className="mt-2 mb-0" >{durataSelezionata?.descrizioneDurata || "Durata non disponibile"} anni</p>
                </div>
                <div className="col-6 col-md-3">
                    <span className="fw-bold text-dark d-block">Cadenza rata</span>
                    <p className="mt-2 mb-0">{cadenzaSelezionata?.descrizioneTipoRata || "Cadenza non disponibile"}</p>
                </div>
                <div className="col-6 col-md-3">
                    <span className="fw-bold text-dark d-block">Tipo mutuo</span>
                    <p className="mt-2 mb-0">{tipoMutuoSelezionato?.descrizioneTipoMutuo || "Tipo mutuo non disponibile"}</p>
                </div>
            </div>


            <button className="btn btn-primary mb-3" onClick={genera} disabled={loading}>
                {loading ? "Calcolo…" : "Genera piano di ammortamento"}
            </button>

            {pianoDaMostrare.length > 0 && (
                <div className="table-responsive mt-4">
                    <h5>Piano Ammortamento</h5>
                    <table className="table table-bordered">
                        <thead className="table-light">
                            <tr>
                                <th>Numero Rata</th>
                                <th>Totale Rata</th>
                                <th>Quota Interessi</th>
                                <th>Quota Capitale</th>
                                <th>Capitale Residuo</th>
                            </tr>
                        </thead>
                        <tbody>
                        {righeMostrate.map((riga, idx) => (
                            <tr key={idx}>
                                <td>{riga.numeroRata}</td>
                                <td>{formatEuro(riga.totaleRata)}</td>
                                <td>{formatEuro(riga.quotaInteressi)}</td>
                                <td>{formatEuro(riga.quotaCapitale)}</td>
                                <td>{formatEuro(riga.capitaleResiduo)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    <nav className="d-flex justify-content-center mt-3">
                        <ul className="pagination">

                            <li className={`page-item ${paginaCorrente === 1 ? "disabled" : ""}`}>
                                <button className="page-link"
                                        onClick={() => setPaginaCorrente(paginaCorrente - 1)}>
                                    «
                                </button>
                            </li>

                            {getPageItems(totalePagine, paginaCorrente).map((item, idx) =>
                                item === '...' ? (
                                    <li key={`dots-${idx}`} className="page-item disabled">
                                        <span className="page-link">…</span>
                                    </li>
                                ) : (
                                    <li key={item}
                                        className={`page-item ${paginaCorrente === item ? "active" : ""}`}>
                                        <button className="page-link" onClick={() => setPaginaCorrente(item)}>
                                            {item}
                                        </button>
                                    </li>
                                )
                            )}

                            <li className={`page-item ${paginaCorrente === totalePagine ? "disabled" : ""}`}>
                                <button className="page-link"
                                        onClick={() => setPaginaCorrente(paginaCorrente + 1)}>
                                    »
                                </button>
                            </li>

                        </ul>
                    </nav>

                    {/*Button*/}
                    <div className="d-flex justify-content-center gap-3 mt-4">
                        <button className="btn btn-outline-primary" onClick={() => setShowExportModal(true)}>Esporta</button>
                        <button className="btn btn-success" onClick={handleInviaRichiesta}>Invia richiesta</button>
                        <button className="btn btn-secondary" onClick={handleAnnulla}>Annulla</button>
                    </div>

                    {/*Modale per l'esportazione*/}
                    {showExportModal && (
                        <div className="modal show d-block" tabIndex="-1">
                            <div className="modal-dialog">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Esporta piano ammortamento</h5>
                                        <button type="button" className="btn-close" onClick={() => setShowExportModal(false)}></button>
                                    </div>
                                    <div className="modal-body">
                                        <p>Seleziona il formato:</p>
                                        <div className="form-check">
                                            <input className="form-check-input" type="radio" name="formato" id="pdf" value="pdf"
                                                   checked={exportFormat === "pdf"}
                                                   onChange={(e) => setExportFormat(e.target.value)} />
                                            <label className="form-check-label" htmlFor="pdf">PDF</label>
                                        </div>
                                        <div className="form-check">
                                            <input className="form-check-input" type="radio" name="formato" id="excel" value="excel"
                                                   checked={exportFormat === "excel"}
                                                   onChange={(e) => setExportFormat(e.target.value)} />
                                            <label className="form-check-label" htmlFor="excel">Excel</label>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-secondary" onClick={() => setShowExportModal(false)}>Annulla</button>
                                        <button className="btn btn-primary" onClick={handleEsporta}>Conferma</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            )}

        </div>
    );
};

export default GeneraPiano;
