console.log("Internal Wallet Loaded");

let provider;
let signer;
let account;
let usdt;
let amm;
let ethFeed;

// === CONFIG ===
const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const AMM_ADDRESS  = "0x9679Dd5a0f628773Db4Ede7C476ee2cc69140d6D";
const ETH_USD_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
const USDT_DECIMALS = 6;

// === ABIs ===
const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)"
];

const AMM_ABI = [
  "function reserveToken() view returns (uint256)",
  "function reserveETH() view returns (uint256)",
  "function buyTokens() payable",
  "function sellTokens(uint256)"
];

const FEED_ABI = [
  "function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)"
];

// === DOM ===
document.getElementById("connectBtn").onclick = connect;
document.getElementById("sendBtn").onclick = sendUSDT;
document.getElementById("buyBtn").onclick = buyUSDT;
document.getElementById("sellBtn").onclick = sellUSDT;

// === CONNECT ===
async function connect() {
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
  amm  = new ethers.Contract(AMM_ADDRESS, AMM_ABI, signer);
  ethFeed = new ethers.Contract(ETH_USD_FEED, FEED_ABI, provider);

  document.getElementById("connectBtn").innerText =
    account.slice(0,6) + "..." + account.slice(-4);

  await refreshWallet();
}

// === WALLET LOGIC ===
async function refreshWallet() {
  const raw = await usdt.balanceOf(account);
  const balance = Number(
    ethers.formatUnits(raw, USDT_DECIMALS)
  );

  const ethPrice = await getETHPrice();
  const usdtPrice = await getUSDTPrice(ethPrice);
  const valueUSD = balance * usdtPrice;

  document.getElementById("balance").innerText = balance.toFixed(2);
  document.getElementById("usdtPrice").innerText = usdtPrice.toFixed(4);
  document.getElementById("ethPrice").innerText = ethPrice.toFixed(2);
  document.getElementById("usdValue").innerText = `$${valueUSD.toFixed(2)}`;
}

// === PRICE FEEDS ===
async function getETHPrice() {
  const data = await ethFeed.latestRoundData();
  return Number(data[1]) / 1e8;
}

async function getUSDTPrice(ethPriceUSD) {
  const rToken = await amm.reserveToken();
  const rETH   = await amm.reserveETH();

  const token = Number(ethers.formatUnits(rToken, USDT_DECIMALS));
  const eth   = Number(ethers.formatEther(rETH));

  return (eth * ethPriceUSD) / token;
}

// === BUY ===
async function buyUSDT() {
  const ethAmount = document.getElementById("buyEth").value;

  const tx = await amm.buyTokens({
    value: ethers.parseEther(ethAmount)
  });

  await tx.wait();
  await refreshWallet();
}

// === SELL ===
async function sellUSDT() {
  const usdtAmount = document.getElementById("sellUsdt").value;
  const value = ethers.parseUnits(usdtAmount, USDT_DECIMALS);

  const approveTx = await usdt.approve(AMM_ADDRESS, value);
  await approveTx.wait();

  const sellTx = await amm.sellTokens(value);
  await sellTx.wait();

  await refreshWallet();
}

// === SEND ===
async function sendUSDT() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  const value = ethers.parseUnits(amount, USDT_DECIMALS);
  const tx = await usdt.transfer(to, value);
  await tx.wait();

  await refreshWallet();
}
