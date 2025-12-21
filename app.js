// ================== CONFIG ==================
const TOKEN_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D"; // USDToken
const AMM_ADDRESS   = "0x9679Dd5a0f628773Db4Ede7C476ee2cc69140d6D"; // SimpleAMM
const CHAIN_ID = 11155111; // Sepolia
const TOKEN_DECIMALS = 6;

// ================== GLOBALS ==================
let provider;
let signer;
let account;
let tokenContract;

// ================== ABIs ==================
const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function decimals() view returns (uint8)"
];

const AMM_ABI = [
  "function ethReserve() view returns (uint256)",
  "function tokenReserve() view returns (uint256)"
];

// ================== CONNECT WALLET ==================
async function connectWallet() {
  if (!window.ethereum) {
    alert("No Ethereum wallet detected");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);

  signer = await provider.getSigner();
  account = await signer.getAddress();

  const network = await provider.getNetwork();
  if (Number(network.chainId) !== CHAIN_ID) {
    alert("Please switch to Sepolia network");
    return;
  }

  tokenContract = new ethers.Contract(
    TOKEN_ADDRESS,
    TOKEN_ABI,
    signer
  );

  await importToken();
  await updateBalance();

  console.log("Connected:", account);
}

// ================== IMPORT TOKEN ==================
async function importToken() {
  try {
    await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: TOKEN_ADDRESS,
          symbol: "USDT",
          decimals: TOKEN_DECIMALS,
          image: "./USDT.jpg"
        }
      }
    });
  } catch (e) {
    console.log("Token import skipped");
  }
}

// ================== BALANCE ==================
async function updateBalance() {
  if (!tokenContract || !account) return;

  const raw = await tokenContract.balanceOf(account);
  const balance = Number(
    ethers.formatUnits(raw, TOKEN_DECIMALS)
  );

  const balEl = document.getElementById("balance");
  const usdEl = document.getElementById("usdValue");

  if (balEl) balEl.innerText = `${balance.toFixed(2)} USDT`;
  if (usdEl) usdEl.innerText = `$${balance.toFixed(2)} USD`;
}

// ================== SEND USDT ==================
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

  const value = ethers.parseUnits(amount, TOKEN_DECIMALS);
  const tx = await tokenContract.transfer(to, value);
  await tx.wait();

  await updateBalance();
}

// ================== READ AMM RESERVES ==================
// ⚠️ QUESTA È LA FUNZIONE CHE STAVI CHIAMANDO IN CONSOLE
window.readAMMReserves = async function () {
  if (!window.ethereum) {
    console.error("No provider");
    return;
  }

  const readProvider = new ethers.BrowserProvider(window.ethereum);
  const amm = new ethers.Contract(
    AMM_ADDRESS,
    AMM_ABI,
    readProvider
  );

  const ethRes = await amm.ethReserve();
  const tokenRes = await amm.tokenReserve();

  console.log("AMM ETH:", ethers.formatEther(ethRes));
  console.log("AMM USDT:", ethers.formatUnits(tokenRes, TOKEN_DECIMALS));
};

// ================== AUTO INIT ==================
window.addEventListener("load", () => {
  console.log("DApp loaded");
});
