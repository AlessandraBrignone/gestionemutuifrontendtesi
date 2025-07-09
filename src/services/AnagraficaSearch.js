import axios from '../api/axiosInstance';


export async function searchAnagrafica(
    { nome = '', cognome = '', codiceFiscale = '' },
    { onlyActive = false, activeIfEmpty = false } = {}
) {
    const payload = {
        nomeRicerca:          nome           ? `%${nome}%`           : null,
        cognomeRicerca:       cognome        ? `%${cognome}%`        : null,
        codiceFiscaleRicerca: codiceFiscale ? `%${codiceFiscale}%` : null,
    };

    const { data } = await axios.post('/anagrafica/ricerca', payload);
    let risultati = data.data || [];

    //STATO
    const noCriteria = !nome && !cognome && !codiceFiscale;

    if (onlyActive || (activeIfEmpty && noCriteria)) {
        risultati = risultati.filter(a => a.stato === 1);
    }

    return risultati;
}