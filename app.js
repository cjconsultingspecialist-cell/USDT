// app.js - connessione a MetaMask e contratto ERC20

let account;
const contractAddress = "QUI_METTI_IL_TUO_INDIRIZZO_CONTRATTO"; // esempio: 0x1234...
let contract;

// Funzione per collegare MetaMask
async function connectWallet() {
  if (typeof window.ethereum !== "undefined") {
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      account = accounts[0];
      document.getElementById("walletAddress").innerText = "Wallet: " + account;

      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== "0xaa36a7") { // id della rete Sepolia
        alert("⚠️ Sei sulla rete sbagliata. Seleziona 'Sepolia test network' su MetaMask.");
      }

      // Inizializza web3
      const web3 = new Web3(window.ethereum);

      // Carica l'ABI dal file usdt.json
      const response = await fetch("usdt.json");
      const abi = await response.json();

      contract = new web3.eth.Contract(abi, contractAddress);

    } catch (err) {
      console.error("Errore nel collegamento a MetaMask:", err);
    }
  } else {
    alert("MetaMask non rilevato! Installa MetaMask per procedere.");
  }
}

// Mostra saldo token
async function getBalance() {
  if (!contract || !account) return alert("Collega prima il wallet.");
  const balance = await contract.methods.balanceOf(account).call();
  const decimals = await contract.methods.decimals().call();
  const formatted = balance / 10 ** decimals;
  alert("Hai " + formatted + " USDT.");
}
