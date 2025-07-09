import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import axios from '../api/axiosInstance';

Chart.register(...registerables);

// Colori di riempimento per ogni stato
const colorMap = {
  Bozza: 'rgba(108, 117, 125, 0.8)',     // Grigio
  Inviata: 'rgba(0, 123, 255, 0.8)',     // Blu
  Validazione: 'rgba(255, 193, 7, 0.8)', // Giallo
  Validato: 'rgba(40, 167, 69, 0.8)',    // Verde
  Rifiutata: 'rgba(253, 126, 20, 0.8)',   // Arancione
  Eliminata: 'rgba(220, 53, 69, 0.8)',   // Rosso
};

// Bordi full-opacity
const borderColorMap = Object.fromEntries(
  Object.entries(colorMap).map(([k, v]) => [k, v.replace('0.8', '1')])
);

// Etichette lato UI
const statuses = ['Bozza', 'Inviata', 'Validazione', 'Validato', 'Rifiutata', 'Eliminata'];

// Mapping fra etichetta UI e valore backend
const apiStatusMap = {
  Bozza: 'BOZZA',
  Inviata: 'INVIATA',
  Validazione: 'VALIDAZIONE',
  Validato: 'VALIDATO',
  Rifiutata: 'RIFIUTATA',
  Eliminata: 'ELIMINATA',
};

const Home = () => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  //Crea il grafico la prima volta oppure aggiorna i dati se esiste già
  const buildOrUpdateChart = (counts) => {
    const ctx = chartRef.current.getContext('2d');

    if (chartInstanceRef.current) {
      chartInstanceRef.current.data.datasets[0].data = statuses.map((s) => counts[s]);
      chartInstanceRef.current.update();
      return;
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: statuses,
        datasets: [
          {
            label: '# richieste',
            data: statuses.map((s) => counts[s]),
            backgroundColor: statuses.map((s) => colorMap[s]),
            borderColor: statuses.map((s) => borderColorMap[s]),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0,
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: ({ raw }) => ` ${raw} richiesta${raw !== 1 ? 'e' : ''}`,
            },
          },
          legend: {
            display: false,
          },
        },
      },
    });
  };

  /**
   * Recupera i dati dal backend e popola/aggiorna il grafico
   */
  const fetchData = async () => {
    const baseCounts = Object.fromEntries(statuses.map((s) => [s, 0]));

    try {
      const { data } = await axios.post('/richiesta_mutuo/ricerca', {});
      const richieste = data?.data ?? [];

      // Calcola i conteggi per ogni stato
      const counts = { ...baseCounts };
      statuses.forEach((uiLabel) => {
        const apiLabel = apiStatusMap[uiLabel];
        counts[uiLabel] = richieste.filter((r) => r.statoRichiesta === apiLabel).length;
      });

      buildOrUpdateChart(counts);
    } catch (err) {
      console.error('Errore fetch richiesta_mutuo', err);
      // Mostriamo comunque il grafico con conteggi a zero
      buildOrUpdateChart(baseCounts);
    }
  };

  useEffect(() => {
    fetchData(); // prima chiamata immediata
    const id = setInterval(fetchData, 30_000); // refresh ogni 30 s

    return () => {
      clearInterval(id);
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    };
  }, []);

  return (
    <div
      className="chart-container"
      style={{ position: 'relative', width: '100%', maxWidth: '800px', height: '400px', margin: '0 auto' }}
    >
      <canvas ref={chartRef} />
    </div>
  );
};

export default Home;