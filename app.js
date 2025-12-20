let provider;
let signer;
let account;
let contract;

/* =========================
   CONFIG
========================= */
const TOKEN_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const TOKEN_DECIMALS = 6;

// WalletConnect v2 – Project ID fornito da te
const WALLETCONNECT_PROJECT_ID = "1537483374ec0250176e950b85934be0";

/* =========================
   ABI
========================= */
const ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)"
];

/* =========================
   CONNECT WALLET
========================= */
async function connect() {
  try {
    // DESKTOP (MetaMask, Rabby, ecc.)
    if (window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
    }
    // MOBILE (WalletConnect)
    else {
      const wcProvider = await window.WalletConnectEthereumProvider.init({
        projectId: WALLETCONNECT_PROJECT_ID,
        chains: [11155111], // Sepolia
        showQrModal: true,
        metadata: {
          name: "Official Tether USD DApp",
          description: "Institutional Tether USD Wallet",
          url: "https://cjconsultingspecialist-cell.github.io/USDT/",
          icons: ["https://cryptologos.cc/logos/tether-usdt-logo.png"]
        }
      });

      await wcProvider.enable();
      provider = new ethers.BrowserProvider(wcProvider);
    }

    signer = await provider.getSigner();
    account = await signer.getAddress();

    const network = await provider.getNetwork();
    if (network.chainId !== 11155111n) {
      alert("Please connect to Ethereum Sepolia");
      return;
    }

    contract = new ethers.Contract(TOKEN_ADDRESS, ABI, signer);

    document.getElementById("connectBtn").innerText =
      account.slice(0, 6) + "..." + account.slice(-4);

    updateBalance();

  } catch (error) {
    console.error(error);
    alert("Wallet connection failed");
  }
}

/* =========================
   UPDATE BALANCE
========================= */
async function updateBalance() {
  try {
    const raw = await contract.balanceOf(account);
    const balance = Number(ethers.formatUnits(raw, TOKEN_DECIMALS));

    document.getElementById("balance").innerText =
      balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) + " USDT";

    document.getElementById("usdValue").innerText =
      "$" + balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) + " USD";
  } catch (error) {
    console.error(error);
  }
}

/* =========================
   SEND TOKEN
========================= */
async function send() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  if (!ethers.isAddress(to)) {
    alert("Invalid recipient address");
    return;
  }

  if (!amount || Number(amount) <= 0) {
    alert("Invalid amount");
    return;
  }

  try {
    const value = ethers.parseUnits(amount, TOKEN_DECIMALS);
    const tx = await contract.transfer(to, value);
    await tx.wait();
    updateBalance();
  } catch (error) {
    console.error(error);
    alert("Transaction failed");
  }
}
