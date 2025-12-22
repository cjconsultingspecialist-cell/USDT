let provider, signer, account, usdtContract;
const USDT_ADDRESS = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const DECIMALS = 6;
const USDT_ABI = ["function balanceOf(address) view returns (uint256)", "function transfer(address,uint256) returns (bool)"];
const SEPOLIA_ID = "0xaa36a7"; // 11155111 in decimale

async function connectWallet() {
    if (!window.ethereum) return alert("Per favore, installa MetaMask o usa un browser DApp.");
    
    try {
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
        document.getElementById("connectButton").style.display = 'none'; // Nasconde il pulsante Connect
        document.getElementById("to").disabled = false;
        document.getElementById("amount").disabled = false;
        document.getElementById("sendButton").disabled = false;
        updateUI();

    } catch (error) {
        console.error("Connection error:", error);
        alert("Impossibile connettersi: " + error.message);
    }
}

async function updateUI() {
    if (!usdtContract || !account) return;
    try {
        const raw = await usdtContract.balanceOf(account);
        const balance = ethers.formatUnits(raw, DECIMALS);
        document.getElementById("balance").innerText = Number(balance).toFixed(2);
        document.getElementById("usdValue").innerText = "$" + Number(balance).toFixed(2) + " USD";
    } catch (e) {
        document.getElementById("balance").innerText = "Error";
    }
}

async function sendUSDT() {
    const to = document.getElementById("to").value;
    const amount = document.getElementById("amount").value;
    const btn = document.getElementById("sendButton");
    if (!ethers.isAddress(to)) return alert("Indirizzo non valido.");

    try {
        btn.disabled = true;
        btn.innerText = "Sending...";
        const value = ethers.parseUnits(amount, DECIMALS);
        const tx = await usdtContract.transfer(to, value);
        await tx.wait();
        alert("Transazione completata!");
        updateUI();
        document.getElementById("amount").value = '';

    } catch (e) {
        console.error(e);
        alert("Errore durante l'invio: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Send";
    }
}
