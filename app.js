console.log("DApp loaded");

const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const AMM_ADDRESS  = "0x9670000000000000000000000000000000000000"; // <-- la tua AMM
const ETH_DECIMALS = 18;
const USDT_DECIMALS = 6;

// ABI MINIME
const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)"
];

const AMM_ABI = [
  "function reserveToken() view returns (uint256)",
  "function reserveETH() view returns (uint256)"
];

let provider;
let signer;
let account;
let usdt;
let amm;

// 🔹 CONNECT WALLET
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found");
    return;
  }

  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  account = await signer.getAddress();

  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
  amm  = new ethers.Contract(AMM_ADDRESS, AMM_ABI, provider);

  document.getElementById("address").innerText =
    account.slice(0, 6) + "..." + account.slice(-4);

  await refreshData();
}

// 🔹 READ AMM + WALLET
async function refreshData() {
  const rawBalance = await usdt.balanceOf(account);
  const balance = Number(ethers.utils.formatUnits(rawBalance, USDT_DECIMALS));
  document.getElementById("balance").innerText = balance.toFixed(2) + " USDT";

  const reserveUSDT = await amm.reserveToken();
  const reserveETH  = await amm.reserveETH();

  const usdtReserve = Number(ethers.utils.formatUnits(reserveUSDT, USDT_DECIMALS));
  const ethReserve  = Number(ethers.utils.formatUnits(reserveETH, ETH_DECIMALS));

  const usdtPrice = ethReserve / usdtReserve;
  const ethPrice  = usdtReserve / ethReserve;

  const walletValue = balance * usdtPrice;

  document.getElementById("walletValue").innerText =
    "Wallet Value: $" + walletValue.toFixed(2);

  document.getElementById("usdtPrice").innerText =
    "USDT Price: $" + usdtPrice.toFixed(4) + " USD";

  document.getElementById("ethPrice").innerText =
    "ETH Price: $" + ethPrice.toFixed(2) + " USD";
}

// 🔹 SEND USDT
async function sendUSDT() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  const tx = await usdt.transfer(
    to,
    ethers.utils.parseUnits(amount, USDT_DECIMALS)
  );

  await tx.wait();
  await refreshData();
}

// 🔹 EVENTS
document.getElementById("address").onclick = connectWallet;
