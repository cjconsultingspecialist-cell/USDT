let account;
let usdt;
// Non usiamo più ethers provider direttamente, usiamo window.ethereum iniettato da WalletConnect

const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const USDT_DECIMALS = 6;
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

// Ascolta gli eventi di connessione da WalletConnect/AppKit
window.addEventListener('modal:connect', async ({ detail }) => {
    // Quando l'utente si connette, detail.provider contiene l'oggetto wallet
    const provider = detail.provider;
    const web3Instance = new Web3(provider); // Usiamo Web3.js con il provider universale

    const accs = await web3Instance.eth.getAccounts();
    account = accs[0];

    // Inizializza il contratto
    const abi = await (await fetch("usdt.json")).json(); // Assicurati di avere usdt.json
    usdt = new web3Instance.eth.Contract(abi, USDT_ADDRESS);

    updateStatusUI(`Connesso: ${account.slice(0, 6) + "..." + account.slice(-4)}`, "#26a17b");
    document.getElementById("wallet").innerText = account.slice(0, 6) + "..." + account.slice(-4);
    updateUI();
});

window.addEventListener('modal:disconnect', () => {
    updateStatusUI("Disconnesso", "#e74c3c");
    document.getElementById("wallet").innerText = "-";
});

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
        // Leggi il saldo usando la logica web3.js
        const rawBalance = await usdt.methods.balanceOf(account).call();
        const balance = rawBalance / (10 ** USDT_DECIMALS); 
        document.getElementById("balance").innerText = balance.toFixed(2);
        document.getElementById("usdValue").innerText = "$" + balance.toFixed(2) + " USD";
    } catch (e) { console.warn("Errore lettura saldo:", e); }
}

async function sendUSDT() {
    if (!usdt || !account) return alert("Connetti prima il wallet.");
    const to = document.getElementById("to").value;
    const amount = document.getElementById("amount").value;
    if (!to || !amount) return alert("Inserisci dati validi.");

    try {
        const value = amount * (10 ** USDT_DECIMALS); // Calcola il valore intero
        await usdt.methods.transfer(to, value.toString()).send({ from: account });
        alert("Transazione inviata! In attesa di conferma...");
        updateUI();
    } catch (error) { alert("Errore nell'invio. Assicurati di avere ETH Sepolia per il gas."); }
}

window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("sendButton").addEventListener("click", sendUSDT);
    document.getElementById("addTokenButton").addEventListener("click", addTokenToWallet);
    // Assicurati di avere usdt.json nel repository
    if (!window.Web3) document.head.insertAdjacentHTML('beforeend', '<script src="cdn.jsdelivr.net"></script>');
});
