import { createAppKit } from 'https://cdn.jsdelivr.net/npm/@reown/appkit@1.2.0/dist/appkit.esm.js';

const PROJECT_ID = '42e5e216a501f010edd0dcbf77e8bbd5';

let config;
let modal;
let signer;
let provider;

const ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

const path = p => `/USDT/${p.replace(/^\/?/,'')}`;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(path('service-worker.js'));
  });
}

async function loadConfig() {
  const res = await fetch(path('usdt.json'));
  config = await res.json();
  initUI();
  initWallets();
}

function initUI() {
  document.title = `${config.asset.symbol} | Asset Wallet`;
  document.getElementById('tokenName').innerText = config.asset.name;
  document.getElementById('tokenLogo').src = config.asset.logoURI;
  document.getElementById('favicon').href = config.asset.logoURI;
  document.getElementById('explorer').href =
    `${config.network_config.explorer_url}/address/${config.asset.address}`;
}

function initWallets() {
  modal = createAppKit({
    projectId: PROJECT_ID,
    networks: [{
      id: `eip155:${config.chainId}`,
      name: 'Ethereum',
      rpcUrl: config.network_config.rpc_url,
      currency: 'ETH'
    }],
    features: { analytics: false, socials: false, email: false }
  });

  document.getElementById('connectBtn').onclick = async () => {
    if (window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
    } else {
      await modal.open();
      provider = new ethers.BrowserProvider(modal.getWalletProvider());
    }
    await onConnected();
  };

  document.getElementById('sendBtn').onclick = sendTokens;
}

async function onConnected() {
  signer = await provider.getSigner();
  const address = await signer.getAddress();

  document.getElementById('walletLabel').innerText =
    `${address.slice(0,6)}...${address.slice(-4)}`;
  document.getElementById('statusDot').classList.add('online');
  document.getElementById('connectBtn').innerText = 'Wallet Connected';

  document.getElementById('sendArea').style.display = 'block';
  document.getElementById('sendBtn').style.display = 'block';

  await updateBalance();
}

async function updateBalance() {
  const contract = new ethers.Contract(config.asset.address, ABI, provider);
  const addr = await signer.getAddress();

  const raw = await contract.balanceOf(addr);
  const value = ethers.formatUnits(raw, config.asset.decimals);

  document.getElementById('balance').innerText =
    Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 });

  document.getElementById('usdValue').innerText =
    `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`;
}

async function sendTokens() {
  const to = document.getElementById('recipient').value;
  const amount = document.getElementById('amount').value;

  const contract = new ethers.Contract(config.asset.address, ABI, signer);
  const parsed = ethers.parseUnits(amount, config.asset.decimals);

  const tx = await contract.transfer(to, parsed);
  await tx.wait();

  await updateBalance();
}

loadConfig();
