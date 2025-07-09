import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Swal from 'sweetalert2';
import { NumericFormat } from 'react-number-format'; //Importazione per i campi valore

// Accettare formData e setFormData come prop dal padre
const InserimentoRichiestaMutuo = ({onCompletamento, anagrafiche, formData, setFormData}) => {
    const [richiesteMutuo, setRichiesteMutuo] = useState([]);
    const [durate, setDurate] = useState([]);
    const [cadenze, setCadenze] = useState([]);
    const [tipiMutuo, setTipiMutuo] = useState([]);
    const [posizioneLavorativa, setPosizioneLavorativa] = useState([]);
    const [showInsert, setShowInsert] = useState(false);
    const [error, setError] = useState(null);
    const [rata, setRata] = useState(null);
    const [errors, setErrors] = useState({});

    const intestatario = anagrafiche.find(anag => anag.tipo?.toUpperCase() === "INTESTATARIO");
    const cointestatario = anagrafiche.find(anag => anag.tipo?.toUpperCase() === "COINTESTATARIO");
    const garante = anagrafiche.find(anag => anag.tipo?.toUpperCase() === "GARANTE");

    // Effetto per caricare dati iniziali nelle combobox
    useEffect(() => {
        fetchData();
        axios.get('/durata').then(res => setDurate(res.data));
        axios.get('/cadenza_rata').then(res => setCadenze(res.data));
        axios.get('/tipo_mutuo').then(res => setTipiMutuo(res.data));
        axios.get('/posizione_lavorativa').then(res => setPosizioneLavorativa(res.data));
    }, []);

    const durataSelezionata = durate.find(d => d.id === richiesteMutuo.durata);
    const cadenzaSelezionata = cadenze.find(c => c.id === richiesteMutuo.cadenzaRata);
    const tipoMutuoSelezionato = tipiMutuo.find(t => t.id === richiesteMutuo.tipoMutuo);
    console.log("Posizone lavorativa:", richiesteMutuo.posizioneLavorativaIn);
    const posizioneLavorativaSelezionata = posizioneLavorativa.find(pl => pl.id === richiesteMutuo.posizioneLavorativaIn);

    // Funzione per recuperare tutte le richieste
    function fetchData() {
        axios.get("/richiesta_mutuo")
            .then(res => {
                setRichiesteMutuo(res.data);
                setError(null);
            })
            .catch(err => {
                setError("Impossibile connettersi al server. Verificare che il backend sia in esecuzione.");
                Swal.fire({
                    icon: 'error',
                    title: 'Errore di connessione',
                    text: 'Impossibile connettersi al server. Verificare che il backend sia in esecuzione.'
                });
            });
    }

    // Funzione per l'invio del modulo.
    //Il salvataggio viene effettuato con la chiamata api in InserimentoRichiestaMutuoPage
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validazione: valore immobile > importo
        const importoNum = parseFloat(formData.importo || "0");
        const immobileNum = parseFloat(formData.valoreImmobile || "0");

        if (!immobileNum || immobileNum <= importoNum) {
            setErrors(prev => ({
                ...prev,
                valoreImmobile: "Il valore dell'immobile deve essere maggiore dell'importo richiesto."
            }));

            Swal.fire({
                icon: 'warning',
                title: 'Validazione fallita',
                text: "Il valore dell'immobile deve essere maggiore dell'importo richiesto."
            });
            return;
        } else {
            setErrors(prev => ({ ...prev, valoreImmobile: undefined }));
        }

        try {
            if (typeof onCompletamento === "function") {
                onCompletamento(formData);
            }

        } catch (error) {
            if (error.response && error.response.status === 400) {
                Swal.fire({
                    icon: 'error',
                    title: 'Errore salvataggio',
                    text: error.response.data?.error || 'Errore nei dati inseriti.',
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Errore imprevisto',
                    text: 'Errore di rete o server non disponibile.',
                });
            }
        }
    };

    // Funzione per gestire il cambiamento dei campi del form
    function handleChange(e) {
        const { name, value } = e.target;

        // Aggiorna formData
        setFormData(prev => ({ ...prev, [name]: value }));

        // Validazione campo "importo" in tempo reale
        if (name === "importo") {
            const numero = parseFloat(value);
            if (!value || isNaN(numero) || numero < 50000) {
                setErrors(prev => ({ ...prev, importo: "Importo minimo: 50.000 €" }));
            } else {
                setErrors(prev => ({ ...prev, importo: undefined }));
            }
        }
    }

    // Funzione per annullare l'inserimento
    function handleAnnulla() {
        setShowInsert(false);
        setFormData({
            durata: '',
            importo: '',
            importoRata: '',
            cadenzaRata: '',
            tipoMutuo: '',
            interesseAnnuo: '',
            pianoAmmortamento: '',
            spread: '',
            statoRichiesta: '',
            durataRichiesta: '',
            dataRiscossione: '',
            valoreImmobile: '',
            redditoFamiliare: '',
            componentiNucleoFamiliare: '',
            valoreBeniImmobili: '',
            valorePartecipazione: '',
            ultimoIsee: ''
        });
    }

    //Funzione per aprire la sezione Dati finanziari Garante solo se è stato scelto un Garante
    const hasGarante = anagrafiche.some(
        (a) => a.tipo?.toUpperCase() === "GARANTE"
    );

    //Funzione per gestire il popolamento del campo lo spread
    useEffect(() => {
      if (!formData.tipoMutuo) {
        setFormData(prev => ({ ...prev, spreadMutuo: '' }));
        return;
      }

      //Cerco il tipo mutuo selezionato dentro l'array già caricato
      const tm = tipiMutuo.find(
        t => t.id === Number(formData.tipoMutuo)
      );

      const valoreSpread =
        tm?.spread?.descrizioneSpread
        ?? tm?.valoreSpread
        ?? tm?.spreadMutuo;

      setFormData(prev => ({
        ...prev,
        spreadMutuo: valoreSpread != null
          ? valoreSpread.toLocaleString('it-IT', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })
          : ''
      }));
    }, [formData.tipoMutuo, tipiMutuo]);

    return (
        <div className="container py-4">
            <h2 className="text-center mb-4">Richiesta mutuo</h2>

            <form onSubmit={handleSubmit}>
                {/*Richiesta mutuo*/}
                <section className="border p-4 rounded bg-light mb-4">
                    <h4 className="mb-3">Inserimento richiesta mutuo</h4>
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label htmlFor="importo" className="fw-bold text-dark d-block">
                                Importo
                                <span
                                    className="ms-2"
                                    style={{ cursor: 'pointer' }}
                                    title="Inserire un importo minimo di 50.000 €"
                                >
                                <i className="bi bi-info-circle"></i>
                                </span>
                            </label>
                            <NumericFormat
                                className={`form-control ${errors.importo ? 'is-invalid' : ''}`}
                                thousandSeparator="."
                                decimalSeparator=","
                                prefix="€ "
                                decimalScale={2}
                                fixedDecimalScale
                                allowNegative={false}
                                value={formData.importo}
                                onValueChange={({ value }) => {
                                    const numero = parseFloat(value);
                                    setFormData(prev => ({ ...prev, importo: value }));

                                    if (!value || isNaN(numero) || numero < 50000) {
                                        setErrors(prev => ({ ...prev, importo: "Importo minimo: 50.000 €" }));
                                    } else {
                                        setErrors(prev => ({ ...prev, importo: undefined }));
                                    }
                                }}
                                required
                            />
                            {errors.importo && (
                                <div className="invalid-feedback">{errors.importo}</div>
                            )}
                        </div>

                        <div className="col-md-6">
                            <label htmlFor="valoreImmobile" className="fw-bold text-dark d-block">
                                Valore immobile
                            </label>
                            <NumericFormat
                                className="form-control"
                                thousandSeparator="."
                                decimalSeparator=","
                                prefix="€ "
                                decimalScale={2}
                                fixedDecimalScale
                                allowNegative={false}
                                value={formData.valoreImmobile}
                                onValueChange={({ value }) => {
                                    const importoNum = parseFloat(formData.importo || "0");
                                    const immobileNum = parseFloat(value);

                                    setFormData(prev => ({ ...prev, valoreImmobile: value }));

                                    if (importoNum && immobileNum && immobileNum <= importoNum) {
                                        setErrors(prev => ({ ...prev, valoreImmobile: "Il valore dell'immobile deve essere maggiore dell'importo richiesto." }));
                                    } else {
                                        setErrors(prev => ({ ...prev, valoreImmobile: undefined }));
                                    }
                                }}
                                required
                            />
                            {errors.valoreImmobile && (
                                <div className="invalid-feedback d-block">{errors.valoreImmobile}</div>
                            )}
                        </div>
                        <div className="row mb-3">
                            <div className="col-md-4">
                                <label htmlFor="durata" className="fw-bold text-dark d-block">Durata in anni</label>
                                <select
                                    className="form-select"
                                    name="durata"
                                    id="durata"
                                    value={formData.durata}
                                    onChange={handleChange}
                                    style={{ maxWidth: '250px' }}
                                >
                                    <option value="">Seleziona una durata</option>
                                    {durate.map(durata => (
                                        <option key={durata.id} value={durata.id}>{durata.descrizioneDurata}</option>
                                    ))}
                                    required
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label htmlFor="cadenzaRata" className="fw-bold text-dark d-block">Cadenza rata</label>
                                <select
                                    className="form-select"
                                    name="cadenzaRata"
                                    id="cadenzaRata"
                                    value={formData.cadenzaRata}
                                    onChange={handleChange}
                                    style={{ maxWidth: '250px' }}
                                >
                                    <option value="">Seleziona una cadenza</option>
                                    {cadenze.map(cadenza => (
                                        <option key={cadenza.id} value={cadenza.id}>{cadenza.descrizioneTipoRata}</option>
                                    ))}
                                    required
                                </select>
                            </div>
                            {/*Data riscossione*/}
                            <div className="col-md-4">
                                <label htmlFor="dataRiscossione" className="fw-bold text-dark d-block">Cadenza riscossione</label>
                                <select
                                    className="form-select"
                                    name="cadenzaRiscossione"
                                    id="cadenzaRiscossione"
                                    value={formData.durataRichiesta}
                                    onChange={handleChange}
                                    style={{ maxWidth: '250px' }}
                                >
                                    <option value="">Seleziona una cadenza</option>
                                    <option value="1">1</option>
                                    <option value="5">5</option>
                                    <option value="10">10</option>
                                </select>
                            </div>
                        </div>
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label htmlFor="tipoMutuo" className="fw-bold text-dark d-block">Tipo mutuo</label>
                                <select
                                    className="form-select"
                                    name="tipoMutuo"
                                    id="tipoMutuo"
                                    value={formData.tipoMutuo}
                                    onChange={handleChange}
                                >
                                    <option value="">Seleziona una tipo di mutuo</option>
                                    {tipiMutuo.map(tipoMutuo => (
                                        <option key={tipoMutuo.id} value={tipoMutuo.id}>{tipoMutuo.descrizioneTipoMutuo}</option>
                                    ))}
                                    required
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label htmlFor="spreadMutuo" className="fw-bold text-dark d-block">Spread</label>
                                <input
                                    type="text"
                                    name="spreadMutuo"
                                    id="spreadMutuo"
                                    className="form-control"
                                    value={formData.spreadMutuo}
                                    disabled
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <label htmlFor="interesseAnnuo" className="fw-bold text-dark d-block">Interesse annuo</label>
                            <NumericFormat
                                className="form-control"
                                decimalScale={2}
                                fixedDecimalScale
                                suffix=" %"
                                allowNegative={false}
                                value={formData.interesseAnnuo}
                                onValueChange={({ value }) => {
                                    setFormData(prev => ({ ...prev, interesseAnnuo: value }));
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div className="row mb-3">
                        {/*<div className="col-md-4">*/}
                        {/*    <label htmlFor="durataRichiesta" className="fw-bold text-dark d-block">Durata richiesta</label>*/}
                        {/*    <input*/}
                        {/*        type="number"*/}
                        {/*        name="durataRichiesta"*/}
                        {/*        id="durataRichiesta"*/}
                        {/*        className="form-control"*/}
                        {/*        value={formData.durataRichiesta}*/}
                        {/*        onChange={handleChange}*/}
                        {/*        required*/}
                        {/*    />*/}
                        {/*</div>*/}
                    </div>
                    <div className="col-6 col-md-3">
                        <span className="fw-bold text-dark d-block">Stato richiesta</span>
                        <p className="mt-2 mb-0">Bozza</p>
                    </div>

                    {rata && (
                        <div className="alert alert-info mt-3">
                            <strong>Importo rata: </strong>
                            {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(rata)}
                        </div>
                    )}
                </section>

                {/*Dati finanziari intestatario/cointestatario*/}
                <section className="border p-4 rounded bg-light mb-4">
                    <h4 className="mb-3">Inserimento Dati Finanziari</h4>
                    <h5 className="mb-3">Intestatrio/cointestatario</h5>
                    <div className="row mb-3">
                        <div className="col-md-4">
                            <label htmlFor="redditoFamiliareIc" className="fw-bold text-dark d-block">Reddito Familiare</label>
                            <NumericFormat
                                className="form-control"
                                thousandSeparator="."
                                decimalSeparator=","
                                prefix="€ "
                                decimalScale={2}
                                fixedDecimalScale
                                allowNegative={false}
                                value={formData.redditoFamiliareIc}
                                onValueChange={({ value }) => {
                                    setFormData(prev => ({ ...prev, redditoFamiliareIc: value }));
                                }}
                                required
                            />
                        </div>
                        {intestatario && (
                            <div className="mb-3">
                                <label htmlForm="posizioneLavorativaIn" className="fw-bold text-dark d-block">Posizione lavorativa intestatario</label>
                                <select
                                    className="form-select"
                                    name="posizioneLavorativaIn"
                                    id="posizioneLavorativaIn"
                                    value={formData.posizioneLavorativaIn}
                                    onChange={handleChange}
                                >
                                    <option value="">Seleziona una posizione lavorativa</option>
                                    {posizioneLavorativa.map(pl => (
                                        <option key={pl.id} value={pl.id}>{pl.descrizionePosizioneLavorativa}</option>
                                    ))}
                                    required
                                </select>
                            </div>
                        )}
                        {cointestatario && (
                            <div className="mb-3">
                                <label html="posizioneLavorativaCo" className="fw-bold text-dark d-block">Posizione lavorativa cointestatario</label>
                                <select
                                    className="form-select"
                                    name="posizioneLavorativaCo"
                                    id="posizioneLavorativaCo"
                                    value={formData.posizioneLavorativaCo || ''}
                                    onChange={handleChange}
                                >
                                    <option value="">Seleziona una posizione lavorativa</option>
                                    {posizioneLavorativa.map(pl => (
                                        <option key={pl.id} value={pl.id}>{pl.descrizionePosizioneLavorativa}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="col-md-4">
                            <label className="fw-bold text-dark d-block" htmlFor="componentiNucleoFamiliareIc">Componenti Nucleo Familiare</label>
                            <input
                                type="number"
                                name="componentiNucleoFamiliareIc"
                                id="componentiNucleoFamiliareIc"
                                className="form-control"
                                value={formData.componentiNucleoFamiliareIc}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="fw-bold text-dark d-block" htmlFor="valoreBeniImmobiliIc">Valore Beni Immobili</label>
                            <NumericFormat
                                className="form-control"
                                thousandSeparator="."
                                decimalSeparator=","
                                prefix="€ "
                                decimalScale={2}
                                fixedDecimalScale
                                allowNegative={false}
                                value={formData.valoreBeniImmobiliIc}
                                onValueChange={({ value }) => {
                                    setFormData(prev => ({ ...prev, valoreBeniImmobiliIc: value }));
                                }}
                                required
                            />
                        </div>
                    </div>
                    <div className="row mb-3">
                        <div className="col-md-4">
                            <label className="fw-bold text-dark d-block" htmlFor="valorePartecipazioneIc">Valore Partecipazione</label>
                            <NumericFormat
                                className="form-control"
                                thousandSeparator="."
                                decimalSeparator=","
                                prefix="€ "
                                decimalScale={2}
                                fixedDecimalScale
                                allowNegative={false}
                                value={formData.valorePartecipazioneIc}
                                onValueChange={({ value }) => {
                                    setFormData(prev => ({ ...prev, valorePartecipazioneIc: value }));
                                }}
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="fw-bold text-dark d-block" htmlFor="ultimoIseeIc">Ultimo ISEE</label>
                            <NumericFormat
                                className="form-control"
                                thousandSeparator="."
                                decimalSeparator=","
                                prefix="€ "
                                decimalScale={2}
                                fixedDecimalScale
                                allowNegative={false}
                                value={formData.ultimoIseeIc}
                                onValueChange={({ value }) => {
                                    setFormData(prev => ({ ...prev, ultimoIseeIc: value }));
                                }}
                                required
                            />
                        </div>
                    </div>
                </section>

                {/*Dati finanziari garante*/}
                {hasGarante && (
                    <section className="border p-4 rounded bg-light mb-4">
                        <h4 className="mb-3">Inserimento Dati Finanziari</h4>
                        <h5 className="mb-3">Garante</h5>
                        <div className="row mb-3">
                            <div className="col-md-4">
                                <label className="fw-bold text-dark d-block" htmlFor="redditoFamiliareGa">Reddito Familiare</label>
                                <NumericFormat
                                    className="form-control"
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    prefix="€ "
                                    decimalScale={2}
                                    fixedDecimalScale
                                    allowNegative={false}
                                    value={formData.redditoFamiliareGa}
                                    onValueChange={({ value }) => {
                                        setFormData(prev => ({ ...prev, redditoFamiliareGa: value }));
                                    }}
                                    required
                                />
                            </div>
                            {garante && (
                                <div className="mb-3">
                                    <label html="posizioneLavorativaGa" className="fw-bold text-dark d-block">Posizione lavorativa garante</label>
                                    <select
                                        className="form-select"
                                        name="posizioneLavorativaGarante"
                                        id="posizioneLavorativaGa"
                                        value={formData.posizioneLavorativaGarante || ''}
                                        onChange={handleChange}
                                    >
                                        <option value="">Seleziona una posizione lavorativa</option>
                                        {posizioneLavorativa.map(pl => (
                                            <option key={pl.id} value={pl.id}>{pl.descrizionePosizioneLavorativa}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="col-md-4">
                                <label className="fw-bold text-dark d-block" htmlFor="componentiNucleoFamiliareGa">Componenti Nucleo Familiare</label>
                                <input
                                    type="number"
                                    name="componentiNucleoFamiliareGa"
                                    id="componentiNucleoFamiliareGa"
                                    className="form-control"
                                    value={formData.componentiNucleoFamiliareGa}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="fw-bold text-dark d-block" htmlFor="valoreBeniImmobiliGa">Valore Beni Immobili</label>
                                <NumericFormat
                                    className="form-control"
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    prefix="€ "
                                    decimalScale={2}
                                    fixedDecimalScale
                                    allowNegative={false}
                                    value={formData.valoreBeniImmobiliGa}
                                    onValueChange={({ value }) => {
                                        setFormData(prev => ({ ...prev, valoreBeniImmobiliGa: value }));
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-4">
                                <label className="fw-bold text-dark d-block" htmlFor="valorePartecipazioneGa">Valore Partecipazione</label>
                                <NumericFormat
                                    className="form-control"
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    prefix="€ "
                                    decimalScale={2}
                                    fixedDecimalScale
                                    allowNegative={false}
                                    value={formData.valorePartecipazioneGa}
                                    onValueChange={({ value }) => {
                                        setFormData(prev => ({ ...prev, valorePartecipazioneGa: value }));
                                    }}
                                    required
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="fw-bold text-dark d-block" htmlFor="ultimoIseeGa">Ultimo ISEE</label>
                                <NumericFormat
                                    className="form-control"
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    prefix="€ "
                                    decimalScale={2}
                                    fixedDecimalScale
                                    allowNegative={false}
                                    value={formData.ultimoIseeGa}
                                    onValueChange={({ value }) => {
                                        setFormData(prev => ({ ...prev, ultimoIseeGa: value }));
                                    }}
                                    required
                                />
                            </div>
                        </div>
                    </section>
                )}
                <div className="text-center mt-4">
                    <button
                        type="submit"
                        className="btn btn-success"
                        // onClick={handleAvanti}
                    >
                        SALVA
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleAnnulla} style={{ marginLeft: '10px' }}>Annulla</button>
                </div>
            </form>
        </div>
    );
};

export default InserimentoRichiestaMutuo;
