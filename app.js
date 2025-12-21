console.log("DApp loaded");

let provider;
let signer;
let account;
let contract;

// === CONFIG ===
const TOKEN_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const TOKEN_DECIMALS = 6;

// ERC20 minimal ABI
const ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)"
];

// === DOM ===
const connectBtn = document.getElementById("connectBtn");
const sendBtn = document.getElementById("sendBtn");

connectBtn.onclick = connect;
sendBtn.onclick = sendUSDT;

// === FUNCTIONS ===
async function connect() {
  if (!window.ethereum) {
    alert("MetaMask not found");
    return;
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    signer = await provider.getSigner();
    account = await signer.getAddress();

    const network = await provider.getNetwork();
    if (network.chainId !== 11155111n) {
      alert("Please switch to Sepolia network");
      return;
    }

    contract = new ethers.Contract(
      TOKEN_ADDRESS,
      ABI,
      signer
    );

    connectBtn.innerText =
      account.slice(0, 6) + "..." + account.slice(-4);

    await updateBalance();

  } catch (err) {
    console.error(err);
    alert("Connection failed");
  }
}

async function updateBalance() {
  const raw = await contract.balanceOf(account);
  const balance = Number(
    ethers.formatUnits(raw, TOKEN_DECIMALS)
  );

  document.getElementById("balance").innerText =
    balance.toFixed(2);

  document.getElementById("usdValue").innerText =
    `$${balance.toFixed(2)} USD`;
}

async function sendUSDT() {
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
    sendBtn.disabled = true;

    const value = ethers.parseUnits(
      amount,
      TOKEN_DECIMALS
    );

    const tx = await contract.transfer(to, value);
    await tx.wait();

    await updateBalance();
    alert("Transfer completed");

  } catch (err) {
    console.error(err);
    alert("Transaction failed");
  } finally {
    sendBtn.disabled = false;
  }
}
