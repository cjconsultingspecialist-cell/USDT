import WalletConnectProvider from "https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2.11.0/dist/index.min.js";

let provider;
let signer;
let account;
let usdt;

const CHAIN_ID = 11155111;
const CHAIN_HEX = "0xaa36a7";

const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const USDT_DECIMALS = 6;

const WC_PROJECT_ID = "1537483374ec0250176e950b85934be0";

const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)"
];

async function connectWallet() {
  let ethProvider;

  if (window.ethereum) {
    ethProvider = window.ethereum;
  } else {
    ethProvider = await WalletConnectProvider.init({
      projectId: WC_PROJECT_ID,
      chains: [CHAIN_ID],
      showQrModal: true,
      rpcMap: {
        [CHAIN_ID]: "https://rpc.sepolia.org"
      }
    });
    await ethProvider.enable();
  }

  provider = new ethers.BrowserProvider(ethProvider);

  const network = await provider.getNetwork();
  if (network.chainId !== BigInt(CHAIN_ID)) {
    await ethProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_HEX }]
    });
  }

  signer = await provider.getSigner();
  account = await signer.getAddress();

  document.getElementById("wallet").innerText =
    account.slice(0, 6) + "..." + account.slice(-4);

  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);

  await updateUI();
}

async function updateUI() {
  const raw = await usdt.balanceOf(account);
  const balance = Number(ethers.formatUnits(raw, USDT_DECIMALS));

  document.getElementById("balance").innerText = balance.toFixed(2);
  document.getElementById("usdValue").innerText = "$" + balance.toFixed(2) + " USD";

  document.getElementById("usdtPrice").innerText = "$1.00 USD";
  document.getElementById("ethPrice").innerText = "$3000.00 USD";
}

async function sendUSDT() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  if (!ethers.isAddress(to)) return;

  const value = ethers.parseUnits(amount, USDT_DECIMALS);
  const tx = await usdt.transfer(to, value);
  await tx.wait();

  await updateUI();
}

window.connectWallet = connectWallet;
window.sendUSDT = sendUSDT;
