import { createAppKit } from 'cdn.jsdelivr.net'

// --- CONFIGURAZIONE REOWN ---
const PROJECT_ID = '42e5e216a501f010edd0dcbf77e8bbd5';

// --- VARIABILI DI STATO ---
let config = null;
let modal = null;

/**
 * Caricamento dati dal file usdt.json
 */
async function loadConfiguration() {
    try {
        const response = await fetch('./usdt.json');
        config = await response.json();
        initializeUI();
        initializeWalletConnect();
    } catch (error) {
        console.error("Critical: Configuration load failed", error);
    }
}

/**
 * Inizializza l'interfaccia con i dati del JSON
 */
function initializeUI() {
    document.getElementById('tokenName').innerText = config.asset.name;
    document.getElementById('tokenLogo').src = config.asset.logoURI;
    document.getElementById('favicon').href = config.asset.logoURI;
    document.getElementById('balance').innerText = `0.00 ${config.asset.symbol}`;
    document.getElementById('explorerLink').href = `${config.network_config.explorer_url}/address/${config.asset.address}`;
}

/**
 * Configura il sistema di connessione Reown
 */
function initializeWalletConnect() {
    modal = createAppKit({
        networks: [{
            id: `eip155:${config.chainId}`,
            name: 'Ethereum Network',
            rpcUrl: config.network_config.rpc_url,
            currency: 'ETH'
        }],
        projectId: PROJECT_ID,
        features: { analytics: false, email: false, socials: false }
    });

    // Listener per il bottone di connessione
    document.getElementById('connectBtn').addEventListener('click', () => modal.open());

    // Monitoraggio cambio stato wallet
    modal.subscribeState(async (state) => {
        if (state.selectedNetworkId) {
            updateAccountData();
        }
    });
}

/**
 * Recupero dati blockchain in tempo reale
 */
async function updateAccountData() {
    try {
        const provider = new ethers.BrowserProvider(window.ethereum || modal.getWalletProvider());
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        // Aggiorna UI con indirizzo accorciato
        document.getElementById('walletAddress').innerText = `${address.substring(0,6)}...${address.substring(38)}`;
        document.getElementById('statusDot').classList.add('status-online');
        document.getElementById('connectBtn').innerText = "Wallet Integrated";

        // Interazione con lo Smart Contract
        const abi = ["function balanceOf(address) view returns (uint256)"];
        const contract = new ethers.Contract(config.asset.address, abi, provider);
        const balance = await contract.balanceOf(address);
        
        // Formattazione basata sui decimali nel JSON
        const formatted = ethers.formatUnits(balance, config.asset.decimals);
        document.getElementById('balance').innerText = `${parseFloat(formatted).toLocaleString('en-US', {minimumFractionDigits: 2})} ${config.asset.symbol}`;

    } catch (err) {
        console.error("Data synchronization error:", err);
    }
}

// Avvio applicazione
loadConfiguration();
