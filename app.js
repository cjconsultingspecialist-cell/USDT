// app.js – Versione Originale (Web3.js)

let account;
let contract;
let autoRefreshInterval;
let chart;

// === CONFIGURAZIONE ===
const contractAddress = "0x1eB20Afd64393EbD94EB77FC59a6a24a07f8A93D";
const tokenSymbol = "USDT";
const tokenDecimals = 6;
const tokenImageURL = "cryptologos.cc"; // Link corretto
const networkId = "0xaa36a7"; // Sepolia

// === 🔹 SNACKBAR ===
function showSnackbar(msg, color="#323232"){
  const s=document.getElementById("snackbar");
  if(!s) return;
  s.innerText=msg; s.style.backgroundColor=color;
  s.className="show"; setTimeout(()=>s.className=s.className.replace("show",""),3000);
}

// === 🔹 CONNESSIONE ===
async function connectWallet(){
  try{
    if(!window.ethereum) return showSnackbar("MetaMask non rilevato!","#e74c3c");
    const acc=await window.ethereum.request({method:"eth_requestAccounts"});
    account=acc[0];
    document.getElementById("walletAddress").innerText="Wallet: "+account;
    updateStatus(true);

    const chainId=await window.ethereum.request({method:"eth_chainId"});
    if(chainId.toLowerCase()!==networkId){
      showSnackbar("Cambia rete in Sepolia!","#f39c12");updateStatus(false);return;
    }

    const web3=new Web3(window.ethereum);
    // Assicurati di avere il file usdt.json
    const abi=await(await fetch("usdt.json")).json(); 
    contract=new web3.eth.Contract(abi,contractAddress);
    showSnackbar("✅ Wallet connesso!","#2ecc71");
    await refreshBalance();
    if(!autoRefreshInterval){autoRefreshInterval=setInterval(refreshBalance,15000);}
  }catch(e){
    console.error(e);showSnackbar("Errore connessione","#e74c3c");
    updateStatus(false);
  }
}

// === 🔹 REFRESH SALDO + GRAFICO ===
async function refreshBalance(){
  if(!contract||!account)return;
  try{
    const balance=await contract.methods.balanceOf(account).call();
    // Non serve chiamare decimals() ogni volta se è fisso a 6
    const tokenBal=Number(balance)/10**tokenDecimals;

    const web3=new Web3(window.ethereum);
    const ethBal=Number(await web3.eth.getBalance(account))/1e18;

    document.getElementById("balance").innerText=`${tokenBal.toFixed(4)} ${tokenSymbol}`;
    updateChart(tokenBal,ethBal);
  }catch(e){console.warn("aggiorna saldo:",e);}
}

// === 🔹 GRAFICO ===
function updateChart(tokenBal,ethBal){
  const ctx=document.getElementById("chartBalance");
  const data=[tokenBal,ethBal];
  const labels=[`${tokenSymbol} Token`,`ETH Gas`];
  const colors=["#27ae60","#1a73e8"];
  if(chart){chart.data.datasets[0].data=data;chart.update();return;}
  chart=new Chart(ctx,{type:"doughnut",
    data:{labels:labels,
      datasets:[{data:data,backgroundColor:colors,borderWidth:2,hoverOffset:10}]
    },
    options:{plugins:{legend:{position:"bottom",labels:{color:"#333",font:{size:14}}}},
      cutout:"65%"
    }
  });
}

// === 🔹 MOSTRA SALDO MANUALE ===
async function getBalance(){
  if(!contract||!account)return showSnackbar("Connetti prima MetaMask","#f39c12");
  await refreshBalance();showSnackbar("💰 Saldo aggiornato!","#3498db");
}

// === 🔹 INVIA TOKEN ===
async function sendTokens(){
  if(!contract||!account)return showSnackbar("Connetti prima MetaMask","#f39c12");
  const to=document.getElementById("recipient").value.trim();
  const amount=document.getElementById("amount").value.trim();
  if(!to||!amount)return showSnackbar("Inserisci dati validi","#f39c12");
  try{
    const val=(amount*10**tokenDecimals).toString();
    showSnackbar("⏳ Invio in corso...","#3498db");
    const tx=await contract.methods.transfer(to,val).send({from:account});
    console.log(tx);
    showSnackbar(`✅ ${amount} ${tokenSymbol} inviati!`,"#2ecc71");
    await refreshBalance();
  }catch(e){console.error(e);showSnackbar("Errore transazione","#e74c3c");}
}

// === 🔹 MOSTRA INDIRIZZO ===
function showAddress(){
  if(!account)return showSnackbar("Connetti prima MetaMask","#f39c12");
  navigator.clipboard.writeText(account);
  showSnackbar("📋 Indirizzo copiato!","#3498db");
}

// === 🔹 AGGIUNGI TOKEN ===
async function addToken(){
  try{
    const wasAdded=await window.ethereum.request({
      method:"wallet_watchAsset",
      params:{type:"ERC20",options:{
        address:contractAddress,symbol:tokenSymbol,decimals:tokenDecimals,image:tokenImageURL}} // Usa il link corretto
    });
    showSnackbar(wasAdded?`🪙 ${tokenSymbol} aggiunto!`:"❌ Aggiunta annullata",
      wasAdded?"#2ecc71":"#e74c3c");
  }catch(e){console.error(e);showSnackbar("Errore aggiunta token","#e74c3c");}
}

// === 🔹 INDICATORE ===
function updateStatus(c){
  const s=document.getElementById("statusLight");
  if(!s)return;
  if(c){s.style.background="#2ecc71";s.innerText="● Connesso";}
  else{s.style.background="#e74c3c";s.innerText="● Disconnesso";}
}

// === 🔹 EVENTI METAMASK ===
if(window.ethereum){
  window.ethereum.on("accountsChanged",async acc=>{
    if(acc.length===0){account=null;updateStatus(false);
      document.getElementById("walletAddress").innerText="Wallet Disconnesso";
      showSnackbar("Disconnesso da MetaMask","#e74c3c");
      if(chart){chart.destroy();chart=null;}
      clearInterval(autoRefreshInterval);autoRefreshInterval=null;
    }else{
      account=acc[0];updateStatus(true);
      document.getElementById("walletAddress").innerText="Wallet: "+account;
      showSnackbar("✅ Account cambiato","#3498db");await refreshBalance();
    }
  });
  window.ethereum.on("chainChanged",id=>{
    if(id.toLowerCase()!==networkId){
      showSnackbar("⚠️ Rete non supportata","#f39c12");
      updateStatus(false);if(chart){chart.destroy();chart=null;}
      clearInterval(autoRefreshInterval);autoRefreshInterval=null;
    }else connectWallet();
  });
}

// === 🔹 ASSOCIAZIONI ===
window.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("connectButton").addEventListener("click",connectWallet);
  document.getElementById("balanceButton").addEventListener("click",getBalance);
  document.getElementById("sendButton").addEventListener("click",sendTokens);
  document.getElementById("addressButton").addEventListener("click",showAddress);
  document.getElementById("addTokenButton").addEventListener("click",addToken);
  updateStatus(false);
});
