// import "./style.css";
// import { ethers } from "ethers";
// import { abi as Mock_ABI } from "./mockABI.json";
// import { abi as Weth_ABI } from "./wethABI.json";
// import { abi as Factory_ABI } from "./uniswapRouterABI.json";
// import { Token, Fetcher, Route } from "@uniswap/sdk";

// let provider, signer, mockContract, wethContract, factoryContract;
// const routerAddress = import.meta.env.VITE_UNISWAP_V2_ROUTER_ADDRESS;

// const connectWalletBtn = document.getElementById("connectWallet");
// const walletAddressSpan = document.getElementById("walletAddress");
// const tokenBalanceSpan = document.getElementById("tokenBalance");
// const tokenPriceSpan = document.getElementById("tokenPrice");
// const networkStatusSpan = document.getElementById("networkStatus");

// console.log("--->", import.meta.env);

// async function connectWallet() {
//   if (typeof window.ethereum !== "undefined") {
//     try {
//       provider = new ethers.BrowserProvider(window.ethereum);
//       await provider.send("eth_requestAccounts", []);
//       signer = await provider.getSigner();
//       mockContract = new ethers.Contract(
//         import.meta.env.VITE_TOKEN_ADDRESS,
//         Mock_ABI,
//         signer
//       );
//       wethContract = new ethers.Contract(
//         import.meta.env.VITE_WETH_ADDRESS,
//         Weth_ABI,
//         signer
//       );
//       factoryContract = new ethers.Contract(
//         import.meta.env.FACTORY_ADDRESS,
//         Factory_ABI,
//         signer
//       );

//       const tx = await factoryContract.createPair(
//         import.meta.env.TOKEN_ADDRESS,
//         import.meta.env.WETH_ADDRESS
//       );

//       await tx.wait();
//       console.log("--->", tx);

//       const address = await signer.getAddress();
//       walletAddressSpan.textContent = address;

//       await updateBalanceAndPrice();
//       networkStatusSpan.textContent = "Connected to Sepolia";
//     } catch (error) {
//       console.error("Failed to connect wallet:", error);
//       networkStatusSpan.textContent = "Failed to connect wallet";
//     }
//   } else {
//     networkStatusSpan.textContent = "Please install MetaMask!";
//   }
// }

// async function updateBalanceAndPrice() {
//   try {
//     const balance = await mockContract.balanceOf(await signer.getAddress());
//     console.log("MockUSDC Balance:", balance);
//     const wethBalance = await wethContract.balanceOf(await signer.getAddress());
//     console.log("WETH Balance:", ethers.formatUnits(wethBalance, 18));

//     tokenBalanceSpan.textContent = ethers.formatUnits(balance, 18);
//     const price = await fetchTokenPrice();
//     tokenPriceSpan.textContent = price ? price.toFixed(6) : "N/A";
//   } catch (error) {
//     console.error("Failed to update balance and price:", error);
//     tokenBalanceSpan.textContent = "Error";
//     tokenPriceSpan.textContent = "Error";
//   }
// }

// async function fetchTokenPrice() {
//   try {
//     const tokenDecimals = await mockContract.decimals();
//     const decimalValue = Number(tokenDecimals);

//     const mockToken = new Token(
//       import.meta.env.VITE_SEPOLIA_CHAIN_ID,
//       import.meta.env.VITE_TOKEN_ADDRESS,
//       decimalValue
//     );
//     const weth = new Token(
//       import.meta.env.VITE_SEPOLIA_CHAIN_ID,
//       import.meta.env.VITE_WETH_ADDRESS,
//       18
//     );

//     console.log("Pair data started");
//     const pair = await Fetcher.fetchPairData(mockToken, weth, provider);
//     console.log("Pair data fetched:", pair);

//     const route = new Route([pair], weth);
//     return parseFloat(route.midPrice.toSignificant(6));
//   } catch (error) {
//     console.error("Failed to fetch token price:", error);
//     return null;
//   }
// }

// connectWalletBtn.addEventListener("click", connectWallet);
// setInterval(updateBalanceAndPrice, 30000);

import "./style.css";
import { ethers } from "ethers";
import { abi as Mock_ABI } from "./mockABI.json";
import Router_ABI from "./uniswapRouterABI.json";

// Contract addresses from environment variables
const mockUSDCAddress = import.meta.env.VITE_MOCK_USDC_ADDRESS;
const routerAddress = import.meta.env.VITE_UNISWAP_V2_ROUTER_ADDRESS;

// Initialize provider and wallet
let provider, wallet;
console.log("VITE_PRIVATE_KEY:", import.meta.env.VITE_PRIVATE_KEY);
async function init() {
  if (typeof window.ethereum !== "undefined") {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []); // Request access to accounts
    const privateKey = import.meta.env.VITE_PRIVATE_KEY;
    console.log("Private Key:", privateKey);
    wallet = new ethers.Wallet(privateKey, provider);

    // Ensure router address is checksummed
    const checksummedRouterAddress = ethers.utils.getAddress(routerAddress);
    console.log("Checksummed Router Address:", checksummedRouterAddress);

    // Execute liquidity addition
    await addLiquidity(checksummedRouterAddress);
  } else {
    console.error("Please install MetaMask!");
  }
}

async function addLiquidity(checksummedRouterAddress) {
  try {
    // Initialize MockUSDC contract
    const mockUSDC = new ethers.Contract(mockUSDCAddress, Mock_ABI, wallet);

    // Amounts to use in liquidity pool
    const tokenAmount = ethers.utils.parseUnits("1000", 18); // 1000 MockUSDC
    const ethAmount = ethers.utils.parseEther("0.1"); // 0.1 ETH

    // Step 1: Approve Router to spend MockUSDC
    const approvalTx = await mockUSDC.approve(
      checksummedRouterAddress,
      tokenAmount
    );
    await approvalTx.wait();
    console.log("Approved Uniswap Router to spend MockUSDC");

    // Step 2: Add Liquidity
    const routerContract = new ethers.Contract(
      checksummedRouterAddress,
      Router_ABI,
      wallet
    );
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10-minute deadline

    const addLiquidityTx = await routerContract.addLiquidityETH(
      mockUSDCAddress,
      tokenAmount,
      0, // Minimum amount of MockUSDC (to handle slippage)
      0, // Minimum amount of ETH (to handle slippage)
      wallet.address, // Recipient of LP tokens
      deadline,
      { value: ethAmount } // ETH to send
    );

    const receipt = await addLiquidityTx.wait();
    console.log("Liquidity added, transaction hash:", receipt.transactionHash);
  } catch (error) {
    console.error("Error adding liquidity:", error);
  }
}

// Execute the initialization function
init().catch(console.error);
