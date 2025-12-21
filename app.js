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

let wcProvider;

async function connectWallet() {

  // 1️⃣ MetaMask desktop / Android
  if (window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
  }

  // 2️⃣ iOS → WalletConnect
  else {
    wcProvider = await window.EthereumProvider.init({
      projectId: "1537483374ec0250176e950b85934be0",
      chains: [11155111],
      showQrModal: true,
      metadata: {
        name: "Tether Wallet",
        description: "USDT DApp",
        url: window.location.origin,
        icons: ["https://cryptologos.cc/logos/tether-usdt-logo.png"]
      }
    });

    await wcProvider.connect();
    provider = new ethers.BrowserProvider(wcProvider);
  }

  signer = await provider.getSigner();
  account = await signer.getAddress();

  const network = await provider.getNetwork();
  if (network.chainId !== 11155111n) {
    alert("Switch to Sepolia");
    return;
  }

  document.getElementById("wallet").innerText =
    account.slice(0,6) + "..." + account.slice(-4);

  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);

  await updateUI();
}

async function updateUI() {
  const raw = await usdt.balanceOf(account);
  const balance = Number(ethers.formatUnits(raw, USDT_DECIMALS));

  document.getElementById("balance").innerText = balance.toFixed(2);
  document.getElementById("usdValue").innerText = "$" + balance.toFixed(2);
}

async function sendUSDT() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  const value = ethers.parseUnits(amount, USDT_DECIMALS);
  const tx = await usdt.transfer(to, value);
  await tx.wait();

  await updateUI();
}
