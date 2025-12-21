// ===== CONFIG =====
const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const CHAIN_ID = 11155111n;

const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function decimals() view returns (uint8)"
];

// ===== GLOBAL =====
let provider;
let signer;
let account;
let usdt;
let decimals = 6;

// ===== UI =====
const connectBtn = document.getElementById("connectBtn");
const sendBtn = document.getElementById("sendBtn");

// ===== CONNECT =====
async function connect() {
  if (!window.ethereum) {
    alert("MetaMask not found");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  account = await signer.getAddress();

  const network = await provider.getNetwork();
  if (network.chainId !== CHAIN_ID) {
    alert("Switch to Sepolia");
    return;
  }

  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
  decimals = await usdt.decimals();

  document.getElementById("account").innerText = account;

  await updateAll();
}

// ===== UPDATE =====
async function updateAll() {
  if (!usdt || !account) return;

  const balRaw = await usdt.balanceOf(account);
  const balance = Number(ethers.formatUnits(balRaw, decimals));

  document.getElementById("balance").innerText = balance.toFixed(2);
  document.getElementById("walletValue").innerText =
    "$" + balance.toFixed(2);

  // prezzi DIDATTICI STABILI
  document.getElementById("usdtPrice").innerText = "$1.00 USD";
  document.getElementById("ethPrice").innerText = "$3000.00 USD";
}

// ===== SEND =====
async function sendUSDT() {
  if (!usdt) return;

  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  if (!ethers.isAddress(to)) return alert("Invalid address");
  if (!amount || Number(amount) <= 0) return alert("Invalid amount");

  try {
    sendBtn.disabled = true;

    const tx = await usdt.transfer(
      to,
      ethers.parseUnits(amount, decimals)
    );

    await tx.wait();
    await updateAll();

  } catch (e) {
    alert("Transaction failed");
  } finally {
    sendBtn.disabled = false;
  }
}

// ===== EVENTS =====
connectBtn.onclick = connect;
sendBtn.onclick = sendUSDT;

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => location.reload());
  window.ethereum.on("chainChanged", () => location.reload());
}
