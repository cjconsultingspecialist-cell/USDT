// app.js – Mini Wallet didattico per token ERC20 (rete Sepolia)

let account;
let contract;
const contractAddress = "QUI_METTI_IL_TUO_INDIRIZZO_CONTRATTO"; // es: 0x1234...
const networkId = "0xaa36a7"; // Chain ID Sepolia

// === 🔹 FUNZIONE PRINCIPALE: CONNETTI METAMASK ===
async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("🚫 MetaMask non rilevato! Installa MetaMask per procedere.");
      return;
    }

    // Richiedi accesso a MetaMask
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    account = accounts[0];
    document.getElementById("walletAddress").innerText = "Wallet: " + account;

    // ✅ Controlla rete Sepolia
    let chainId = await window.ethereum.request({ method: "eth_chainId" });
    chainId = chainId.toLowerCase();
    if (chainId !== networkId) {
      alert("⚠️ Sei su una rete diversa. Seleziona 'Sepolia test network' su MetaMask e ricarica la pagina.");
      return;
    }

    // Inizializza Web3 provider
    const web3 = new Web3(window.ethereum);

    // Carica ABI del contratto (es. usdt.json)
    const response = await fetch("usdt.json");
    if (!response.ok) throw new Error("Impossibile caricare usdt.json");
    const abi = await response.json();

    contract = new web3.eth.Contract(abi, contractAddress);

    console.log("✅ Wallet connesso:", account);
    alert("✅ Wallet connesso con successo!");
  } catch (err) {
    console.error("Errore connessione MetaMask:", err);
    alert("Errore durante la connessione. Controlla la console.");
  }
}

// === 🔹 FUNZIONE: MOSTRA SALDO TOKEN ===
async function getBalance() {
  if (!contract || !account) return alert("Collega prima il wallet.");
  
  try {
    const balance = await contract.methods.balanceOf(account).call();
    const decimals = await contract.methods.decimals().call();
    const formatted = balance / 10 ** decimals;
    alert(`💰 Saldo: ${formatted} token`);
  } catch (err) {
    console.error("Errore nel recupero saldo:", err);
    alert("Errore durante la lettura del saldo.");
  }
}

// === 🔹 FUNZIONE: INVIA TOKEN VERSO ALTRO INDIRIZZO ===
async function sendTokens() {
  if (!contract || !account) return alert("Collega prima il wallet.");

  try {
    const to = document.getElementById("recipient").value.trim();
    const amountInput = document.getElementById("amount").value.trim();

    if (!to || !amountInput) {
      alert("Inserisci indirizzo e quantità.");
      return;
    }

    const decimals = await contract.methods.decimals().call();
    const amount = (amountInput * 10 ** decimals).toString();

    // Conferma transazione
    const confirm = window.confirm(`Vuoi inviare ${amountInput} token a ${to}?`);
    if (!confirm) return;

    // Esecuzione transazione
    const tx = await contract.methods.transfer(to, amount).send({ from: account });
    console.log("✅ Transazione inviata:", tx);
    alert(`✅ ${amountInput} token inviati a ${to}`);
  } catch (err) {
    console.error("Errore nell'invio token:", err);
    alert("Errore durante la transazione. Controlla la console.");
  }
}

// === 🔹 FUNZIONE: MOSTRA IL TUO INDIRIZZO (PER RICEVERE TOKEN) ===
function showAddress() {
  if (!account) return alert("Collega prima il wallet.");
  alert(`📥 Il tuo indirizzo per ricevere token è:\n${account}`);
}

// === 🔹 ASSOCIA BOTTONI (una volta caricata la pagina) ===
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectButton")?.addEventListener("click", connectWallet);
  document.getElementById("balanceButton")?.addEventListener("click", getBalance);
  document.getElementById("sendButton")?.addEventListener("click", sendTokens);
  document.getElementById("addressButton")?.addEventListener("click", showAddress);
});
