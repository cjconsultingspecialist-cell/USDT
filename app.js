async function connect() {
  try {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // ================= DESKTOP =================
    if (!isMobile && window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
    }
    // ================= MOBILE =================
    else {
      const wcProvider = await WalletConnectEthereumProvider.init({
        projectId: "1537483374ec0250176e950b85934be0",
        chains: [11155111],
        showQrModal: false, // 🔴 NIENTE QR
        metadata: {
          name: "Official Tether USD Wallet",
          description: "Institutional Tether USD Interface",
          url: "https://cjconsultingspecialist-cell.github.io/USDT/",
          icons: ["https://cryptologos.cc/logos/tether-usdt-logo.png"]
        }
      });

      // 🔴 QUESTO FORZA L’APERTURA DELL’APP WALLET
      await wcProvider.connect({
        chains: [11155111],
        optionalChains: [],
        rpcMap: {}
      });

      provider = new ethers.BrowserProvider(wcProvider);
    }

    signer = await provider.getSigner();
    account = await signer.getAddress();

    const network = await provider.getNetwork();
    if (network.chainId !== 11155111n) {
      alert("Please switch to Ethereum Sepolia");
      return;
    }

    contract = new ethers.Contract(TOKEN_ADDRESS, ABI, signer);

    document.getElementById("connectBtn").innerText =
      account.slice(0, 6) + "..." + account.slice(-4);

    updateBalance();

  } catch (e) {
    console.error(e);
    alert("Wallet connection failed");
  }
}
