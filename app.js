// ===== CONFIG =====
const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const CHAIN_ID = 11155111;

const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function decimals() view returns (uint8)"
];

const USDT_PRICE = 1.0;       // didattico
const ETH_PRICE = 3000.0;    // didattico

// ===== GLOBAL =====
let provider;
let signer;
let account;
let usdt;

// ===== METAMASK =====
async function connectMetaMask() {
  if (!window.ethereum) {
    alert("MetaMask not found");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  account = await signer.getAddress();

  const network = await provider.getNetwork();
  if (network.chainId !== BigInt(CHAIN_ID)) {
    alert("Switch to Sepolia");
    return;
  }

  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
  await updateUI();
}

// ===== WALLETCONNECT (MOBILE) =====
async function connectWalletConnect() {
  const wcProvider = new WalletConnectProvider.default({
    rpc: {
      11155111: "https://rpc.sepolia.org"
    }
  });

  await wcProvider.enable();

  provider = new ethers.BrowserProvider(wcProvider);
  signer = await provider.getSigner();
  account = await signer.getAddress();

  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
  await updateUI();
}

// ===== UPDATE UI =====
async function updateUI() {
  const decimals = await usdt.decimals();
  const raw = await usdt.balanceOf(account);
  const balance = Number(ethers.formatUnits(raw, decimals));

  document.getElementById("balance").innerText =
    balance.toFixed(2) + " USDT";

  document.getElementById("walletValue").innerText =
    "$" + (balance * USDT_PRICE).toFixed(2);

  document.getElementById("usdtPrice").innerText =
    "$" + USDT_PRICE.toFixed(2) + " USD";

  document.getElementById("ethPrice").innerText =
    "$" + ETH_PRICE.toFixed(2) + " USD";
}

// ===== SEND =====
async function sendUSDT() {
  if (!usdt) return alert("Connect wallet first");

  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  if (!ethers.isAddress(to)) {
    alert("Invalid address");
    return;
  }

  const decimals = await usdt.decimals();
  const tx = await usdt.transfer(
    to,
    ethers.parseUnits(amount, decimals)
  );

  await tx.wait();
  await updateUI();
}

// ===== FIX TASTI (OBBLIGATORIO) =====
window.connectMetaMask = connectMetaMask;
window.connectWalletConnect = connectWalletConnect;
window.sendUSDT = sendUSDT;
