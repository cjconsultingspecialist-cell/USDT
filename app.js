// app.js – Security Wallet Pro v3 Universale e Professionale

let account;
let contract;
let autoRefreshInterval;
let chart;
let web3Instance; // Useremo questa per Web3

// === CONFIGURAZIONE ===
// Assicurati che l'indirizzo sia corretto per la tua deploy su Sepolia
const contractAddress = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D"; 
const tokenSymbol = "USDT-EDU"; // Simbolo didattico
const tokenDecimals = 6; 
const tokenImageURL = "cryptologos.cc";
const networkId = "0xaa36a7"; // Sepolia Chain ID (hex)

// === 🔹 SNACKBAR (Notifiche) ===
function showSnackbar(msg, color = "#323232") {
  const s = document.getElementById("snackbar");
  // Assicurati di avere un div con id="snackbar" nell'html
  if (!s) return; 
  s.innerText = msg;
  s.style.backgroundColor = color;
  s.className = "show";
  setTimeout(() => s.className = s.className.replace("show", ""), 3000);
}

// === 🔹 CONNESSIONE UNIVERSALE (EIP-6963 + WalletConnect) ===
// Il pulsante di connessione è gestito da index.html tramite openConnectModal()

// Ascolta l'evento che AppKit/WalletConnect emette quando un utente si connette
window.addEventListener('modal:connect', async ({ detail }) => {
    // detail contiene l'informazione sul provider scelto
    const provider = detail.provider;
    web3Instance = new Web3(provider);

    // Ottieni l'account
    const acc = await web3Instance.eth.getAccounts();
    account = acc[0];

    // Verifica la rete (Sepolia)
    const chainId = await web3Instance.eth.getChainId(); // getChainId() ora ritorna un number
    if (chainId.toString() !== '11155111') { // 11155111 è Sepolia in decimale
        showSnackbar("⚠️ Cambia rete in Sepolia!", "#f39c12");
        updateStatus(false);
        return;
    }
    
    // Carica il contratto ABI
    const abi = await (await fetch("usdt.json")).json();
    contract = new web3Instance.eth.Contract(abi, contractAddress);
    
    showSnackbar("✅ Wallet connesso!", "#2ecc71");
    updateStatus(true); // Aggiorna lo stato grafico a "Connesso"
    await refreshBalance();
    
    // Avvia refresh automatico
    if (!autoRefreshInterval) {
        autoRefreshInterval = setInterval(refreshBalance, 15000);
    }
});

// Ascolta l'evento di disconnessione
window.addEventListener('modal:disconnect', () => {
    account = null;
    updateStatus(false);
    showSnackbar("Disconnesso da WalletConnect", "#e74c3c");
    if (chart) { chart.destroy(); chart = null; }
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
});


// === 🔹 REFRESH SALDO + GRAFICO ===
async function refreshBalance() {
  if (!contract || !account || !web3Instance) return;
  try {
    const balance = await contract.methods.balanceOf(account).call();
    // Non abbiamo bisogno di chiamare decimals() ogni volta se è fisso a 6
    const tokenBal = Number(balance) / 10**tokenDecimals;

    // bilancio ETH
    const ethBal = Number(await web3Instance.eth.getBalance(account)) / 1e18;

    // Aggiorna l'interfaccia con la nuova grafica
    document.getElementById("balance").innerText = `${tokenBal.toFixed(4)} ${tokenSymbol}`;
    updateChart(tokenBal, ethBal);
  } catch (e) {
    console.warn("aggiorna saldo:", e);
    showSnackbar("Errore nel refresh del saldo", "#e74c3c");
  }
}

// === 🔹 GRAFICO ===
function updateChart(tokenBal, ethBal) {
  // Rimosso il canvas dall'HTML per semplificare la grafica, 
  // quindi questa funzione non è più necessaria, a meno che tu non lo rimetta.
}

// === 🔹 INVIA TOKEN ===
async function sendTokens() {
  if (!contract || !account) return showSnackbar("Connetti prima il wallet", "#f39c12");
  const to = document.getElementById("recipient").value.trim();
  const amount = document.getElementById("amount").value.trim();
  if (!to || !amount) return showSnackbar("Inserisci dati validi", "#f39c12");
  
  try {
    const val = (parseFloat(amount) * 10**tokenDecimals).toString(); // Converti in stringa per web3
    showSnackbar("⏳ Invio in corso...", "#3498db");
    
    // Invia la transazione utilizzando il provider universale connesso
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
        // Mostra l'indirizzo completo temporaneamente prima di accorciarlo
        walletAddressDisplay.innerText = account; 
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
  // Il pulsante di connessione è gestito direttamente nell'HTML ora con onclick="openConnectModal()"
  
  // Associa gli altri pulsanti
  document.getElementById("sendButton").addEventListener("click", sendTokens);
  document.getElementById("addTokenButton").addEventListener("click", addToken);

  updateStatus(false);
});

// BONUS: Gestione automatica cambi account/rete da parte del wallet
if (window.ethereum) {
    window.ethereum.on("accountsChanged", () => location.reload());
    window.ethereum.on("chainChanged", () => location.reload());
}
