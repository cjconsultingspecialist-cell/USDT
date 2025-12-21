console.log("DApp loaded");

let provider;
let signer;
let userAddress;

// USDT contract (METTI QUI IL TUO INDIRIZZO)
const USDT_ADDRESS = "0x0000000000000000000000000000000000000000";

// ABI MINIMA ERC20
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address,uint256) returns (bool)"
];

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found");
    return;
  }

  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  userAddress = await signer.getAddress();

  console.log("Connected:", userAddress);

  document.getElementById("connectBtn").innerText =
    userAddress.slice(0, 6) + "..." + userAddress.slice(-4);

  await updateBalance();
}

async function updateBalance() {
  const token = new ethers.Contract(
    USDT_ADDRESS,
    ERC20_ABI,
    provider
  );

  const decimals = await token.decimals();
  const raw = await token.balanceOf(userAddress);
  const balance = ethers.utils.formatUnits(raw, decimals);

  document.getElementById("tokenBalance").innerText =
    Number(balance).toFixed(2);

  document.getElementById("usdBalance").innerText =
    Number(balance).toFixed(2);
}

async function sendUSDT() {
  const to = document.getElementById("toAddress").value;
  const amount = document.getElementById("amount").value;

  if (!to || !amount) {
    alert("Missing data");
    return;
  }

  const token = new ethers.Contract(
    USDT_ADDRESS,
    ERC20_ABI,
    signer
  );

  const decimals = await token.decimals();
  const value = ethers.utils.parseUnits(amount, decimals);

  const tx = await token.transfer(to, value);
  await tx.wait();

  alert("Transfer completed");
  await updateBalance();
}

window.addEventListener("load", () => {
  document
    .getElementById("connectBtn")
    .addEventListener("click", connectWallet);

  document
    .getElementById("sendBtn")
    .addEventListener("click", sendUSDT);
});
