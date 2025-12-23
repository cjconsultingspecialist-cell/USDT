let provider;
let signer;
let account;
let usdt;

const SEPOLIA_CHAIN_ID = 11155111n;
const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const USDT_DECIMALS = 6;

const USDT_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)"
];

async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("Apri la DApp dal browser di MetaMask");
      return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    account = await signer.getAddress();

    const network = await provider.getNetwork();
    if (network.chainId !== SEPOLIA_CHAIN_ID) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }]
      });
      return;
    }

    document.getElementById("wallet").innerText =
      account.slice(0, 6) + "..." + account.slice(-4);

    document.getElementById("status").innerText =
      "● Connesso a Sepolia: " + account.slice(0, 6) + "..." + account.slice(-4);

    document.getElementById("status").classList.remove("disconnected");
    document.getElementById("status").classList.add("connected");

    usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
    updateUI();

  } catch (err) {
    console.error(err);
    alert("Errore connessione wallet");
  }
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
    alert("Indirizzo non valido");
    return;
  }

  const value = ethers.parseUnits(amount, USDT_DECIMALS);
  const tx = await usdt.transfer(to, value);
  await tx.wait();

  updateUI();
}
