// ================================
// ASSET METADATA (embedded)
// ================================
const ASSET = {
  name: "Tether USD",
  symbol: "USDT",
  address: "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D",
  decimals: 6,
  chainId: 11155111
};

// ================================
// ERC20 ABI (USDT-compatible)
// ================================
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "success", "type": "bool" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "name": "", "type": "string" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{ "name": "", "type": "string" }],
    "type": "function"
  }
];

// ================================
// APP LOGIC
// ================================
let provider, signer, contract, user;

const connectBtn = document.getElementById("connectBtn");
const sendBtn = document.getElementById("sendBtn");
const disconnectBtn = document.getElementById("disconnectBtn");

connectBtn.onclick = connect;
sendBtn.onclick = send;
disconnectBtn.onclick = () => location.reload();

async function connect() {
  if (!window.ethereum) return;

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);

  signer = await provider.getSigner();
  user = await signer.getAddress();

  const network = await provider.getNetwork();
  if (Number(network.chainId) !== ASSET.chainId) return;

  contract = new ethers.Contract(
    ASSET.address,
    ERC20_ABI,
    signer
  );

  connectBtn.classList.add("hidden");
  document.getElementById("transferBox").classList.remove("hidden");

  refreshBalance();
}

async function refreshBalance() {
  const raw = await contract.balanceOf(user);
  const formatted = Number(
    ethers.formatUnits(raw, ASSET.decimals)
  ).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  document.getElementById("balance").innerText = formatted;
  document.getElementById("usdValue").innerText = `$${formatted} USD`;
}

async function send() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  const value = ethers.parseUnits(amount, ASSET.decimals);
  const tx = await contract.transfer(to, value);
  await tx.wait();

  refreshBalance();
}
