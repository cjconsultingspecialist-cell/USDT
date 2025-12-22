let provider;
let signer;
let account;
let usdt;

// --- CONFIGURAZIONE ---
const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const USDT_DECIMALS = 6;
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; 
const SEPOLIA_CHAIN_ID_DEC = 11155111;

const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)"
];

/**
 * 1. FUNZIONE DEEP LINK (Per saltare da Safari/Chrome all'App Wallet)
 */
function openInWallet() {
    const dappUrl = window.location.href.replace("https://", "");
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // Se siamo già in un browser wallet, non serve il deep link
    if (window.ethereum) {
        alert("Sei già all'interno del Wallet. Clicca su 'Connetti Wallet'.");
        return;
    }

    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        // iOS: Apre MetaMask o Trust Wallet (tramite link universale)
        window.location.href = `metamask.app.link{dappUrl}`;
    } else if (/android/i.test(userAgent)) {
        // Android: Usa il protocollo Intent
        window.location.href = `intent://${dappUrl}#Intent;scheme=https;package=com.metamask.android;end`;
    } else {
        alert("Per favore, apri questo sito dal browser interno del tuo Wallet (MetaMask, Trust, Coinbase).");
    }
}

/**
 * 2. CONNESSIONE AL WALLET
 */
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        // Se l'utente clicca ma non è nel browser del wallet
        openInWallet();
        return;
    }

    try {
        // Richiesta di connessione pulita
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (!accounts || accounts.length === 0) {
            alert("Nessun account trovato. Assicurati che il Wallet sia sbloccato.");
            return;
        }

        account = accounts[0];
        provider = new ethers.BrowserProvider(window.ethereum);

        // Controllo Rete Sepolia
        const network = await provider.getNetwork();
        if (Number(network.chainId) !== SEPOLIA_CHAIN_ID_DEC) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
                });
                // Ricarica per applicare il cambio rete
                window.location.reload();
            } catch (switchError) {
                // Se la rete Sepolia non è presente nel wallet, la aggiungiamo noi
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: SEPOLIA_CHAIN_ID_HEX,
                            chainName: 'Sepolia Test Network',
                            rpcUrls: ['rpc.ankr.com'],
                            nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
                            blockExplorerUrls: ['https://sepolia.etherscan.io']
                        }]
                    });
                }
            }
        }

        signer = await provider.getSigner();
        usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);

        // Aggiorna UI
        document.getElementById("wallet").innerText = account.substring(0, 6) + "..." + account.substring(account.length - 4);
        document.getElementById("status").innerText = "● Connesso (Sepolia)";
        document.getElementById("status").style.color = "#26a17b";
        document.getElementById("btnMobileOpen").style.display = "none";

        updateUI();

    } catch (error) {
        console.error("Errore di connessione:", error);
        if (error.code === 4001) {
            alert("Hai rifiutato la connessione. Per favore, accetta la richiesta nel wallet.");
        } else {
            alert("Errore: richiesta di connessione già pendente o rifiutata.");
        }
    }
}

/**
 * 3. AGGIUNGI LOGO (La funzione per il token didattico)
 */
async function addTokenToWallet() {
    if (!window.ethereum) return;
    try {
        await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: USDT_ADDRESS,
                    symbol: 'USDT',
                    decimals: USDT_DECIMALS,
                    image: 'cryptologos.cc',
                },
            },
        });
    } catch (error) {
        console.error("Errore aggiunta logo:", error);
    }
}

/**
 * 4. AGGIORNAMENTO SALDO
 */
async function updateUI() {
    if (!usdt || !account) return;
    try {
        const rawBalance = await usdt.balanceOf(account);
        const balance = ethers.formatUnits(rawBalance, USDT_DECIMALS);
        document.getElementById("balance").innerText = parseFloat(balance).toFixed(2) + " USDT";
        document.getElementById("usdValue").innerText = "$" + parseFloat(balance).toFixed(2) + " USD";
    } catch (e) {
        console.warn("Errore lettura saldo:", e);
    }
}

/**
 * 5. INVIO TOKEN
 */
async function sendUSDT() {
    const to = document.getElementById("to").value;
    const amount = document.getElementById("amount").value;

    if (!ethers.isAddress(to)) { alert("Indirizzo non valido"); return; }
    if (!amount || amount <= 0) { alert("Inserisci una quantità valida"); return; }

    try {
        const value = ethers.parseUnits(amount, USDT_DECIMALS);
        const tx = await usdt.transfer(to, value);
        alert("Transazione inviata! Attendi conferma...");
        await tx.wait();
        alert("Inviato con successo!");
        updateUI();
    } catch (error) {
        alert("Errore durante l'invio. Controlla il gas (ETH Sepolia).");
    }
}

// Listeners per cambi di stato nel Wallet
if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => window.location.reload());
    window.ethereum.on('chainChanged', () => window.location.reload());
}
