let provider;
let signer;
let account;
let contract;

const TOKEN_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const TOKEN_DECIMALS = 6;

const ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)"
];

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
  if (network.chainId !== 11155111n) {
    alert("Switch MetaMask to Ethereum Sepolia");
    return;
  }

  contract = new ethers.Contract(TOKEN_ADDRESS, ABI, signer);
  updateBalance();
}

async function updateBalance() {
  const raw = await contract.balanceOf(account);
  const balance = Number(ethers.formatUnits(raw, TOKEN_DECIMALS));

  document.getElementById("balance").innerText =
    balance.toLocaleString(undefined, { minimumFractionDigits: 2 });

  document.getElementById("usdValue").innerText =
    `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD`;
}

async function send() {
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
  const tx = await contract.transfer(to, value);
  await tx.wait();

  updateBalance();
}
