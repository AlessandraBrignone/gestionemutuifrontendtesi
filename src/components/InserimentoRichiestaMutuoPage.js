import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../api/axiosInstance';
import Swal from 'sweetalert2';

import AnagraficaRichiedente from './AnagraficaRichiedente';
import InserimentoRichiestaMutuo from './InserimentoRichiestaMutuo';
import CaricaDocumenti from './CaricaDocumenti';
import GeneraPiano from './GeneraPiano';

export default function InserimentoRichiestaMutuoPage() {

      const location      = useLocation();
      const readonly      = location.state?.readonly || false;
      const richiestaId   = new URLSearchParams(location.search).get('id');

      const [tabAttivo, setTabAttivo] = useState('anagraficarichiedente');
      const [anagrafiche, setAnagrafiche] = useState([]);

      const [formData, setFormData] = useState({
            idIntestatario: '', idCointestatario: '', idGarante: '',
            importo: '', importoRata: '',
            durata: '', cadenzaRata: '',dataRiscossione: '', tipoMutuo: '', interesseAnnuo: '',
            pianoAmmortamento: '', spreadMutuo: '', statoRichiesta: '',
            durataRichiesta: '', dataRiscossione: '', valoreImmobile: '',
            redditoFamiliare: '', posizioneLavorativaIn: '', posizioneLavorativaCo: '',
            posizioneLavorativaGa: '', componentiNucleoFamiliare: '',
            valoreBeniImmobili: '', valorePartecipazione: '', ultimoIsee: ''
      });

      const [richiesta, setRichiesta] = useState(null);
      const [documentiCaricati, setDocumentiCaricati] = useState([]);

      const handleAnagraficaRichiedenteCompletati = (datiScelti) => {
            setAnagrafiche(datiScelti);
            setTabAttivo('mutuo');
      };

      const handleRichiestaMutuoCompletati = async (dati) => {
            let idIntestatario = null, idCointestatario = null, idGarante = null;
            anagrafiche.forEach((a) => {
                switch (a.tipo?.toUpperCase()) {
                    case 'INTESTATARIO':   idIntestatario         = a.id; break;
                    case 'COINTESTATARIO': idCointestatario = a.id; break;
                    case 'GARANTE':        idGarante        = a.id; break;
                }
            });

            const payload = { ...dati, idIntestatario, idCointestatario, idGarante, statoRichiesta: 'BOZZA' };

            try {
                const { data } = await axios.post('/richiesta_mutuo/salva', payload);
                  setRichiesta(data);
                  setTabAttivo('caricadocumenti');
            } catch (err) {
                Swal.fire('Errore', err.response?.data?.message ?? 'Salvataggio non riuscito', 'error');
            }
      };

      const handleCaricaDocuemntiCompletati = (doc) => {
            setDocumentiCaricati((prev) => [...prev, doc]);
            Swal.fire('Successo', 'Documento caricato!', 'success');
      };

      const caricaAnagraficaCompleta = async (id, tipo) => {
            try {
                const { data } = await axios.get(`/anagrafica/${id}`);
                return { ...data, tipo };
            } catch (e) {
                console.error(`Errore nel recupero anagrafica ${id}`, e);
                return null;
            }
      };

    useEffect(() => {
        if (!richiestaId) return;

        axios.get(`/richiesta_mutuo/dettagli/${richiestaId}`)
            .then(async (res) => {
            const dati = res.data;
            setRichiesta(dati);
            setFormData((prev) => ({ ...prev, ...dati }));

            const promises = [];
            if (dati.idIntestatario)
                promises.push(caricaAnagraficaCompleta(dati.idIntestatario, 'Intestatario'));
            if (dati.idCointestatario)
                promises.push(caricaAnagraficaCompleta(dati.idCointestatario, 'Cointestatario'));
            if (dati.idGarante)
                promises.push(caricaAnagraficaCompleta(dati.idGarante, 'Garante'));

            const complete = (await Promise.all(promises)).filter(Boolean);
            setAnagrafiche(complete);
            setTabAttivo('mutuo');
        })
        .catch(() => Swal.fire('Errore', 'Impossibile caricare la richiesta', 'error'));
    }, [richiestaId]);


return (
    <div className="container mt-4">
        <h2 className="text-center mb-4">RICHIESTA MUTUO</h2>

        {/* NAV TABS */}
        <ul className="nav nav-tabs">
            <li className="nav-item">
                <button
                    className={`nav-link ${tabAttivo === 'anagraficarichiedente' ? 'active' : ''}`}
                    onClick={() => setTabAttivo('anagraficarichiedente')}
                >
                Anagrafica richiedente
                </button>
            </li>
            <li className="nav-item">
                <button
                    className={`nav-link ${tabAttivo === 'mutuo' ? 'active' : ''}`}
                    onClick={() => setTabAttivo('mutuo')}
                    disabled={(!anagrafiche.length && !richiesta)}
                >
                Richiesta mutuo
                </button>
            </li>
            <li className="nav-item">
                <button
                    className={`nav-link ${tabAttivo === 'caricadocumenti' ? 'active' : ''}`}
                    onClick={() => setTabAttivo('caricadocumenti')}
                    disabled={!richiesta}
                >
                Carica documenti
                </button>
            </li>
            <li className="nav-item">
                <button
                    className={`nav-link ${tabAttivo === 'generapiano' ? 'active' : ''}`}
                    onClick={() => setTabAttivo('generapiano')}
                    disabled={!richiesta || documentiCaricati.length === 0}
                >
                Genera piano
                </button>
            </li>
        </ul>

        {/* CONTENUTO – un solo <fieldset disabled> per bloccare tutto */}
        <div className="border border-top-0 p-4 bg-light">
            <fieldset disabled={readonly} style={{ border: 0, padding: 0, margin: 0 }}>
                {tabAttivo === 'anagraficarichiedente' && (
                    <AnagraficaRichiedente
                        onCompletamento={handleAnagraficaRichiedenteCompletati}
                        selezionati={anagrafiche}
                        setSelezionati={setAnagrafiche}
                    />
                )}
                {tabAttivo === 'mutuo' && (
                    <InserimentoRichiestaMutuo
                        onCompletamento={handleRichiestaMutuoCompletati}
                        anagrafiche={anagrafiche}
                        formData={formData}
                        setFormData={setFormData}
                    />
                )}
                {tabAttivo === 'caricadocumenti' && (
                    <CaricaDocumenti
                        onCompletamento={handleCaricaDocuemntiCompletati}
                        richiesta={richiesta}
                        formData={formData}
                        setFormData={setFormData}
                    />
                )}
                {tabAttivo === 'generapiano' && richiesta && (
                    <GeneraPiano anagrafiche={anagrafiche} richiesta={richiesta} />
                )}
            </fieldset>
        </div>
    </div>
  );
}
