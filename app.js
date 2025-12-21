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
let wallet;
let usdt;

// ===== INIT =====
window.addEventListener("load", async () => {
  provider = new ethers.JsonRpcProvider(RPC_URL);
  console.log("DApp loaded");
});

// ===== WALLET =====
async function generateWallet() {
  wallet = ethers.Wallet.createRandom().connect(provider);
  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, wallet);

  document.getElementById("nativeAddress").innerText = wallet.address;
  document.getElementById("walletAddress").innerText =
    wallet.address.slice(0, 6) + "..." + wallet.address.slice(-4);

  await updateWallet();
}

// ===== UPDATE =====
async function updateWallet() {
  if (!wallet) return;

  const decimals = await usdt.decimals();
  const balanceRaw = await usdt.balanceOf(wallet.address);
  const balance = Number(ethers.formatUnits(balanceRaw, decimals));

  document.getElementById("walletBalance").innerText =
    balance.toFixed(2) + " USDT";

  const usdtPrice = 1.0;
  const ethPrice = 3000.0;

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
