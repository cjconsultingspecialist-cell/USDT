// ===== CONFIG =====
const RPC_URL = "https://sepolia.infura.io/v3/YOUR_INFURA_KEY";
const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";

const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function decimals() view returns (uint8)"
];

// ===== GLOBAL =====
let provider;
let signer = null;
let wallet = null;
let usdt = null;
let mode = null;

// ===== INIT =====
window.addEventListener("load", () => {
  provider = new ethers.JsonRpcProvider(RPC_URL);
  loadNativeWallet();
});

// ===== METAMASK =====
async function connectMetaMask() {
  if (!window.ethereum) return alert("MetaMask not installed");

  const mmProvider = new ethers.BrowserProvider(window.ethereum);
  await mmProvider.send("eth_requestAccounts", []);
  signer = await mmProvider.getSigner();

  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
  mode = "metamask";

  document.getElementById("activeAddress").innerText = await signer.getAddress();
  document.getElementById("privateKey").value = "";
  updateWallet();
}

// ===== NATIVE WALLET =====
function createNativeWallet() {
  let pk = localStorage.getItem("native_pk");

  if (!pk) {
    wallet = ethers.Wallet.createRandom();
    localStorage.setItem("native_pk", wallet.privateKey);
  } else {
    wallet = new ethers.Wallet(pk);
  }

  wallet = wallet.connect(provider);
  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, wallet);
  mode = "native";

  document.getElementById("activeAddress").innerText = wallet.address;
  document.getElementById("privateKey").value = wallet.privateKey;

  updateWallet();
}

function loadNativeWallet() {
  if (localStorage.getItem("native_pk")) {
    createNativeWallet();
  }
}

function resetWallet() {
  localStorage.removeItem("native_pk");
  location.reload();
}

// ===== UPDATE =====
async function updateWallet() {
  if (!usdt) return;

  const decimals = await usdt.decimals();
  const address =
    mode === "metamask"
      ? await signer.getAddress()
      : wallet.address;

  const raw = await usdt.balanceOf(address);
  const balance = Number(ethers.formatUnits(raw, decimals));

  const usdtPrice = 1.0;
  const ethPrice = 3000;

  document.getElementById("walletBalance").innerText = balance.toFixed(2);
  document.getElementById("walletValue").innerText =
    "$" + (balance * usdtPrice).toFixed(2);
  document.getElementById("usdtPrice").innerText = "$" + usdtPrice.toFixed(2);
  document.getElementById("ethPrice").innerText = "$" + ethPrice.toFixed(2);
}

// ===== SEND =====
async function sendUSDT() {
  if (!usdt) return alert("No wallet connected");

  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;
  if (!to || !amount) return;

  const decimals = await usdt.decimals();
  const tx = await usdt.transfer(
    to,
    ethers.parseUnits(amount, decimals)
  );
  await tx.wait();
  updateWallet();
}
