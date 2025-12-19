let provider;
let signer;
let account;
let contract;

const TOKEN_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const TOKEN_SYMBOL = "USDT";
const TOKEN_DECIMALS = 6;
const TOKEN_IMAGE = "https://cryptologos.cc/logos/tether-usdt-logo.png";

const ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)"
];

async function connect() {
  if (!window.ethereum) {
    alert("Wallet not available");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  account = await signer.getAddress();

  const network = await provider.getNetwork();
  if (network.chainId !== 11155111n) {
    alert("Please connect to Ethereum Sepolia");
    return;
  }

  await importToken();
  contract = new ethers.Contract(TOKEN_ADDRESS, ABI, signer);
  updateBalance();
}

async function importToken() {
  try {
    await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: TOKEN_ADDRESS,
          symbol: TOKEN_SYMBOL,
          decimals: TOKEN_DECIMALS,
          image: TOKEN_IMAGE
        }
      }
    });
  } catch (e) {
    console.log("Token import skipped");
  }
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
    alert("Invalid recipient");
    return;
  }

  const value = ethers.parseUnits(amount, TOKEN_DECIMALS);
  const tx = await contract.transfer(to, value);
  await tx.wait();

  updateBalance();
}

function disconnect() {
  location.reload();
}

connect();
