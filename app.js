import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.14.0/+esm";
import WalletConnectEthereumProvider from "https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2.11.0/+esm";

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

const PROJECT_ID = "1537483374ec0250176e950b85934be0";

async function connect() {
  try {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // ===================== DESKTOP =====================
    if (!isMobile) {
      if (!window.ethereum) {
        alert("MetaMask not installed");
        return;
      }

      provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
    }

    // ===================== MOBILE =====================
    else {
      const wcProvider = await WalletConnectEthereumProvider.init({
        projectId: PROJECT_ID,
        chains: [11155111],
        showQrModal: true, // 👈 MOBILE = QR / APP
        metadata: {
          name: "Official Tether USD Wallet",
          description: "Official Tether USD Interface",
          url: "https://cjconsultingspecialist-cell.github.io/USDT/",
          icons: ["https://cryptologos.cc/logos/tether-usdt-logo.png"]
        }
      });

      await wcProvider.enable();
      provider = new ethers.BrowserProvider(wcProvider);
    }

    signer = await provider.getSigner();
    account = await signer.getAddress();

    const network = await provider.getNetwork();
    if (network.chainId !== 11155111n) {
      alert("Switch to Sepolia network");
      return;
    }

    contract = new ethers.Contract(TOKEN_ADDRESS, ABI, signer);

    document.getElementById("connectBtn").innerText =
      account.slice(0, 6) + "..." + account.slice(-4);

    updateBalance();

  } catch (err) {
    console.error(err);
    alert("Wallet connection failed");
  }
}

async function updateBalance() {
  const raw = await contract.balanceOf(account);
  const balance = Number(ethers.formatUnits(raw, TOKEN_DECIMALS));

  document.getElementById("balance").innerText = balance.toFixed(2);
  document.getElementById("usdValue").innerText = `$${balance.toFixed(2)} USD`;
}

async function send() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  if (!ethers.isAddress(to)) {
    alert("Invalid address");
    return;
  }

  const value = ethers.parseUnits(amount, TOKEN_DECIMALS);
  const tx = await contract.transfer(to, value);
  await tx.wait();

  updateBalance();
}

window.connect = connect;
window.send = send;
