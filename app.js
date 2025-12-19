const USDT_ADDRESS = "0xYOUR_SEPOLIA_CONTRACT";
const USDT_DECIMALS = 6;

const provider = new ethers.BrowserProvider(window.ethereum);
let signer, contract, user;

const ABI = await fetch("./usdt.json").then(r => r.json());

const connectBtn = document.getElementById("connectBtn");
const sendBtn = document.getElementById("sendBtn");
const disconnectBtn = document.getElementById("disconnectBtn");

connectBtn.onclick = connect;
sendBtn.onclick = send;
disconnectBtn.onclick = disconnect;

async function connect() {
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  user = await signer.getAddress();

  contract = new ethers.Contract(USDT_ADDRESS, ABI, signer);

  document.getElementById("connectBtn").classList.add("hidden");
  document.getElementById("transferBox").classList.remove("hidden");

  refreshBalance();
}

async function refreshBalance() {
  const raw = await contract.balanceOf(user);
  const balance = Number(ethers.formatUnits(raw, USDT_DECIMALS)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  document.getElementById("balance").innerText = balance;
  document.getElementById("usdValue").innerText = `$${balance} USD`;
}

async function send() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  const parsed = ethers.parseUnits(amount, USDT_DECIMALS);
  const tx = await contract.transfer(to, parsed);
  await tx.wait();

  refreshBalance();
}

function disconnect() {
  location.reload();
}
