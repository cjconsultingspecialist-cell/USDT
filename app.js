import { createAppKit } from 'cdn.jsdelivr.net'

const PROJECT_ID = '42e5e216a501f010edd0dcbf77e8bbd5';
let config = null;
let modal = null;
let currentSigner = null;

// Gestione percorsi per GitHub Pages (repo /USDT/)
function getAbsolutePath(relativePath) { return `/USDT/${relativePath.replace(/^\.?\//, '')}`; }

// ABI minima per le funzioni ERC20 (balanceOf, transfer, symbol)
const MIN_ABI = ["function balanceOf(address) view returns (uint256)", "function transfer(address to, uint256 amount) returns (bool)", "function symbol() view returns (string)"];


/** Registrazione del Service Worker (PWA) */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(getAbsolutePath('service-worker.js'));
    });
}

/** Caricamento dati dal file usdt.json */
async function loadConfiguration() {
    try {
        const response = await fetch(getAbsolutePath('usdt.json'));
        config = await response.json();
        initializeUI();
        initializeWalletConnect();
    } catch (error) {
        console.error("Configuration load failed", error);
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
        networks: [{ id: `eip155:${config.chainId}`, name: 'Ethereum Network', rpcUrl: config.network_config.rpc_url, currency: 'ETH' }],
        projectId: PROJECT_ID,
        features: { analytics: false, email: false, socials: false }
    });

    document.getElementById('connectBtn').addEventListener('click', () => modal.open());
    document.getElementById('sendBtn').addEventListener('click', () => {
        const recipient = document.getElementById('recipientAddress').value;
        const amount = document.getElementById('sendAmount').value;
        if (recipient && amount) sendTokens(recipient, amount);
        else alert("Inserisci indirizzo e quantità.");
    });

    modal.subscribeState(async (state) => {
        if (state.selectedNetworkId && state.isConnected) {
            updateAccountData();
        } else if (!state.isConnected) {
            document.getElementById('sendArea').style.display = 'none';
            document.getElementById('sendBtn').style.display = 'none';
            document.getElementById('connectBtn').innerText = 'Connect Wallet';
            document.getElementById('statusDot').classList.remove('status-online');
            document.getElementById('walletAddress').innerText = 'Disconnected';
        }
    });
}

async function updateAccountData() {
    if (!config) return;
    try {
        const provider = new ethers.BrowserProvider(window.ethereum || modal.getWalletProvider());
        currentSigner = await provider.getSigner();
        const address = await currentSigner.getAddress();

        document.getElementById('walletAddress').innerText = `${address.substring(0,6)}...${address.substring(38)}`;
        document.getElementById('statusDot').classList.add('status-online');
        document.getElementById('connectBtn').innerText = "Wallet Integrated";
        
        document.getElementById('sendArea').style.display = 'block';
        document.getElementById('sendBtn').style.display = 'block';


        const contract = new ethers.Contract(config.asset.address, MIN_ABI, provider);
        const balance = await contract.balanceOf(address);
        const formatted = ethers.formatUnits(balance, config.asset.decimals);
        document.getElementById('balance').innerText = `${parseFloat(formatted).toLocaleString('en-US', {minimumFractionDigits: 2})} ${config.asset.symbol}`;

    } catch (err) {
        console.error("Data synchronization error:", err);
    }
}

async function sendTokens(recipient, amount) {
    if (!currentSigner) return;
    try {
        const contractWithSigner = new ethers.Contract(config.asset.address, MIN_ABI, currentSigner);
        const parsedAmount = ethers.parseUnits(amount, config.asset.decimals);
        const tx = await contractWithSigner.transfer(recipient, parsedAmount);
        alert("Transaction sent: " + tx.hash);
        await tx.wait(); // Attesa conferma
        alert("Transaction confirmed!");
        updateAccountData(); // Aggiorna UI
    } catch (error) {
        console.error("Transaction error:", error);
        alert("Transaction failed: " + (error.reason || error.message));
    }
}

loadConfiguration();
