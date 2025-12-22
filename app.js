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

const SEPOLIA_CHAIN_ID = "0xaa36a7";

async function connectWallet() {
  if (!window.ethereum) {
    alert("Open this DApp inside MetaMask browser");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  account = await signer.getAddress();

  const chainId = await window.ethereum.request({ method: "eth_chainId" });

  if (chainId !== SEPOLIA_CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }]
      });
    } catch (err) {
      alert("Please switch to Sepolia network in MetaMask");
    }
  }

  document.getElementById("wallet").innerText =
    account.slice(0, 6) + "..." + account.slice(-4);

  usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
  updateUI();
}
async function updateUI() {
  const raw = await usdt.balanceOf(account);
  const balance = Number(ethers.formatUnits(raw, USDT_DECIMALS));

  document.getElementById("balance").innerText = balance.toFixed(2);
  document.getElementById("usdValue").innerText =
    "$" + balance.toFixed(2) + " USD";
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

  updateUI();
}
