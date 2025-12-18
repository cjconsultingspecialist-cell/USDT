// app.js – Security Wallet (Mini Wallet Didattico ERC-20 su Sepolia)

let account;
let contract;

// === CONFIGURAZIONE ===
const contractAddress = "QUI_METTI_IL_TUO_INDIRIZZO_CONTRATTO"; // esempio: 0x1234...
const tokenSymbol = "USDT";       // simbolo token
const tokenDecimals = 6;          // decimali token
const tokenImage = "USDT.jpg";    // percorso o URL immagine del token
const networkId = "0xaa36a7";     // chain ID rete Sepolia

// === 🔹 COLLEGA METAMASK ===
async function connectWallet() {
  try {
    if (!window.ethereum) return alert("MetaMask non rilevato!");

    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    account = accounts[0];
    document.getElementById("walletAddress").innerText = "Wallet: " + account;

    let chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId.toLowerCase() !== networkId) {
      alert("⚠️ Seleziona 'Sepolia test network' su MetaMask e ricarica la pagina.");
      return;
    }

    const web3 = new Web3(window.ethereum);
    const response = await fetch("usdt.json");
    if (!response.ok) throw new Error("Impossibile caricare usdt.json");
    const abi = await response.json();

    contract = new web3.eth.Contract(abi, contractAddress);
    alert("✅ Wallet connesso con successo!");
  } catch (err) {
    console.error("Errore connessione MetaMask:", err);
    alert("Errore durante la connessione.");
  }
}

// === 🔹 MOSTRA SALDO TOKEN ===
async function getBalance() {
  if (!contract || !account) return alert("Connetti prima MetaMask.");
  try {
    const balance = await contract.methods.balanceOf(account).call();
    const decimals = await contract.methods.decimals().call();
    const formatted = balance / 10 ** decimals;
    alert(`💰 Saldo: ${formatted} ${tokenSymbol}`);
  } catch (err) {
    console.error("Errore nel recupero saldo:", err);
    alert("Errore durante la lettura del saldo.");
  }
}

// === 🔹 INVIA TOKEN ===
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

    const confirmSend = window.confirm(`Vuoi inviare ${amountInput} ${tokenSymbol} a ${to}?`);
    if (!confirmSend) return;

    const tx = await contract.methods.transfer(to, amount).send({ from: account });
    alert(`✅ ${amountInput} ${tokenSymbol} inviati a ${to}`);
    console.log("Tx successo:", tx);
  } catch (err) {
    console.error("Errore nell'invio token:", err);
    alert("Errore durante la transazione, controlla la console.");
  }
}

// === 🔹 MOSTRA IL TUO INDIRIZZO (RICEZIONE) ===
function showAddress() {
  if (!account) return alert("Collega prima MetaMask.");
  alert(`📬 Il tuo indirizzo per ricevere ${tokenSymbol} è: \n${account}`);
}

// === 🔹 AGGIUNGI TOKEN SU METAMASK ===
async function addToken() {
  try {
    const wasAdded = await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: contractAddress,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
          image: tokenImage,
        },
      },
    });

    if (wasAdded) {
      alert(`🪙 ${tokenSymbol} aggiunto su MetaMask!`);
    } else {
      alert("❌ Aggiunta token annullata.");
    }
  } catch (error) {
    console.error("Errore addToken:", error);
    alert("Errore durante l'aggiunta del token su MetaMask.");
  }
}

// === 🔹 ASSOCIA BOTTONI ===
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectButton")?.addEventListener("click", connectWallet);
  document.getElementById("balanceButton")?.addEventListener("click", getBalance);
  document.getElementById("sendButton")?.addEventListener("click", sendTokens);
  document.getElementById("addressButton")?.addEventListener("click", showAddress);
  document.getElementById("addTokenButton")?.addEventListener("click", addToken);
});
