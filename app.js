import { createAppKit } from 'cdn.jsdelivr.net'

const PROJECT_ID = '42e5e216a501f010edd0dcbf77e8bbd5';
let config = null;
let modal = null;

// Funzione di utilità per gestire i percorsi in ambiente GitHub Pages
function getAbsolutePath(relativePath) {
    // Aggiunge /USDT/ davanti al percorso
    return `/USDT/${relativePath.replace(/^\.?\//, '')}`;
}

/**
 * Registrazione del Service Worker (PWA)
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Usa il percorso assoluto per registrare il service worker
        navigator.serviceWorker.register(getAbsolutePath('service-worker.js'))
            .then(reg => console.log('Service Worker Registered with scope:', reg.scope))
            .catch(err => console.error('SW registration failed:', err));
    });
}


/**
 * Caricamento dati dal file usdt.json
 */
async function loadConfiguration() {
    try {
        // Usa il percorso assoluto per fetchare il JSON
        const response = await fetch(getAbsolutePath('usdt.json'));
        if (!response.ok) throw new Error("JSON configuration not found.");
        config = await response.json();
        initializeUI();
        initializeWalletConnect();
    } catch (error) {
        console.error("Critical: Configuration load failed", error);
        document.getElementById('tokenName').innerText = "Error Loading Config";
    }
}

function initializeUI() {
    document.getElementById('tokenName').innerText = config.asset.name;
    document.getElementById('tokenLogo').src = config.asset.logoURI;
    document.getElementById('favicon').href = config.asset.logoURI;
    document.getElementById('balance').innerText = `0.00 ${config.asset.symbol}`;
    document.getElementById('explorerLink').href = `${config.network_config.explorer_url}/address/${config.asset.address}`;
    document.title = `${config.asset.symbol} | Institutional Wallet`;
}

function initializeWalletConnect() {
    modal = createAppKit({
        networks: [{
            id: `eip155:${config.chainId}`,
            name: config.network_config.network_name || 'Ethereum Network',
            rpcUrl: config.network_config.rpc_url,
            currency: config.network_config.currency || 'ETH'
        }],
        projectId: PROJECT_ID,
        features: { analytics: false, email: false, socials: false }
    });

    document.getElementById('connectBtn').addEventListener('click', () => modal.open());
    modal.subscribeState(async (state) => {
        if (state.selectedNetworkId) {
            updateAccountData();
        }
    });
}

async function updateAccountData() {
    if (!config) return;

    try {
        const provider = new ethers.BrowserProvider(window.ethereum || modal.getWalletProvider());
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        document.getElementById('walletAddress').innerText = `${address.substring(0,6)}...${address.substring(38)}`;
        document.getElementById('statusDot').classList.add('status-online');
        document.getElementById('connectBtn').innerText = "Wallet Integrated";

        const abi = ["function balanceOf(address) view returns (uint256)"];
        const contract = new ethers.Contract(config.asset.address, abi, provider);
        const balance = await contract.balanceOf(address);
        
        const formatted = ethers.formatUnits(balance, config.asset.decimals);
        document.getElementById('balance').innerText = `${parseFloat(formatted).toLocaleString('en-US', {minimumFractionDigits: 2})} ${config.asset.symbol}`;

    } catch (err) {
        console.error("Data synchronization error:", err);
    }
}

// Avvio applicazione
loadConfiguration();
