/**
 * app.js - Logic for Security Wallet Pro
 * Integrates Ethers.js v6 and Reown AppKit for professional-grade interaction.
 */

// Configurazione parametri tecnici
const PROJECT_ID = '42e5e216a501f010edd0dcbf77e8bbd5';
const CONTRACT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const USDT_DECIMALS = 6; // Standard per Tether

// ABI minima per le funzioni ERC20 necessarie
const MIN_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
];

// Variabili globali per l'interazione
let provider;
let signer;
let contract;

/**
 * Registrazione del Service Worker (PWA)
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker Registrato correttamente', reg.scope))
            .catch(err => console.error('Errore registrazione SW:', err));
    });
}

/**
 * Funzione per aggiornare il saldo e i dati del wallet sulla UI
 */
async function updateUIState(address, currentProvider) {
    try {
        const balanceElement = document.getElementById('balance');
        const walletAddressElement = document.getElementById('walletAddress');
        const statusDot = document.getElementById('statusDot');

        // Aggiorna l'indirizzo mostrato
        walletAddressElement.innerText = `${address.substring(0, 6)}...${address.substring(38)}`;
        if (statusDot) statusDot.classList.add('status-online');

        // Crea istanza contratto per leggere il saldo
        const contractReader = new ethers.Contract(CONTRACT_ADDRESS, MIN_ABI, currentProvider);
        const rawBalance = await contractReader.balanceOf(address);

        // Formattazione professionale del saldo
        const formattedBalance = ethers.formatUnits(rawBalance, USDT_DECIMALS);
        balanceElement.innerText = `${parseFloat(formattedBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT`;

    } catch (error) {
        console.error("Errore durante l'aggiornamento della UI:", error);
    }
}

/**
 * Logica per l'invio di Token (Didattica: mostra come avviene una transazione reale)
 */
async function sendTokens(recipient, amount) {
    if (!signer) {
        alert("Per favore, connetti prima il wallet.");
        return;
    }

    try {
        const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, MIN_ABI, signer);
        const parsedAmount = ethers.parseUnits(amount, USDT_DECIMALS);

        console.log(`Inviando ${amount} USDT a ${recipient}...`);
        const tx = await contractWithSigner.transfer(recipient, parsedAmount);
        
        alert("Transazione inviata! In attesa di conferma...");
        await tx.wait(); // Attesa conferma su Sepolia
        alert("Transazione confermata con successo!");
        
        // Aggiorna il saldo dopo l'invio
        const address = await signer.getAddress();
        updateUIState(address, provider);

    } catch (error) {
        console.error("Errore durante la transazione:", error);
        alert("Errore transazione: " + (error.reason || "Operazione annullata"));
    }
}

// Esporta le funzioni principali se necessario per index.html
window.sendTokens = sendTokens;
window.updateUIState = updateUIState;
