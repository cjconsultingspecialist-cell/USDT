// app.js – Tether USD | Institutional Wallet

let provider;
let signer;
let account;
let contract;

// --- CONFIGURAZIONE CHIAVE ---
const TOKEN_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const TOKEN_DECIMALS = 6;
const SEPOLIA_CHAIN_ID = 11155111n; // Sepolia
// Inserisci qui l'indirizzo del tuo SimpleAMM V2 (deployato su Remix)
const AMM_ADDRESS = "0x9679Dd5a0f628773Db4Ede7C476ee2cc69140d6D"; 
// -----------------------------

// Carichiamo l'ABI dal file JSON
let ABI;
fetch('usdt.json').then(response => response.json()).then(json => {
    ABI = json;
});

async function connect() {
  if (!window.ethereum) {
    alert("Installa un wallet come MetaMask o Trust Wallet");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  account = await signer.getAddress();
  
  // Verifica che la rete sia Sepolia
  const network = await provider.getNetwork();
  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    alert("Switch MetaMask to Ethereum Sepolia");
    return;
  }

  contract = new ethers.Contract(TOKEN_ADDRESS, ABI, signer);
  updateBalance();
  updatePriceFromAMM(); // Legge il prezzo dalla tua AMM privata
}

async function updateBalance() {
  const raw = await contract.balanceOf(account);
  const balance = Number(ethers.formatUnits(raw, TOKEN_DECIMALS));

  document.getElementById("balance").innerText =
    balance.toLocaleString(undefined, { minimumFractionDigits: 2 });
  
  // Nota: l'USD value verrà aggiornato dalla funzione updatePriceFromAMM
}

// Funzione didattica: aggiunge il logo di Tether al wallet
async function addTokenToWallet() {
    try {
        await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: TOKEN_ADDRESS,
                    symbol: 'USDT',
                    decimals: TOKEN_DECIMALS,
                    image: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
                },
            },
        });
    } catch (error) {
        console.error("Errore aggiunta token:", error);
    }
}

// Legge il prezzo dalla TUA AMM privata (per la PWA)
async function updatePriceFromAMM() {
    // ABI minimale per leggere solo la funzione getPrice() dall'AMM
    const ammAbi = [{"inputs":[],"name":"getPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];
    const ammContract = new ethers.Contract(AMM_ADDRESS, ammAbi, provider);

    try {
        const priceInEthWei = await ammContract.getPrice();
        // Converti da WEI in ETH e moltiplica per un valore ETH simulato
        const priceInEth = Number(ethers.formatUnits(priceInEthWei, 18));
        const simulatedEthPrice = 2500; // Esempio: 1 ETH = $2500
        const tokenPriceUsd = (1 / priceInEth) * simulatedEthPrice;

        document.getElementById("usdValue").innerText =
            `$${tokenPriceUsd.toFixed(2)} USD (Prezzo AMM Privata)`;

    } catch (e) {
        console.error("Impossibile leggere il prezzo dall'AMM:", e);
        document.getElementById("usdValue").innerText = "$0.00 USD (AMM non rilevata)";
    }
}


async function send() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  if (!ethers.isAddress(to)) {
    alert("Invalid address");
    return;
  }

  if (!amount || Number(amount) <= 0) {
    alert("Invalid amount");
    return;
  }

  const value = ethers.parseUnits(amount, TOKEN_DECIMALS);
  const tx = await contract.transfer(to, value);
  await tx.wait();

  updateBalance();
}

// Associa la funzione didattica al pulsante (dovrai aggiungerlo nell'HTML)
// document.getElementById("addTokenButton").addEventListener("click", addTokenToWallet);

