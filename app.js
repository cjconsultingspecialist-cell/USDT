let provider;
let signer;
let account;
let usdt;

const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const USDT_DECIMALS = 6;
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // 11155111 in hex
const SEPOLIA_CHAIN_ID_DEC = 11155111; // Sepolia in decimale

const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)"
];

// Funzione per aprire in app mobile (universale per iOS e Android)
function openInWallet() {
    const dappUrl = window.location.href.replace("https://", "");
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (window.ethereum) {
        alert("Sei già connesso all'interno del Wallet. Clicca 'Connetti Wallet' qui sotto.");
        return;
    }

    // Logica per iOS (iPhone/iPad)
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        window.location.href = `metamask.app.link{dappUrl}`;
    } 
    // Logica per Android
    else if (/android/i.test(userAgent)) {
        window.location.href = `intent://${dappUrl}#Intent;scheme=https;package=com.metamask.android;end`;
    } 
    // Caso Desktop o altro
    else {
        alert("Per favore, installa l'estensione MetaMask o apri questa pagina dal browser interno del tuo Wallet mobile.");
    }
}


// Connessione Universale e Switch Rete Automatico
async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert("Per favore, apri questa DApp nel browser interno del tuo Wallet mobile (MetaMask, Trust, Coinbase).");
    return;
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    const accs = await provider.send("eth_requestAccounts", []);
    account = accs[0];

    const network = await provider.getNetwork();

    if (network.chainId !== SEPOLIA_CHAIN_ID_DEC) {
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }]
            });
            location.reload(); 
        } catch (err) {
            alert("Per favore, cambia manualmente la rete in Sepolia nel tuo Wallet.");
            return;
        }
    }

    signer = await provider.getSigner();
    
    document.getElementById("wallet").innerText = account.slice(0, 6) + "..." + account.slice(-4);
    document.getElementById("status").innerText = "● Connesso (Sepolia)";
    document.getElementById("status").style.color = "#26a17b";
    
    const mobileBtn = document.getElementById("btnMobileOpen");
    if (mobileBtn) mobileBtn.style.display = "none";

    usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
    updateUI();

  } catch (error) {
    console.error("Errore connessione:", error);
    alert("Connessione rifiutata dall'utente.");
  }
}

// Funzione per aggiungere il logo al wallet
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
                    image: 'cryptologos.cc', // URL completo e funzionante
                },
            },
        });
    } catch (error) {
        console.error(error);
    }
}


async function updateUI() {
  if (!usdt || !account) return;
  const raw = await usdt.balanceOf(account);
  const balance = Number(ethers.formatUnits(raw, USDT_DECIMALS));

  document.getElementById("balance").innerText = balance.toFixed(2) + " USDT";
}

async function sendUSDT() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  if (!ethers.isAddress(to)) {
    alert("Indirizzo non valido");
    return;
  }
  if (!amount || parseFloat(amount) <= 0) {
      alert("Inserisci una quantità valida");
      return;
  }

  try {
    const value = ethers.parseUnits(amount, USDT_DECIMALS);
    const tx = await usdt.transfer(to, value);
    alert("Transazione inviata! In attesa di conferma...");
    await tx.wait();
    updateUI();
    alert("Transazione completata!");
  } catch (error) {
      console.error(error);
      alert("Errore nell'invio della transazione. Controlla i fondi o il gas.");
  }
}

// *** GESTIONE EVENTI (Ricarica automatica per pulizia) ***

if (window.ethereum) {
    window.ethereum.on("accountsChanged", () => location.reload());
    window.ethereum.on("chainChanged", () => location.reload());
    
    window.addEventListener('load', () => {
        if (window.ethereum) {
            const mobileBtn = document.getElementById("btnMobileOpen");
            if (mobileBtn) mobileBtn.style.display = "none";
            connectWallet();
        }
    });
}
