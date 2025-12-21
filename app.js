let provider;
let signer;
let account;
let usdt;

const CHAIN_ID = 11155111;
const CHAIN_HEX = "0xaa36a7";

const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const USDT_DECIMALS = 6;

const USDT_LOGO = "https://cryptologos.cc/logos/tether-usdt-logo.png";

const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)"
];

async function connectWallet() {
  if (!window.ethereum) {
    alert("Wallet not detected");
    return;
  }

  // richiesta account
  await window.ethereum.request({ method: "eth_requestAccounts" });

  // network check + switch
  const currentChain = await window.ethereum.request({
    method: "eth_chainId"
  });

  if (currentChain !== CHAIN_HEX) {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_HEX }]
    });
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  account = await signer.getAddress();

  document.getElementById("wallet").innerText =
    account.slice(0, 6) + "..." + account.slice(-4);

  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);

  // aggiunta token con logo
  await window.ethereum.request({
    method: "wallet_watchAsset",
    params: {
      type: "ERC20",
      options: {
        address: USDT_ADDRESS,
        symbol: "USDT",
        decimals: USDT_DECIMALS,
        image: USDT_LOGO
      }
    }
  });

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

  if (!ethers.isAddress(to)) return;

  const value = ethers.parseUnits(amount, USDT_DECIMALS);
  const tx = await usdt.transfer(to, value);
  await tx.wait();

  await updateUI();
}

// ESPOSIZIONE GLOBALE (FONDAMENTALE)
window.connectWallet = connectWallet;
window.sendUSDT = sendUSDT;
