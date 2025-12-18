// app.js - Connessione a MetaMask e contratto ERC20

let account;
const contractAddress = "QUI_METTI_IL_TUO_INDIRIZZO_CONTRATTO"; // es: 0x1234...
let contract;

// Funzione per connettere MetaMask
async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("MetaMask non rilevato! Installa MetaMask per procedere.");
      return;
    }

    // Richiede connessione a MetaMask
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    account = accounts[0];
    document.getElementById("walletAddress").innerText = "Wallet: " + account;

    // Controlla rete Sepolia
    let chainId = await window.ethereum.request({ method: "eth_chainId" });
    chainId = chainId.toLowerCase(); // normalizza formato
    if (chainId !== "0xaa36a7") {
      alert("⚠️ Sei connesso alla rete sbagliata. Seleziona 'Sepolia test network' su MetaMask e ricarica la pagina.");
      return;
    }

    // Inizializza Web3
    const web3 = new Web3(window.ethereum);

    // Carica ABI del contratto
    const response = await fetch("usdt.json");
    if (!response.ok) throw new Error("Impossibile caricare usdt.json");
    const abi = await response.json();

    contract = new web3.eth.Contract(abi, contractAddress);

    console.log("✅ Wallet connesso:", account);
  } catch (err) {
    console.error("Errore nel collegamento a MetaMask:", err);
    alert("Errore nel collegamento a MetaMask. Controlla la console per dettagli.");
  }
}

// Funzione per mostrare saldo token
async function getBalance() {
  if (!contract || !account) return alert("Collega prima il wallet.");
  
  try {
    const balance = await contract.methods.balanceOf(account).call();
    const decimals = await contract.methods.decimals().call();
    const formatted = balance / 10 ** decimals;
    alert(`💰 Saldo: ${formatted} USDT`);
  } catch (err) {
    console.error("Errore nel recuperare il saldo:", err);
    alert("Errore nel recuperare il saldo token.");
  }
}

// Associa la funzione al bottone dopo il caricamento della pagina
window.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectButton");
  if (connectBtn) {
    connectBtn.addEventListener("click", connectWallet);
  }
});
