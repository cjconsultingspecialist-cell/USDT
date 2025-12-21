console.log("Wallet loaded");

let provider;
let signer;
let account;
let usdt;
let amm;

// === CONFIG ===
const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const AMM_ADDRESS  = "0x9679Dd5a0f628773Db4Ede7C476ee2cc69140d6D";
const USDT_DECIMALS = 6;

// ERC20 ABI
const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)"
];

// SimpleAMM ABI (solo quello che serve)
const AMM_ABI = [
  "function reserveToken() view returns (uint256)",
  "function reserveETH() view returns (uint256)"
];

// DOM
const connectBtn = document.getElementById("connectBtn");
const sendBtn = document.getElementById("sendBtn");

connectBtn.onclick = connect;
sendBtn.onclick = sendUSDT;

// === CONNECT ===
async function connect() {
  if (!window.ethereum) {
    alert("MetaMask not detected");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);

  signer = await provider.getSigner();
  account = await signer.getAddress();

  const net = await provider.getNetwork();
  if (net.chainId !== 11155111n) {
    alert("Switch to Sepolia");
    return;
  }

  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
  amm  = new ethers.Contract(AMM_ADDRESS, AMM_ABI, provider);

  connectBtn.innerText =
    account.slice(0,6) + "..." + account.slice(-4);

  await refreshWallet();
}

// === WALLET UPDATE ===
async function refreshWallet() {
  const raw = await usdt.balanceOf(account);
  const balance = Number(
    ethers.formatUnits(raw, USDT_DECIMALS)
  );

  const price = await getUSDTPrice();
  const value = balance * price;

  document.getElementById("balance").innerText =
    balance.toFixed(2);

  document.getElementById("price").innerText =
    price.toFixed(4);

  document.getElementById("usdValue").innerText =
    `$${value.toFixed(2)} USD`;
}

// === PRICE FROM AMM ===
async function getUSDTPrice() {
  const reserveToken = await amm.reserveToken();
  const reserveETH   = await amm.reserveETH();

  const token = Number(
    ethers.formatUnits(reserveToken, USDT_DECIMALS)
  );
  const eth = Number(
    ethers.formatEther(reserveETH)
  );

  // ETH assumed ~2000 USD (didattico)
  const ethPriceUSD = 2000;

  const poolValueUSD = eth * ethPriceUSD;
  return poolValueUSD / token;
}

// === SEND ===
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
      USDT_DECIMALS
    );

    const tx = await usdt.transfer(to, value);
    await tx.wait();

    await refreshWallet();
    alert("Transfer completed");

  } catch (e) {
    console.error(e);
    alert("Transaction failed");
  } finally {
    sendBtn.disabled = false;
  }
}
