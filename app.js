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
let activeWallet;

// ===== INIT =====
window.addEventListener("load", async () => {
  provider = new ethers.JsonRpcProvider(RPC_URL);

  const saved = localStorage.getItem("nativeWallet");
  if (saved) {
    signer = new ethers.Wallet(saved, provider);
    activateWallet(signer);
  }
});

// ===== ACTIVATE =====
async function activateWallet(wallet) {
  activeWallet = wallet;
  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, wallet);

  document.getElementById("activeAddress").innerText =
    wallet.address.slice(0,6)+"..."+wallet.address.slice(-4);

  await updateWallet();
}

// ===== METAMASK =====
async function connectMetaMask() {
  const mm = new ethers.BrowserProvider(window.ethereum);
  await mm.send("eth_requestAccounts", []);
  activateWallet(await mm.getSigner());
}

// ===== NATIVE =====
function generateWallet() {
  const wallet = ethers.Wallet.createRandom().connect(provider);
  localStorage.setItem("nativeWallet", wallet.privateKey);
  activateWallet(wallet);
}

// ===== EXPORT =====
function exportWallet() {
  if (!activeWallet?.privateKey) return alert("Only native wallet");

  document.getElementById("pk").value = activeWallet.privateKey;
  document.getElementById("mnemonic").value =
    activeWallet.mnemonic?.phrase || "—";
}

// ===== UPDATE =====
async function updateWallet() {
  const d = await usdt.decimals();
  const bal = await usdt.balanceOf(activeWallet.address);
  const amount = Number(ethers.formatUnits(bal, d));

  document.getElementById("walletBalance").innerText = amount.toFixed(2);
  document.getElementById("usdtPrice").innerText = "$1.00";
  document.getElementById("ethPrice").innerText = "$3000.00";
  document.getElementById("walletValue").innerText =
    "$" + (amount * 1).toFixed(2);
}

// ===== SEND =====
async function sendUSDT() {
  const to = document.getElementById("to").value;
  const amt = document.getElementById("amount").value;
  const d = await usdt.decimals();

  const tx = await usdt.transfer(to, ethers.parseUnits(amt, d));
  await tx.wait();
  await updateWallet();
}
