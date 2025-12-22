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

// Funzione per aprire in app mobile (multi-wallet)
function openInWallet() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const dappUrl = window.location.href;

    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        window.location.href = `metamask.app.link{dappUrl.replace("https://", "")}`;
    } else if (/android/i.test(userAgent)) {
        window.location.href = `intent://${dappUrl.replace("https://", "")}#Intent;package=com.metamask.android;scheme=https;end`;
    } else if (typeof window.ethereum === 'undefined') {
        alert("Installa MetaMask o apri questa pagina dal browser interno del tuo Wallet mobile.");
    }
}

// Connessione Universale e Switch Rete Automatico
async function connectWallet() {
  if (!window.ethereum) {
    alert("Open this DApp inside a Wallet browser (MetaMask, Trust, Coinbase)");
    return;
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    // Questo attiva la richiesta di connessione
    const accs = await provider.send("eth_requestAccounts", []);
    account = accs[0]; // Assicurati di prendere il primo account

    // Controlla la rete
    const network = await provider.getNetwork();

    if (network.chainId !== SEPOLIA_CHAIN_ID_DEC) {
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }]
            });
            // Dopo lo switch, la pagina si ricaricherà automaticamente grazie all'event listener
        } catch (err) {
            alert("Per favore, cambia manualmente la rete in Sepolia nel tuo Wallet.");
            return; // Ferma l'esecuzione se l'utente non cambia rete
        }
    }

    signer = await provider.getSigner();
    
    // Aggiorna l'interfaccia
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

// Funzione per aggiungere il logo al wallet (permette visualizzazione nella schermata principale)
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


async function updateUI() {
  if (!usdt || !account) return;
  const raw = await usdt.balanceOf(account);
  const balance = Number(ethers.formatUnits(raw, USDT_DECIMALS));

  document.getElementById("balance").innerText = balance.toFixed(2);
  document.getElementById("usdValue").innerText =
    "$" + balance.toFixed(2) + " USD";
}

async function sendUSDT() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  if (!ethers.isAddress(to)) {
    alert("Invalid address");
    return;
  }

  const value = ethers.parseUnits(amount, USDT_DECIMALS);
  const tx = await usdt.transfer(to, value);
  alert("Transaction sent! Waiting for confirmation...");
  await tx.wait();

  updateUI();
}

// *** GESTIONE EVENTI (IL FIX PER IL LOOP) ***

// Questi listener ricaricano la pagina quando l'utente cambia account o rete nel wallet
// Questo è il modo standard per gestire la riconnessione in modo pulito.
if (window.ethereum) {
    window.ethereum.on("accountsChanged", () => location.reload());
    window.ethereum.on("chainChanged", () => location.reload());
    
    // Al caricamento, nascondi il pulsante mobile se siamo già nel browser del wallet
    window.addEventListener('load', () => {
        if (window.ethereum) {
            const mobileBtn = document.getElementById("btnMobileOpen");
            if (mobileBtn) mobileBtn.style.display = "none";
            // Tenta la connessione automatica se già autorizzato
            connectWallet();
        }
    });
}
