let provider;
let signer;
let account;
let contract;

const TOKEN_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const TOKEN_DECIMALS = 6;

const ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)"
];

// ---------------- CONNECT ----------------
async function connect() {
  if (!window.ethereum) {
    alert("No wallet detected. Open with MetaMask or Trust Wallet browser.");
    return;
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);

    // richiesta esplicita account
    await provider.send("eth_requestAccounts", []);

    signer = await provider.getSigner();
    account = await signer.getAddress();

    const network = await provider.getNetwork();
    if (network.chainId !== 11155111n) {
      alert("Switch to Sepolia network");
      return;
    }

    contract = new ethers.Contract(TOKEN_ADDRESS, ABI, signer);

    document.getElementById("connectBtn").innerText =
      account.slice(0, 6) + "..." + account.slice(-4);

    updateBalance();

  } catch (err) {
    console.error(err);
    alert("Wallet connection failed");
  }
}

// ---------------- BALANCE ----------------
async function updateBalance() {
  const raw = await contract.balanceOf(account);
  const balance = Number(ethers.formatUnits(raw, TOKEN_DECIMALS));

  document.getElementById("balance").innerText =
    balance.toFixed(2) + " USDT";

  document.getElementById("usdValue").innerText =
    "$" + balance.toFixed(2) + " USD";
}

// ---------------- SEND ----------------
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

  try {
    const value = ethers.parseUnits(amount, TOKEN_DECIMALS);
    const tx = await contract.transfer(to, value);
    await tx.wait();
    updateBalance();
  } catch (e) {
    console.error(e);
    alert("Transaction failed");
  }
}

// ---------------- PLACEHOLDER BUY / SELL ----------------
function buy() {
  alert("Buy via AMM – next step");
}

function sell() {
  alert("Sell via AMM – next step");
}
