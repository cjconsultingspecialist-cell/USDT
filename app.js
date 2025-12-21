import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.14.0/+esm";

/* =====================
   CONFIG
===================== */

const TOKEN_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const AMM_ADDRESS   = "0x9679Dd5a0f628773Db4Ede7C476ee2cc69140d6D";

const TOKEN_SYMBOL   = "USDT";
const TOKEN_DECIMALS = 6;
const TOKEN_IMAGE    = "https://cryptologos.cc/logos/tether-usdt-logo.png";

const SEPOLIA_CHAIN_ID = 11155111n;

/* =====================
   ABIs
===================== */

const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)"
];

const AMM_ABI = [
  "function getReserves() view returns (uint256 ethReserve, uint256 tokenReserve)"
];

/* =====================
   GLOBALS
===================== */

let provider;
let signer;
let account;
let tokenContract;

/* =====================
   CONNECT WALLET
===================== */

async function connect() {
  if (!window.ethereum) {
    alert("MetaMask not found");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  account = await signer.getAddress();

  const network = await provider.getNetwork();
  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    alert("Please connect to Ethereum Sepolia");
    return;
  }

  await importToken();

  tokenContract = new ethers.Contract(
    TOKEN_ADDRESS,
    TOKEN_ABI,
    signer
  );

  document.getElementById("account").innerText =
    account.slice(0, 6) + "..." + account.slice(-4);

  await updateBalance();
}

/* =====================
   IMPORT TOKEN
===================== */

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
  } catch (e) {
    console.log("Token import skipped");
  }
}

/* =====================
   BALANCE
===================== */

async function updateBalance() {
  const raw = await tokenContract.balanceOf(account);
  const balance = Number(
    ethers.formatUnits(raw, TOKEN_DECIMALS)
  );

  document.getElementById("balance").innerText =
    balance.toLocaleString(undefined, { minimumFractionDigits: 2 });

  document.getElementById("usdValue").innerText =
    `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD`;
}

/* =====================
   SEND TOKENS
===================== */

async function send() {
  const btn = document.getElementById("sendBtn");

  try {
    btn.disabled = true;

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

    const value = ethers.parseUnits(amount, TOKEN_DECIMALS);
    const tx = await tokenContract.transfer(to, value);
    await tx.wait();

    await updateBalance();
  } catch (e) {
    console.error(e);
    alert("Transaction failed");
  } finally {
    btn.disabled = false;
  }
}

/* =====================
   AMM — READ ONLY (DEBUG)
===================== */

async function readAMMReserves() {
  const amm = new ethers.Contract(
    AMM_ADDRESS,
    AMM_ABI,
    provider
  );

  const [ethReserve, tokenReserve] = await amm.getReserves();

  console.log("AMM ETH:", ethers.formatEther(ethReserve));
  console.log("AMM USDT:", ethers.formatUnits(tokenReserve, TOKEN_DECIMALS));
}

/* =====================
   EXPORT TO WINDOW
===================== */

window.connect = connect;
window.send = send;
window.readAMMReserves = readAMMReserves;
