// app.js – Tether USD | Institutional Wallet (v3 - 2025)

let provider;
let signer;
let account;
let contract;

// --- CONFIGURAZIONE Sincronizzata ---
const TOKEN_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const AMM_ADDRESS = "0x9679Dd5a0f628773Db4Ede7C476ee2cc69140d6D"; 
const TOKEN_DECIMALS = 6;
const SEPOLIA_CHAIN_ID = 11155111n;

// ABI minimale caricata all'avvio
let ABI;
fetch('usdt.json')
    .then(response => response.json())
    .then(json => { ABI = json; })
    .catch(err => console.error("Errore caricamento usdt.json:", err));

// Funzione principale di connessione
async function connect() {
  if (!window.ethereum) {
    alert("MetaMask non trovato!");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  
  try {
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    account = await signer.getAddress();

    const network = await provider.getNetwork();
    if (network.chainId !== SEPOLIA_CHAIN_ID) {
      alert("Per favore, passa alla rete Ethereum Sepolia su MetaMask.");
      return;
    }

    contract = new ethers.Contract(TOKEN_ADDRESS, ABI, signer);
    
    // Esegue le funzioni di aggiornamento
    await updateBalance();
    await updatePriceFromAMM();

  } catch (error) {
    console.error("Errore durante la connessione:", error);
  }
}

// Aggiorna il saldo dei token
async function updateBalance() {
  if (!contract || !account) return;
  const raw = await contract.balanceOf(account);
  const balance = Number(ethers.formatUnits(raw, TOKEN_DECIMALS));

  document.getElementById("balance").innerText =
    balance.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

// Legge il prezzo dalla tua AMM e lo converte in USD
async function updatePriceFromAMM() {
    if (!provider) return;

    // ABI per la funzione getPrice del tuo SimpleAMM_v2
    const ammAbi = ["function getPrice() view returns (uint256)"];
    const ammContract = new ethers.Contract(AMM_ADDRESS, ammAbi, provider);

    try {
        const priceInEthWei = await ammContract.getPrice();
        
        // Calcolo: 1 Token costa X ETH. 
        // Per avere il prezzo in USD: (1 / (priceInEthWei/1e18)) * Prezzo_ETH
        const priceInEth = Number(ethers.formatUnits(priceInEthWei, 18));
        
        const simulatedEthPrice = 2500; // Valore ETH simulato per la lezione
        let tokenPriceUsd = 0;

        if (priceInEth > 0) {
            // Se il contratto restituisce ETH per 1 Token
            tokenPriceUsd = priceInEth * simulatedEthPrice;
        }

        document.getElementById("usdValue").innerText =
            `$${tokenPriceUsd.toFixed(2)} USD`;

    } catch (e) {
        console.error("Errore lettura prezzo AMM:", e);
        document.getElementById("usdValue").innerText = "Prezzo non disponibile";
    }
}

// Funzione per inviare i token
async function send() {
  if (!contract) return alert("Connetti il wallet prima!");

  const to = document.getElementById("to").value.trim();
  const amount = document.getElementById("amount").value.trim();

  if (!ethers.isAddress(to)) {
    alert("Indirizzo destinatario non valido");
    return;
  }

  if (!amount || Number(amount) <= 0) {
    alert("Inserisci un importo valido");
    return;
  }

  try {
    const value = ethers.parseUnits(amount, TOKEN_DECIMALS);
    const tx = await contract.transfer(to, value);
    
    // Opzionale: mostra un messaggio di caricamento
    document.getElementById("usdValue").innerText = "Transazione in corso...";
    
    await tx.wait();
    alert("✅ Invio completato!");
    
    updateBalance();
    updatePriceFromAMM();
  } catch (error) {
    console.error("Errore durante l'invio:", error);
    alert("Errore nella transazione. Controlla il gas.");
  }
}

// Funzione Didattica per far apparire il logo nel Wallet degli studenti
async function addTokenToWallet() {
    if (!window.ethereum) return;
    try {
        await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: TOKEN_ADDRESS,
                    symbol: 'USDT',
                    decimals: TOKEN_DECIMALS,
                    image: 'cryptologos.cc',
                },
            },
        });
    } catch (error) {
        console.error("Errore aggiunta logo:", error);
    }
}
