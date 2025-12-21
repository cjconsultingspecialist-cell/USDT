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
let wallet;
let usdt;

// ===== INIT =====
window.addEventListener("load", () => {
  provider = new ethers.JsonRpcProvider(RPC_URL);
  console.log("DApp loaded");
});

// ===== WALLET =====
async function generateWallet() {
  wallet = ethers.Wallet.createRandom().connect(provider);
  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, wallet);

  document.getElementById("nativeAddress").innerText = wallet.address;
  await updateWallet();
}

// ===== UPDATE UI =====
async function updateWallet() {
  if (!wallet) return;

  const decimals = await usdt.decimals();
  const raw = await usdt.balanceOf(wallet.address);
  const balance = Number(ethers.formatUnits(raw, decimals));

  document.getElementById("walletBalance").innerText =
    balance.toFixed(2) + " USDT";

  // valori didattici stabili
  const usdtPrice = 1.0;
  const ethPrice = 3000;

  document.getElementById("usdtPrice").innerText =
    "$" + usdtPrice.toFixed(2) + " USD";

  document.getElementById("ethPrice").innerText =
    "$" + ethPrice.toFixed(2) + " USD";

  document.getElementById("walletValue").innerText =
    "$" + (balance * usdtPrice).toFixed(2);
}

// ===== SEND =====
async function sendUSDT() {
  if (!wallet) return alert("Generate wallet first");

  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  const decimals = await usdt.decimals();
  const tx = await usdt.transfer(
    to,
    ethers.parseUnits(amount, decimals)
  );

  await tx.wait();
  await updateWallet();
}
