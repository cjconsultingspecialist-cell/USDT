let provider;
let signer;
let contract;

const TOKEN_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const DECIMALS = 6;

const ABI = [
  "function balanceOf(address) view returns (uint256)"
];

async function connect() {
  if (!window.ethereum) {
    alert("MetaMask not detected");
    return;
  }

  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);

  signer = provider.getSigner();

  const network = await provider.getNetwork();
  if (network.chainId !== 11155111) {
    alert("Switch MetaMask to Sepolia");
    return;
  }

  contract = new ethers.Contract(TOKEN_ADDRESS, ABI, provider);

  const account = await signer.getAddress();
  const raw = await contract.balanceOf(account);
  const bal = ethers.utils.formatUnits(raw, DECIMALS);

  document.getElementById("balance").innerText = Number(bal).toFixed(2);
  document.getElementById("usd").innerText = "$" + Number(bal).toFixed(2);
}
