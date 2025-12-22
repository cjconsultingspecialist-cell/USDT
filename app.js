/**
 * app.js - Versione Ultima e Corretta 2025
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

function updateStatusUI(statusText, color) {
    const statusEl = document.getElementById("status");
    if (statusEl) {
        statusEl.innerText = `● ${statusText}`;
        statusEl.style.color = color;
    }
}

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

async function connectWallet() {
  if (typeof window.ethereum === 'undefined') { openInWallet(); return; }

  try {
    const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accs || accs.length === 0) throw new Error("Nessun account restituito.");
    
    provider = new ethers.BrowserProvider(window.ethereum);
    account = accs[0]; // Assicurati di prendere solo il primo account

    // FORZA LO SWITCH DELLA RETE
    await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }]
    });
    // Se lo switch ha successo, la pagina si ricaricherà automaticamente grazie al listener in basso

  } catch (error) {
    console.error("Errore Dettagliato:", error);
    updateStatusUI("Disconnesso", "#e74c3c");
    if (error.code === 4001) alert("Hai rifiutato la connessione.");
    else if (error.code === 4902) alert("Rete Sepolia non trovata. Aggiungila manualmente."); // Codice per rete non trovata
    else if (error.code === -32002) alert("Richiesta pendente. Controlla il Wallet.");
    else alert("Errore di connessione. Assicurati di essere su Rete Sepolia.");
  }
}

// Questa funzione viene chiamata dopo che la pagina si ricarica in automatico con la rete giusta
async function initDApp() {
    if (typeof window.ethereum === 'undefined') return;

    provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    if (Number(network.chainId) === SEPOLIA_CHAIN_ID_DEC) {
        // Se la rete è corretta, procedi a inizializzare il contratto e l'UI
        const accs = await provider.send("eth_accounts", []);
        if (accs.length > 0) {
            account = accs[0];
            signer = await provider.getSigner();
            usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);

            updateStatusUI(`Connesso a Sepolia: ${account.slice(0, 6) + "..." + account.slice(-4)}`, "#26a17b");
            document.getElementById("wallet").innerText = account.slice(0, 6) + "..." + account.slice(-4);
            const mobileBtn = document.getElementById("btnMobileOpen");
            if (mobileBtn) mobileBtn.style.display = "none";
            updateUI();
        }
    } else {
        updateStatusUI("Rete non corretta", "#e74c3c");
    }
}

async function addTokenToWallet() {
    if (!window.ethereum) return;
    try {
        await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: { type: 'ERC20', options: { address: USDT_ADDRESS, symbol: 'USDT', decimals: USDT_DECIMALS, image: 'cryptologos.cc' } }
        });
    } catch (error) { console.error("Errore aggiunta logo:", error); }
}

async function updateUI() {
  if (!usdt || !account) return;
  try {
    const rawBalance = await usdt.balanceOf(account);
    const balance = Number(ethers.formatUnits(rawBalance, USDT_DECIMALS));
    document.getElementById("balance").innerText = balance.toFixed(2);
    document.getElementById("usdValue").innerText = "$" + balance.toFixed(2) + " USD";
  } catch (e) { console.warn("Errore lettura saldo:", e); }
}

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

window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("connectButton").addEventListener("click", connectWallet);
    document.getElementById("sendButton").addEventListener("click", sendUSDT);
    document.getElementById("addTokenButton").addEventListener("click", addTokenToWallet);
    document.getElementById("btnMobileOpen").addEventListener("click", openInWallet);
    
    // Inizializza la DApp al caricamento
    initDApp();
});

if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => window.location.reload());
    window.ethereum.on('chainChanged', () => window.location.reload());
}
