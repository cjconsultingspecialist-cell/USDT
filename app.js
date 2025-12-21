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
let wallet;
let usdt;

// ===== INIT =====
window.addEventListener("load", () => {
  provider = new ethers.JsonRpcProvider(RPC_URL);
});

// ===== SHARED UPDATE =====
async function refreshUI(address) {
  const readUSDT = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);
  const decimals = await readUSDT.decimals();
  const raw = await readUSDT.balanceOf(address);
  const balance = Number(ethers.formatUnits(raw, decimals));

  document.getElementById("activeAddress").innerText = address;
  document.getElementById("usdtBalance").innerText = balance.toFixed(2);
  document.getElementById("usdtPrice").innerText = "$1.00 USD";
  document.getElementById("ethPrice").innerText = "$3000.00 USD";
  document.getElementById("walletValue").innerText = "$" + (balance * 1).toFixed(2);
}

// ===== METAMASK =====
async function connectMetaMask() {
  if (!window.ethereum) return alert("MetaMask not found");

  const mmProvider = new ethers.BrowserProvider(window.ethereum);
  await mmProvider.send("eth_requestAccounts", []);
  signer = await mmProvider.getSigner();

  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
  await refreshUI(await signer.getAddress());
}

// ===== NATIVE WALLET =====
async function generateNativeWallet() {
  wallet = ethers.Wallet.createRandom().connect(provider);
  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, wallet);

  await refreshUI(wallet.address);
}

// ===== SEND =====
async function sendUSDT() {
  if (!usdt) return alert("No wallet active");

  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;
  const decimals = await usdt.decimals();

  const tx = await usdt.transfer(
    to,
    ethers.parseUnits(amount, decimals)
  );
  await tx.wait();

  const addr = signer ? await signer.getAddress() : wallet.address;
  await refreshUI(addr);
}
