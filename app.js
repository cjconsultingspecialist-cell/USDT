let provider;
let signer;
let account;
let usdt;

// --- CONFIGURAZIONE ---
const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const USDT_DECIMALS = 6;
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // 11155111 in hex
const SEPOLIA_CHAIN_ID_DEC = 11155111; 

const USDT_ABI_URL = "usdt.json"; // Carica l'ABI dal file locale usdt.json

// --- Funzioni UI di base (senza snackbar) ---
function updateStatusUI(statusText, color, isConnected) {
    document.getElementById("status").innerText = `● ${statusText}`;
    document.getElementById("status").style.color = color;
    const mobileBtn = document.getElementById("btnMobileOpen");
    if (mobileBtn && isConnected) mobileBtn.style.display = "none";
}

/**
 * 1. FUNZIONE DEEP LINK
 */
function openInWallet() {
    const dappUrl = window.location.href.replace("https://", "");
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (window.ethereum) {
        alert("Sei già all'interno del Wallet. Clicca su 'Connetti Wallet'."); return;
    }
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        window.location.href = `metamask.app.link{dappUrl}`;
    } else if (/android/i.test(userAgent)) {
        window.location.href = `intent://${dappUrl}#Intent;scheme=https;package=com.metamask.android;end`;
    } else {
        alert("Apri questa pagina dal browser interno del tuo Wallet mobile.");
    }
}

/**
 * 2. CONNESSIONE AL WALLET (Logica Anti-Blocco)
 */
async function connectWallet() {
  if (typeof window.ethereum === 'undefined') { openInWallet(); return; }

  try {
    const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accs || accs.length === 0) throw new Error("Nessun account restituito");
    account = accs[0]; // Prendi solo il primo account

    provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    
    if (Number(network.chainId) !== SEPOLIA_CHAIN_ID_DEC) {
      try {
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }] });
        window.location.reload(); return;
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID_HEX, chainName: 'Sepolia Test Network', rpcUrls: ['rpc.ankr.com'], nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 }, blockExplorerUrls: ['https://sepolia.etherscan.io']}]});
        } else {
            alert("Per favore cambia rete manualmente nel tuo wallet."); return;
        }
      }
    }

    // Caricamento ABI prima di istanziare il contratto
    const abiResponse = await fetch(USDT_ABI_URL);
    const usdtAbi = await abiResponse.json();

    signer = await provider.getSigner();
    usdt = new ethers.Contract(USDT_ADDRESS, usdtAbi, signer);

    updateStatusUI(`Connesso a Sepolia: ${account.slice(0, 6) + "..." + account.slice(-4)}`, "#26a17b", true);
    document.getElementById("wallet").innerText = account.slice(0, 6) + "..." + account.slice(-4);
    updateUI();

  } catch (error) {
    console.error("Errore Dettagliato:", error);
    updateStatusUI("Errore: Connessione Rifiutata o Fallita", "#e74c3c", false);
    if (error.code === 4001) alert("Hai rifiutato la connessione.");
    else if (error.code === -32002) alert("Richiesta pendente. Controlla il Wallet.");
    else alert("Errore di connessione. Assicurati di essere su Rete Sepolia.");
  }
}

/**
 * 3. AGGIUNGI LOGO
 */
async function addTokenToWallet() {
    if (!window.ethereum) return;
    try {
        await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: { type: 'ERC20', options: { address: USDT_ADDRESS, symbol: 'USDT', decimals: USDT_DECIMALS, image: 'cryptologos.cc' } }
        });
    } catch (error) { console.error("Errore aggiunta logo:", error); }
}

/**
 * 4. AGGIORNAMENTO SALDO E UI
 */
async function updateUI() {
  if (!usdt || !account) return;
  try {
    const rawBalance = await usdt.balanceOf(account);
    const balance = ethers.formatUnits(rawBalance, USDT_DECIMALS);
    document.getElementById("balance").innerText = parseFloat(balance).toFixed(2) + " USDT";
    // Il valore USD apparirà quando la pool sarà indicizzata
    // document.getElementById("usdValue").innerText = "$" + parseFloat(balance).toFixed(2) + " USD";
  } catch (e) { console.warn("Errore lettura saldo:", e); }
}

/**
 * 5. INVIO TOKEN
 */
async function sendUSDT() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;
  if (!ethers.isAddress(to)) { alert("Indirizzo non valido"); return; }
  if (!amount || parseFloat(amount) <= 0) { alert("Quantità non valida"); return; }

  try {
    const value = ethers.parseUnits(amount, USDT_DECIMALS);
    const tx = await usdt.transfer(to, value);
    alert("Transazione inviata! Attendi conferma...");
    await tx.wait();
    alert("Inviato con successo!");
    updateUI();
  } catch (error) { alert("Errore nell'invio. Assicurati di avere ETH Sepolia per il gas."); }
}

/**
 * 6. GESTIONE EVENTI REAL-TIME E INIZIALIZZAZIONE
 */
if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => window.location.reload());
    window.ethereum.on('chainChanged', () => window.location.reload());
    
    window.addEventListener('load', async () => {
        // Nasconde il pulsante mobile se siamo già nel wallet
        if (window.ethereum) {
            const mobileBtn = document.getElementById("btnMobileOpen");
            if (mobileBtn) mobileBtn.style.display = "none";
            // Tenta la riconnessione automatica
            const accs = await window.ethereum.request({ method: 'eth_accounts' });
            if (accs.length > 0) connectWallet();
        }
    });
}
