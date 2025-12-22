/**
 * app.js - Versione Professionale Universale 2025
 * Gestisce: Deep Linking, Multi-Wallet, Switch Rete Sepolia e Token EDU
 */

let provider;
let signer;
let account;
let usdt;

// --- CONFIGURAZIONE ---
const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const USDT_DECIMALS = 6;
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // 11155111 in hex
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

    // Se siamo già in un browser wallet, window.ethereum esiste
    if (window.ethereum) {
        alert("Sei già all'interno del Wallet. Clicca su 'Connetti Wallet'.");
        return;
    }

    // Logica per iOS (iPhone/iPad)
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        window.location.href = `metamask.app.link{dappUrl}`;
    } 
    // Logica per Android
    else if (/android/i.test(userAgent)) {
        window.location.href = `intent://${dappUrl}#Intent;scheme=https;package=com.metamask.android;end`;
    } 
    // Desktop o altri
    else {
        alert("Per favore, apri questa pagina dal browser interno del tuo Wallet mobile (MetaMask, Trust, Coinbase).");
    }
}

/**
 * 2. CONNESSIONE AL WALLET (Logica Anti-Blocco)
 */
async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    openInWallet();
    return;
  }

  try {
    // Richiesta esplicita degli account (forza il popup)
    const accs = await window.ethereum.request({ 
      method: "eth_requestAccounts" 
    });

    if (!accs || accs.length === 0) {
      throw new Error("Nessun account restituito");
    }

    // Inizializzazione Ethers v6
    provider = new ethers.BrowserProvider(window.ethereum);
    account = accs[0];

    // Controllo Rete Sepolia e Switch Automatico
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== SEPOLIA_CHAIN_ID_DEC) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }]
        });
        window.location.reload(); // Ricarica dopo il cambio rete
        return;
      } catch (switchError) {
        // Se la rete Sepolia non è presente, la aggiungiamo
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

    // Aggiornamento Interfaccia Grafica
    document.getElementById("wallet").innerText = account.substring(0, 6) + "..." + account.substring(account.length - 4);
    document.getElementById("status").innerText = "● Connesso";
    document.getElementById("status").style.color = "#26a17b";
    
    const mobileBtn = document.getElementById("btnMobileOpen");
    if (mobileBtn) mobileBtn.style.display = "none";

    updateUI();

  } catch (error) {
    console.error("Errore connessione:", error);
    if (error.code === 4001) {
      alert("Richiesta rifiutata. Per favore, accetta la connessione nel tuo Wallet.");
    } else if (error.code === -32002) {
      alert("C'è già una richiesta pendente nel tuo Wallet. Aprilo e accetta.");
    } else {
      alert("Errore di connessione. Assicurati di essere su Rete Sepolia.");
    }
  }
}

/**
 * 3. AGGIUNGI LOGO (Funzione per il Token Didattico)
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
    alert("Errore nell'invio. Assicurati di avere ETH Sepolia per il gas.");
  }
}

/**
 * 6. GESTIONE EVENTI REAL-TIME
 */
if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => window.location.reload());
    window.ethereum.on('chainChanged', () => window.location.reload());
    
    // Tenta riconnessione automatica al caricamento se già autorizzato
    window.addEventListener('load', async () => {
        const accs = await window.ethereum.request({ method: 'eth_accounts' });
        if (accs.length > 0) {
            connectWallet();
        }
    });
}
