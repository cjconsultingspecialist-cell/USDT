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

// 1. Funzione per saltare dal browser normale all'App Wallet (Deep Linking)
function openInWallet() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const dappUrl = window.location.href;

    // Controlla per iOS (iPhone/iPad)
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        window.location.href = `metamask.app.link{dappUrl.replace("https://", "")}`;
    } 
    // Controlla per Android
    else if (/android/i.test(userAgent)) {
        // Link per aprire in MetaMask Android
        window.location.href = `intent://${dappUrl.replace("https://", "")}#Intent;package=com.metamask.android;scheme=https;end`;
    }
    // Browser desktop senza estensione
    else if (typeof window.ethereum === 'undefined') {
        alert("Installa MetaMask o apri questa pagina dal browser interno del tuo Wallet mobile.");
    }
}

// 2. Connessione Universale e Switch Rete Automatico
async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert("Per favore, apri questa pagina dal browser interno del tuo Wallet.");
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
        window.location.reload(); 
      } catch (err) {
        if (err.code === 4902) {
            alert("Aggiungi la rete Sepolia al tuo wallet per continuare.");
        }
      }
    }

    signer = await provider.getSigner();
    
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
                    symbol: 'USDT',
                    decimals: USDT_DECIMALS,
                    image: 'cryptologos.cc',
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
  document.getElementById("usdValue").innerText = "$" + balance.toLocaleString() + " USD"; 
}

// 5. Invio Token
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

// Nascondi il pulsante deep-link se siamo già in un wallet browser
window.addEventListener('load', () => {
    if (window.ethereum) {
        document.getElementById("btnMobileOpen").style.display = "none";
    }
});
