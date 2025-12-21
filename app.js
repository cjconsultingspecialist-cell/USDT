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
let signer;
let usdt;
let activeAddress;

// ===== INIT =====
window.addEventListener("load", async () => {
  provider = new ethers.JsonRpcProvider(RPC_URL);

  const savedWallet = localStorage.getItem("nativeWallet");
  if (savedWallet) {
    signer = new ethers.Wallet(savedWallet, provider);
    activateWallet(signer);
  }
});

// ===== HELPERS =====
function short(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// ===== ACTIVATE =====
async function activateWallet(wallet) {
  signer = wallet;
  activeAddress = await signer.getAddress();
  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);

  document.getElementById("activeAddress").innerText = short(activeAddress);
  await updateWallet();
}

// ===== METAMASK =====
async function connectMetaMask() {
  if (!window.ethereum) return alert("MetaMask not found");

  const mmProvider = new ethers.BrowserProvider(window.ethereum);
  await mmProvider.send("eth_requestAccounts", []);
  const mmSigner = await mmProvider.getSigner();

  activateWallet(mmSigner);
}

// ===== NATIVE WALLET =====
function generateWallet() {
  const wallet = ethers.Wallet.createRandom().connect(provider);
  localStorage.setItem("nativeWallet", wallet.privateKey);
  activateWallet(wallet);
}

// ===== UPDATE UI =====
async function updateWallet() {
  const decimals = await usdt.decimals();
  const balRaw = await usdt.balanceOf(activeAddress);
  const balance = Number(ethers.formatUnits(balRaw, decimals));

  const usdtPrice = 1.0;
  const ethPrice = 3000.0;

  document.getElementById("walletBalance").innerText = balance.toFixed(2);
  document.getElementById("usdtPrice").innerText = "$" + usdtPrice.toFixed(2);
  document.getElementById("ethPrice").innerText = "$" + ethPrice.toFixed(2);
  document.getElementById("walletValue").innerText =
    "$" + (balance * usdtPrice).toFixed(2);
}

// ===== SEND =====
async function sendUSDT() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;
  if (!to || !amount) return;

  const decimals = await usdt.decimals();
  const tx = await usdt.transfer(
    to,
    ethers.parseUnits(amount, decimals)
  );

  await tx.wait();
  addTx("OUT", amount, tx.hash);
  await updateWallet();
}

// ===== TX HISTORY =====
function addTx(type, amount, hash) {
  const li = document.createElement("li");
  li.innerText = `${type} ${amount} USDT — ${short(hash)}`;
  document.getElementById("txHistory").prepend(li);
}
