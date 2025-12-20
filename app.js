import { ethers } from "ethers";

/* ================= CONFIG ================= */

let provider;
let signer;
let account;
let token;
let amm;

const TOKEN_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const AMM_ADDRESS   = "0x9679Dd5a0f628773Db4Ede7C476ee2cc69140d6D";

const TOKEN_DECIMALS = 6;
const TOKEN_SYMBOL = "USDT";
const TOKEN_IMAGE =
  "https://cryptologos.cc/logos/tether-usdt-logo.png";

const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)"
];

const AMM_ABI = [
  "function swapETHForTokens() payable",
  "function swapTokensForETH(uint256 tokenIn)"
];

/* ================= CONNECT ================= */

export async function connect() {
  if (!window.ethereum) {
    alert("MetaMask non disponibile");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  account = await signer.getAddress();

  const network = await provider.getNetwork();
  if (network.chainId !== 11155111n) {
    alert("Usa Sepolia");
    return;
  }

  await importToken();

  token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
  amm   = new ethers.Contract(AMM_ADDRESS, AMM_ABI, signer);

  updateBalance();
}

/* ================= IMPORT TOKEN ================= */

async function importToken() {
  try {
    await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: TOKEN_ADDRESS,
          symbol: TOKEN_SYMBOL,
          decimals: TOKEN_DECIMALS,
          image: TOKEN_IMAGE
        }
      }
    });
  } catch {}
}

/* ================= BALANCE ================= */

async function updateBalance() {
  const raw = await token.balanceOf(account);
  const bal = Number(
    ethers.formatUnits(raw, TOKEN_DECIMALS)
  );

  document.getElementById("balance").innerText =
    bal.toLocaleString(undefined, { minimumFractionDigits: 2 });

  document.getElementById("usdValue").innerText =
    `$${bal.toFixed(2)} USD`;
}

/* ================= SEND TOKEN ================= */

export async function send() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  const value = ethers.parseUnits(amount, TOKEN_DECIMALS);
  const tx = await token.transfer(to, value);
  await tx.wait();

  updateBalance();
}

/* =================================================
   🔥 C2 – BUY / SELL TOKEN CON ETH
================================================= */

/* ===== BUY: ETH → USDT ===== */
export async function buy() {
  const ethAmount = document.getElementById("ethBuy").value;

  const tx = await amm.swapETHForTokens({
    value: ethers.parseEther(ethAmount)
  });

  await tx.wait();
  updateBalance();
}

/* ===== SELL: USDT → ETH ===== */
export async function sell() {
  const tokenAmount = document.getElementById("tokenSell").value;
  const value = ethers.parseUnits(tokenAmount, TOKEN_DECIMALS);

  // approve SOLO per questa vendita
  const approveTx = await token.approve(AMM_ADDRESS, value);
  await approveTx.wait();

  const tx = await amm.swapTokensForETH(value);
  await tx.wait();

  updateBalance();
}

/* ================= DISCONNECT ================= */

export function disconnect() {
  location.reload();
}
