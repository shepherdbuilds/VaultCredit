const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  VaultCredit Deployment");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Network  :", hre.network.name);
  console.log("Deployer :", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance  :", hre.ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("\n⚠  Deployer has zero balance. Fund with Sepolia ETH before deploying.");
    process.exit(1);
  }

  console.log("\nDeploying VaultCredit...");
  const VaultCredit = await hre.ethers.getContractFactory("VaultCredit");
  const vaultCredit = await VaultCredit.deploy();

  console.log("Waiting for deployment transaction...");
  await vaultCredit.waitForDeployment();

  const contractAddress = await vaultCredit.getAddress();
  const deployTx = vaultCredit.deploymentTransaction();

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Deployment Successful ✓");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Contract address :", contractAddress);
  console.log("Tx hash          :", deployTx?.hash);
  console.log("Block explorer   :", `https://sepolia.etherscan.io/address/${contractAddress}`);

  console.log("\n📋 Next steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Add it to frontend/.env:");
  console.log(`   VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("3. Run the frontend:");
  console.log("   cd frontend && npm install && npm run dev");

  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nVerifying contract on Etherscan (may take 30–60 seconds)...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified ✓");
    } catch (err) {
      console.log("Verification failed (try manually):", err.message);
    }
  }
}

main().catch((error) => {
  console.error("\nDeployment failed:", error.message);
  process.exitCode = 1;
});
