import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@6.6.2/dist/ethers.esm.min.js';

// Indirizzo contratto USDT su Sepolia (esempio reale)
const USDT_ADDRESS = '0x3e7d1eab13ad0104d2750b8863b489d65364e32d';

// ABI minima ERC20 per balanceOf e decimals
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// Riferimenti DOM
const balanceEl = document.getElementById('balance');
const walletAddressEl = document.getElementById('walletAddress');
const statusLightEl = document.getElementById('statusLight');
const tokenPriceEl = document.getElementById('tokenPrice');
const mainCardEl = document.getElementById('mainCard');

let provider;
let signer;
let tokenContract;

// Funzione per formattare indirizzo wallet (es. 0x1234...abcd)
function formatAddress(address) {
  return address.slice(0, 6) + '...' + address.slice(-4);
}

// Aggiorna UI saldo token
async function updateBalance(address) {
  try {
    const rawBalance = await tokenContract.balanceOf(address);
    const decimals = await tokenContract.decimals();
    const formatted = ethers.formatUnits(rawBalance, decimals);
    balanceEl.textContent = `${formatted} USDT`;
  } catch (error) {
    console.error('Errore nel recupero saldo:', error);
    balanceEl.textContent = 'Errore';
  }
}

// Aggiorna prezzo (qui fisso 1$ per USDT, ma puoi integrare API CoinGecko)
function updatePrice() {
  tokenPriceEl.textContent = '$1.00 USD';
}

// Gestione connessione WalletConnect (usiamo la finestra modale già definita)
window.openConnectModal = async () => {
  try {
    await modal.open();

    // Ottieni provider da WalletConnect
    provider = new ethers.BrowserProvider(modal.getProvider());

    // Prendi signer e indirizzo wallet
    signer = await provider.getSigner();
    const address = await signer.getAddress();

    // Imposta contratto token
    tokenContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

    // Aggiorna UI
    walletAddressEl.textContent = formatAddress(address);
    statusLightEl.style.backgroundColor = '#22c55e'; // verde connesso
    mainCardEl.classList.add('connected');

    // Mostra saldo token
    await updateBalance(address);

    // Aggiorna prezzo
    updatePrice();

    // Chiudi modale (se vuoi)
    await modal.close();
  } catch (err) {
    console.error('Connessione wallet fallita:', err);
    walletAddressEl.textContent = 'Connessione fallita';
    statusLightEl.style.backgroundColor = '#ef4444'; // rosso errore
    mainCardEl.classList.remove('connected');
  }
};
