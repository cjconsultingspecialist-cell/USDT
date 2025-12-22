let provider, signer, account, usdtContract;
const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const DECIMALS = 6;
const USDT_ABI = ["function balanceOf(address) view returns (uint256)", "function transfer(address,uint256) returns (bool)"];
const SEPOLIA_ID = "0xaa36a7";

async function connectWallet() {
    if (!window.ethereum) return alert("Install MetaMask");
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    account = await signer.getAddress();

    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(11155111)) {
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA_ID }] });
    }

    usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
    document.getElementById("wallet").innerText = account.slice(0,6) + "..." + account.slice(-4);
    document.getElementById("to").disabled = false;
    document.getElementById("amount").disabled = false;
    document.getElementById("sendButton").disabled = false;
    updateUI();
}

async function updateUI() {
    const raw = await usdtContract.balanceOf(account);
    const balance = ethers.formatUnits(raw, DECIMALS);
    document.getElementById("balance").innerText = Number(balance).toFixed(2);
    document.getElementById("usdValue").innerText = "$" + Number(balance).toFixed(2) + " USD";
}

async function sendUSDT() {
    const to = document.getElementById("to").value;
    const amount = document.getElementById("amount").value;
    const btn = document.getElementById("sendButton");
    try {
        btn.disabled = true;
        btn.innerText = "Sending...";
        const tx = await usdtContract.transfer(to, ethers.parseUnits(amount, DECIMALS));
        await tx.wait();
        alert("Success!");
        updateUI();
    } catch (e) {
        alert("Error: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Send";
    }
}
