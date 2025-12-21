// ===== CONFIG =====
const RPC_URL = "https://sepolia.infura.io/v3/1537483374ec0250176e950b85934be0";

const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";

const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function decimals() view returns (uint8)"
];

// ===== GLOBAL =====
let provider;
let signer;
let wallet;
let usdt;

// ===== INIT =====
window.addEventListener("load", () => {
  provider = new ethers.JsonRpcProvider(RPC_URL);
});

// ===== METAMASK =====
async function connectMetaMask() {
  if (!window.ethereum) return alert("MetaMask not found");

  const mmProvider = new ethers.BrowserProvider(window.ethereum);
  signer = await mmProvider.getSigner();

  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);

  document.getElementById("activeAddress").innerText = signer.address;
  document.getElementById("privateKey").innerText = "MetaMask wallet";

  updateWallet(signer.address);
}

// ===== NATIVE WALLET =====
async function generateWallet() {
  wallet = ethers.Wallet.createRandom().connect(provider);
  signer = wallet;

  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, wallet);

  document.getElementById("activeAddress").innerText = wallet.address;
  document.getElementById("privateKey").innerText = wallet.privateKey;

  updateWallet(wallet.address);
}

// ===== IMPORT WALLET =====
async function importWallet() {
  const pk = document.getElementById("importKey").value.trim();
  if (!pk) return;

  wallet = new ethers.Wallet(pk, provider);
  signer = wallet;

  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, wallet);

  document.getElementById("activeAddress").innerText = wallet.address;
  document.getElementById("privateKey").innerText = wallet.privateKey;

  updateWallet(wallet.address);
}

// ===== UI =====
function togglePK() {
  const el = document.getElementById("privateKey");
  el.style.display = el.style.display === "none" ? "block" : "none";
}

// ===== UPDATE =====
async function updateWallet(address) {
  const decimals = await usdt.decimals();
  const raw = await usdt.balanceOf(address);
  const balance = Number(ethers.formatUnits(raw, decimals));

  const usdtPrice = 1.0;
  const ethPrice = 3000;

  document.getElementById("walletBalance").innerText = balance.toFixed(2);
  document.getElementById("usdtPrice").innerText = "$1.00 USD";
  document.getElementById("ethPrice").innerText = "$3000.00 USD";
  document.getElementById("walletValue").innerText =
    "$" + (balance * usdtPrice).toFixed(2);
}

// ===== SEND =====
async function sendUSDT() {
  if (!signer) return alert("No wallet");

  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  const decimals = await usdt.decimals();
  const tx = await usdt.transfer(
    to,
    ethers.parseUnits(amount, decimals)
  );

  await tx.wait();
  updateWallet(signer.address);
}
