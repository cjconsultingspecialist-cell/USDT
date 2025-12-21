console.log("DApp loaded");

const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const USDT_DECIMALS = 6;

// PREZZI STABILI STEP 2
const USDT_PRICE = 1.0;
const ETH_PRICE  = 3000.0;

const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)"
];

let provider;
let signer;
let account;
let usdt;

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

  document.getElementById("address").innerText =
    account.slice(0, 6) + "..." + account.slice(-4);

  await refreshWallet();
}

async function refreshWallet() {
  const raw = await usdt.balanceOf(account);
  const balance = Number(ethers.utils.formatUnits(raw, USDT_DECIMALS));

  document.getElementById("balance").innerText =
    balance.toFixed(2) + " USDT";

  document.getElementById("walletValue").innerText =
    "Wallet Value: $" + (balance * USDT_PRICE).toFixed(2);

  document.getElementById("usdtPrice").innerText =
    "USDT Price: $" + USDT_PRICE.toFixed(2) + " USD";

  document.getElementById("ethPrice").innerText =
    "ETH Price: $" + ETH_PRICE.toFixed(2) + " USD";
}

async function sendUSDT() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  const tx = await usdt.transfer(
    to,
    ethers.utils.parseUnits(amount, USDT_DECIMALS)
  );

  await tx.wait();
  await refreshWallet();
}

document.getElementById("address").onclick = connectWallet;
