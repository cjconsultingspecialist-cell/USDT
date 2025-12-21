import WalletConnectProvider from "https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2.11.0/dist/index.min.js";

let provider;
let signer;
let account;
let usdt;

const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const USDT_DECIMALS = 6;

const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)"
];

// ⚠️ CAMBIA SOLO QUESTO CON UN PROJECT ID REALE (WalletConnect)
const WC_PROJECT_ID = "YOUR_PROJECT_ID";

async function connectWallet() {
  let ethProvider;

  if (window.ethereum) {
    ethProvider = window.ethereum;
  } else {
    ethProvider = await WalletConnectProvider.init({
      projectId: WC_PROJECT_ID,
      chains: [11155111],
      showQrModal: true,
      rpcMap: {
        11155111: "https://rpc.sepolia.org"
      }
    });
    await ethProvider.enable();
  }

  provider = new ethers.BrowserProvider(ethProvider);
  signer = await provider.getSigner();
  account = await signer.getAddress();

  const network = await provider.getNetwork();
  if (network.chainId !== 11155111n) {
    alert("Switch to Sepolia");
    return;
  }

  document.getElementById("wallet").innerText =
    account.slice(0, 6) + "..." + account.slice(-4);

  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);

  await updateUI();
}

async function updateUI() {
  const raw = await usdt.balanceOf(account);
  const balance = Number(ethers.formatUnits(raw, USDT_DECIMALS));

  document.getElementById("balance").innerText = balance.toFixed(2);
  document.getElementById("usdValue").innerText =
    "$" + balance.toFixed(2) + " USD";

  document.getElementById("usdtPrice").innerText = "$1.00 USD";
  document.getElementById("ethPrice").innerText = "$3000.00 USD";
}

async function sendUSDT() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  if (!ethers.isAddress(to)) {
    alert("Invalid address");
    return;
  }

  const value = ethers.parseUnits(amount, USDT_DECIMALS);
  const tx = await usdt.transfer(to, value);
  await tx.wait();

  await updateUI();
}
