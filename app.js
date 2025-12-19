// app.js – Security Wallet Pro v3 Universale e Professionale (Come Modulo ES6)

// Importa le funzioni necessarie per la connessione universale
import { openConnectModal, subscribeToConnect, subscribeToDisconnect } from 'cdn.jsdelivr.net';

let account;
let contract;
let autoRefreshInterval;
let web3Instance; 

// === CONFIGURAZIONE ===
const contractAddress = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D"; 
const tokenSymbol = "USDT-EDU"; 
const tokenDecimals = 6; 
const tokenImageURL = "cryptologos.cc";
const sepoliaChainId = '11155111'; // Sepolia Chain ID in decimale (per verifica)

// === 🔹 SNACKBAR (Notifiche) ===
function showSnackbar(msg, color = "#323232") {
  const s = document.getElementById("snackbar");
  if (!s) return; 
  s.innerText = msg;
  s.style.backgroundColor = color;
  s.className = "show";
  setTimeout(() => s.className = s.className.replace("show", ""), 3000);
}

// === 🔹 GESTIONE CONNESSIONE MODULO UNIVERSALE ===

// Il pulsante HTML ora chiama la funzione importata openConnectModal()

// Sottoscriviti agli eventi di connessione di AppKit
subscribeToConnect(async ({ detail }) => {
    const provider = detail.provider;
    web3Instance = new Web3(provider);

    const acc = await web3Instance.eth.getAccounts();
    account = acc[0]; // Prendi solo il primo account

    const chainId = await web3Instance.eth.getChainId();
    if (chainId.toString() !== sepoliaChainId) { 
        showSnackbar("⚠️ Cambia rete in Sepolia!", "#f39c12");
        updateStatus(false);
        return;
    }
    
    const abi = await (await fetch("usdt.json")).json();
    contract = new web3Instance.eth.Contract(abi, contractAddress);
    
    showSnackbar("✅ Wallet connesso!", "#2ecc71");
    updateStatus(true); 
    await refreshBalance();
    
    if (!autoRefreshInterval) {
        autoRefreshInterval = setInterval(refreshBalance, 15000);
    }
});

// Sottoscriviti all'evento di disconnessione
subscribeToDisconnect(() => {
    account = null;
    updateStatus(false);
    showSnackbar("Disconnesso da WalletConnect", "#e74c3c");
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
});


// === 🔹 REFRESH SALDO + PREZZO FITTIZIO ===
async function refreshBalance() {
  if (!contract || !account || !web3Instance) return;
  try {
    const balance = await contract.methods.balanceOf(account).call();
    const tokenBal = Number(balance) / 10**tokenDecimals;

    document.getElementById("balance").innerText = `${tokenBal.toFixed(4)} ${tokenSymbol}`;
    // Aggiunto: Simula il prezzo fisso a 1 USD
    document.getElementById("tokenPrice").innerText = "$1.00 USD"; 

  } catch (e) {
    console.warn("aggiorna saldo:", e);
    showSnackbar("Errore nel refresh del saldo", "#e74c3c");
  }
}

// === 🔹 INVIA TOKEN ===
async function sendTokens() {
  if (!contract || !account) return showSnackbar("Connetti prima il wallet", "#f39c12");
  const to = document.getElementById("recipient").value.trim();
  const amount = document.getElementById("amount").value.trim();
  if (!to || !amount) return showSnackbar("Inserisci dati validi", "#f39c12");
  
  try {
    const val = (parseFloat(amount) * 10**tokenDecimals).toString();
    showSnackbar("⏳ Invio in corso...", "#3498db");
    
    // Usa il provider universale per inviare la transazione
    const tx = await contract.methods.transfer(to, val).send({ from: account });
    console.log(tx);
    
    showSnackbar(`✅ ${amount} ${tokenSymbol} inviati!`, "#2ecc71");
    await refreshBalance();
  } catch (e) {
    console.error(e);
    showSnackbar("Errore transazione: Controlla il gas", "#e74c3c");
  }
}

// === 🔹 AGGIUNGI TOKEN (Funzione Didattica per il Logo) ===
async function addToken() {
  // window.ethereum è ancora necessario per usare wallet_watchAsset
  if (!window.ethereum || !account) return showSnackbar("Connetti prima il wallet", "#f39c12");

  try {
    const wasAdded = await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: contractAddress,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
          image: tokenImageURL
        }
      }
    });
    showSnackbar(wasAdded ? `🪙 ${tokenSymbol} aggiunto!` : "❌ Aggiunta annullata",
      wasAdded ? "#2ecc71" : "#e74c3c");
  } catch (e) {
    console.error(e);
    showSnackbar("Errore aggiunta token", "#e74c3c");
  }
}

// === 🔹 INDICATORE DI STATO (Nuova Grafica) ===
function updateStatus(isConnected) {
    const mainCard = document.getElementById("mainCard");
    const statusText = document.getElementById("statusText");
    const walletAddressDisplay = document.getElementById("walletAddress");

    if (isConnected) {
        mainCard.classList.add('connected');
        statusText.innerText = 'Connesso';
        walletAddressDisplay.innerText = account.substring(0, 8) + "..." + account.substring(account.length - 6);
    } else {
        mainCard.classList.remove('connected');
        statusText.innerText = 'Disconnesso';
        walletAddressDisplay.innerText = 'In attesa di autorizzazione...';
        document.getElementById("balance").innerText = '0.00 USDT';
    }
}

// === 🔹 ASSOCIAZIONI PULSANTI ===
window.addEventListener("DOMContentLoaded", () => {
  // Associa gli altri pulsanti
  document.getElementById("sendButton").addEventListener("click", sendTokens);
  document.getElementById("addTokenButton").addEventListener("click", addToken);

  updateStatus(false);
});

// BONUS: Ricarica la pagina per garantire che tutto si re-inizializzi correttamente ai cambi di rete/account
if (window.ethereum) {
    window.ethereum.on("accountsChanged", () => location.reload());
    window.ethereum.on("chainChanged", () => location.reload());
}
