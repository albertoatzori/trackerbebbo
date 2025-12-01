# Kanto Tracker

Benvenuto in **Kanto Tracker**, l'applicazione definitiva per gestire e tracciare la tua collezione di carte Pokémon!

Questa applicazione ti permette di tenere traccia delle carte che possiedi, vedere quali ti mancano e gestire i dettagli di ogni singola carta, il tutto con un'interfaccia moderna e intuitiva.

## 🚀 Funzionalità Principali

### 🎴 Collezione Carte
Visualizza l'intero set di carte in una griglia responsive. Le carte possedute sono chiaramente distinte da quelle mancanti. Puoi filtrare per rarità, tipo o cercare carte specifiche.

### 📝 Dettagli Carta
Cliccando su una carta, puoi accedere ai dettagli completi:
- **Stato**: Segna se la carta è "Posseduta" o "Mancante".
- **Quantità**: Tieni traccia di quante copie hai.
- **Metodo di Acquisizione**: Specifica come hai ottenuto la carta (Sbustata, Comprata, Scambiata, Regalata).
- **Prezzo**: Registra il prezzo di acquisto.
- **Foto Reali**: Carica foto delle tue carte fisiche per mostrarle nella tua collezione digitale.

### 🎰 Gambling (Giornaliero)
Metti alla prova la tua fortuna con la funzione "Gambling"! Una volta al giorno, puoi pescare una carta casuale dal set. Se non la possiedi, è un'ottima occasione per aggiungerla alla tua lista dei desideri!

### 📊 Statistiche
Tieni sotto controllo i tuoi progressi con la dashboard delle statistiche:
- Totale carte possedute vs mancanti.
- Percentuale di completamento del set.
- Valore totale della collezione (basato sui prezzi inseriti).

### 👥 Lista Utenti
Esplora le collezioni degli altri utenti! Puoi vedere i profili degli altri collezionisti e confrontare i vostri progressi.

### 🔍 Carte Mancanti
Una vista dedicata per vedere rapidamente tutte le carte che ti mancano per completare il set. Include una comoda funzione per copiare la lista delle carte mancanti.

## 🛠 Tecnologie Utilizzate

Il progetto è costruito con un moderno stack tecnologico:

- **[React](https://react.dev/)**: Libreria UI per costruire interfacce utente interattive.
- **[Vite](https://vitejs.dev/)**: Build tool veloce e leggero per lo sviluppo frontend.
- **[Tailwind CSS](https://tailwindcss.com/)**: Framework CSS utility-first per uno styling rapido e personalizzabile.
- **[Supabase](https://supabase.com/)**: Backend-as-a-Service per database (PostgreSQL), autenticazione e storage delle immagini.
- **[Framer Motion](https://www.framer.com/motion/)**: Libreria per animazioni fluide e accattivanti.
- **[Lucide React](https://lucide.dev/)**: Set di icone pulite e consistenti.

## 📦 Installazione e Setup

Per eseguire il progetto in locale, segui questi passaggi:

1.  **Clona il repository**:
    ```bash
    git clone <url-del-tuo-repo>
    cd tracker-bebbo
    ```

2.  **Installa le dipendenze**:
    ```bash
    npm install
    ```

3.  **Configura le variabili d'ambiente**:
    Crea un file `.env` nella root del progetto e aggiungi le tue chiavi Supabase:
    ```env
    VITE_SUPABASE_URL=la-tua-url-supabase
    VITE_SUPABASE_ANON_KEY=la-tua-chiave-anon-supabase
    ```

4.  **Avvia il server di sviluppo**:
    ```bash
    npm run dev
    ```

5.  **Apri il browser**:
    L'applicazione sarà disponibile all'indirizzo `http://localhost:5173`.

## 🤝 Contribuire

Sentiti libero di aprire issue o pull request per migliorare il progetto!

---

Sviluppato con ❤️ per i collezionisti di carte Pokémon.
