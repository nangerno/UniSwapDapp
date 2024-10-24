import "./style.css";
import { ethers } from "ethers";
import { abi as Mock_ABI } from "./mockABI.json";
import { abi as Weth_ABI } from "./wethABI.json";
import { abi as Factory_ABI } from "@uniswap/v2-core/build/IUniswapV2Factory.json";
import { Token, Fetcher, Route } from "@uniswap/sdk";

let provider, signer, mockContract, wethContract, factoryContract;

const connectWalletBtn = document.getElementById("connectWallet");
const walletAddressSpan = document.getElementById("walletAddress");
const tokenBalanceSpan = document.getElementById("tokenBalance");
const tokenPriceSpan = document.getElementById("tokenPrice");
const networkStatusSpan = document.getElementById("networkStatus");

async function connectWallet() {
  if (typeof window.ethereum !== "undefined") {
    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = await provider.getSigner();
      mockContract = new ethers.Contract(
        import.meta.env.TOKEN_ADDRESS,
        Mock_ABI,
        signer
      );
      wethContract = new ethers.Contract(
        import.meta.env.WETH_ADDRESS,
        Weth_ABI,
        signer
      );
      factoryContract = new ethers.Contract(
        import.meta.env.FACTORY_ADDRESS,
        Factory_ABI,
        signer
      );
      console.log("1--->");
      // const tx = await factoryContract.createPair(
      //   import.meta.env.TOKEN_ADDRESS,
      //   import.meta.env.WETH_ADDRESS
      // );
      // console.log("--->", tx);
      // await tx.wait();

      const address = await signer.getAddress();
      walletAddressSpan.textContent = address;

      await updateBalanceAndPrice();
      networkStatusSpan.textContent = "Connected to Sepolia";
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      networkStatusSpan.textContent = "Failed to connect wallet";
    }
  } else {
    networkStatusSpan.textContent = "Please install MetaMask!";
  }
}

async function updateBalanceAndPrice() {
  try {
    const balance = await mockContract.balanceOf(await signer.getAddress());
    console.log("MockUSDC Balance:", balance);
    const wethBalance = await wethContract.balanceOf(await signer.getAddress());
    console.log("WETH Balance:", ethers.formatUnits(wethBalance, 18));

    tokenBalanceSpan.textContent = ethers.formatUnits(balance, 18);
    const price = await fetchTokenPrice();
    tokenPriceSpan.textContent = price ? price.toFixed(6) : "N/A";
  } catch (error) {
    console.error("Failed to update balance and price:", error);
    tokenBalanceSpan.textContent = "Error";
    tokenPriceSpan.textContent = "Error";
  }
}

async function fetchTokenPrice() {
  try {
    const tokenDecimals = await mockContract.decimals();
    const decimalValue = Number(tokenDecimals);

    const mockToken = new Token(
      import.meta.env.SEPOLIA_CHAIN_ID,
      import.meta.env.TOKEN_ADDRESS,
      decimalValue
    );
    const weth = new Token(
      import.meta.env.SEPOLIA_CHAIN_ID,
      import.meta.env.WETH_ADDRESS,
      18
    );

    console.log("Pair data started");
    const pair = await Fetcher.fetchPairData(mockToken, weth, provider);
    console.log("Pair data fetched:", pair);

    const route = new Route([pair], weth);
    return parseFloat(route.midPrice.toSignificant(6));
  } catch (error) {
    console.error("Failed to fetch token price:", error);
    return null;
  }
}

connectWalletBtn.addEventListener("click", connectWallet);
setInterval(updateBalanceAndPrice, 30000);
