import { getPolygonSdk, getPolygonMumbaiSdk } from "@dethcrypto/eth-sdk-client";
import { deploy, deployWithProxy } from "./utils/deployment";
import {
  BribeFactory__factory,
  Bribe__factory,
  EpochController__factory,
  ERC20Mintable__factory,
  ERC20__factory,
  FeeDistributor__factory,
  GaugeFactory__factory,
  Gauge__factory,
  Minter__factory,
  PairAPI__factory,
  PairFactory__factory,
  Jungl__factory,
  RewardAPI__factory,
  RewardsDistributor__factory,
  Router__factory,
  VeArtProxy__factory,
  VeNFTAPI__factory,
  Voter__factory,
  VotingEscrow__factory,
} from "../typechain";

import fs from "fs";
import hre from "hardhat";

const { ethers, network } = hre;

const addresses = fs.existsSync(`addresses.${network.name}.json`)
  ? JSON.parse(fs.readFileSync(`addresses.${network.name}.json`, "utf-8"))
  : {};

async function main() {
  const [signer] = await ethers.getSigners();

  console.log("Deploying Contracts...");

  let USDC, zUSD, WETH, ZU, rebaseProxy;

  const rebaseProxyABI = [
    "function voter() view returns (address)",
    "function setVoter(address voter)",
  ];

  if (["hardhat", "localhost"].includes(network.name)) {
    // await network.provider.send("evm_setIntervalMining", [3000]);
    fs.writeFileSync(`addresses.${network.name}.json`, "{}", "utf-8");

    USDC = await deployWithProxy("ERC20Mintable", "USDC", [
      "USD Coin (PoS)",
      "USDC",
      6,
    ]).then((c) => c.address);
    zUSD = await deployWithProxy("ERC20Mintable", "zUSD", [
      "Jungle USD",
      "zUSD",
      18,
    ]).then((c) => c.address);

    WETH = await deployWithProxy("ERC20Mintable", "WETH", [
      "Wrapped Ether",
      "WETH",
      18,
    ]).then((c) => c.address);

    rebaseProxy = new ethers.Contract(
      ethers.constants.AddressZero,
      rebaseProxyABI,
      signer
    );
  } else if (network.name === "baseSepolia") {
    WETH = addresses.WETH;
    zUSD = addresses.zUSD;
    USDC = addresses.USDC;
    ZU = addresses.ZU;
  } else {
    WETH = addresses.WETH;
    zUSD = addresses.zUSD;
    USDC = addresses.USDC;
    ZU = addresses.ZU;
  }

  const latest = await signer.getTransactionCount("latest");
  const pending = await signer.getTransactionCount("pending");

  console.log(latest);
  console.log(pending);

  if (latest < pending) {
    await signer.sendTransaction({
      to: ethers.constants.AddressZero,
      value: 0,
      nonce: latest,
    });
    process.exit(0);
  }

  const jungl = Jungl__factory.connect(addresses.JUNGL, signer);

  // if (["hardhat", "localhost", "baseSepolia"].includes(network.name)) {
  //   const jungl = await deployWithProxy("Jungl", "JUNGL", [], {
  //     call: { fn: "initialize" },
  //   });

  //   /*const jungl = await deployWithProxy('Jungl', 'JUNGL', [], { call: { fn: 'reinitialize', args: [signer.address] } }).then((contract) =>
  //   Jungle__factory.connect(contract.address, signer),
  //   );*/

  //   if (ethers.constants.Zero.eq(await jungl.balanceOf(addresses.Team))) {
  //     await jungl
  //       .mint(addresses.Team, ethers.utils.parseEther("500000000"))
  //       .then((tx) => tx.wait());
  //     console.log(
  //       "Minting",
  //       await jungl.balanceOf(addresses.Team),
  //       "jungl tokens to",
  //       addresses.Team
  //     );
  //   }
  // }

  const defaultPoolTokens = [jungl.address, USDC, zUSD, WETH, ZU];
  const defaultRewardTokens = [jungl.address, USDC, WETH, ZU];

  const veArtProxy = await deployWithProxy("VeArtProxy").then((contract) =>
    VeArtProxy__factory.connect(contract.address, signer)
  );
  // const veJungle = await deploy('VotingEscrow', [jungl.address, veArtProxy.address]);
  const veJungle = await deployWithProxy("VotingEscrow", [
    jungl.address,
    veArtProxy.address,
  ]).then((contract) =>
    VotingEscrow__factory.connect(contract.address, signer)
  );

  const rewardsDistributor = await deployWithProxy("RewardsDistributor", [
    veJungle.address,
  ]).then((contract) =>
    RewardsDistributor__factory.connect(contract.address, signer)
  );

  const pairLibraryAddress = await deploy("Pair").then(
    (contract) => contract.address
  );

  // factories
  const pairFactory = await deployWithProxy("PairFactory", [
    pairLibraryAddress,
  ]).then((contract) => PairFactory__factory.connect(contract.address, signer));

  if (
    await pairFactory.pairImplementation().then((p) => p !== pairLibraryAddress)
  ) {
    await pairFactory
      .setPairImplementationAddress(pairLibraryAddress)
      .then((tx) => tx.wait());
  }

  const singleTokenLiquidityProvider = await deployWithProxy(
    "SingleTokenLiquidityProvider",
    [pairFactory.address, false]
  );

  const restrictedSingleTokenLiquidityProvider = await deployWithProxy(
    "SingleTokenLiquidityProvider",
    "RestrictedSingleTokenLiquidityProvider",
    [pairFactory.address, true]
  );

  const GaugeLibAddress = await deploy("Gauge").then(
    (contract) => contract.address
  );

  const BribeLibAddress = await deploy("Bribe").then(
    (contract) => contract.address
  );

  const gaugeFactory = await deployWithProxy("GaugeFactory", [
    GaugeLibAddress,
  ]).then((contract) =>
    GaugeFactory__factory.connect(contract.address, signer)
  );

  const bribeFactory = await deployWithProxy("BribeFactory", [
    ethers.constants.AddressZero, // voter
    BribeLibAddress,
    defaultRewardTokens, // default reward tokens
  ]).then((contract) =>
    BribeFactory__factory.connect(contract.address, signer)
  );

  // voter
  const voter = await deployWithProxy(
    "Voter",
    "Voter",
    [
      veJungle.address,
      pairFactory.address,
      gaugeFactory.address,
      bribeFactory.address,
    ],
    { call: { fn: "reinitialize" } }
  ).then((contract) => Voter__factory.connect(contract.address, signer));

  if (await veJungle.voter().then((v) => v !== voter.address)) {
    await veJungle.setVoter(voter.address).then((tx) => tx.wait());
  }

  if (await voter.bribefactory().then((f) => f !== bribeFactory.address)) {
    await voter.setBribeFactory(bribeFactory.address).then((tx) => tx.wait());
  }

  if (await voter.gaugefactory().then((f) => f !== gaugeFactory.address)) {
    await voter.setGaugeFactory(gaugeFactory.address).then((tx) => tx.wait());
  }

  if (await voter.factory().then((f) => f !== pairFactory.address)) {
    await voter.setPairFactory(pairFactory.address).then((tx) => tx.wait());
  }

  if (await voter.zusd().then((u) => u !== zUSD)) {
    await voter.setZUSD(zUSD).then((tx) => tx.wait());
  }

  if (await voter._ve().then((v) => v !== veJungle.address)) {
    await voter.setVotingEscrow(veJungle.address).then((tx) => tx.wait());
  }

  const whitelist: string[] = [];
  for (const defaultPoolToken of defaultPoolTokens) {
    if (!(await voter.isWhitelisted(defaultPoolToken))) {
      whitelist.push(defaultPoolToken);
    }
  }

  if (whitelist.length > 0) {
    await voter["whitelist(address[])"](whitelist).then((tx) => tx.wait()); // tokens whitelisted for pool creation
  }

  if (await bribeFactory.voter().then((v) => v !== voter.address)) {
    await bribeFactory.setVoter(voter.address).then((tx) => tx.wait());
  }

  // minter
  const minter = await deployWithProxy(
    "Minter",
    "Minter",
    [voter.address, veJungle.address, rewardsDistributor.address],
    {
      call: { fn: "reinitialize" },
    }
  ).then((contract) => Minter__factory.connect(contract.address, signer));

  if (await jungl.minter().then((m) => m !== minter.address)) {
    console.log("updating minter on jungl");
    await jungl.setMinter(minter.address).then((tx) => tx.wait());
  }

  if (await voter.minter().then((m) => m !== minter.address)) {
    console.log("updating minter on voter");
    await voter.setMinter(minter.address).then((tx) => tx.wait());
  }

  if (await rewardsDistributor.depositor().then((d) => d !== minter.address)) {
    await rewardsDistributor
      .setDepositor(minter.address)
      .then((tx) => tx.wait());
  }

  if (await minter._voter().then((v) => v !== voter.address)) {
    console.log("updating voter on minter");
    await minter.setVoter(voter.address).then((tx) => tx.wait());
  }

  // API
  const pairAPI = await deployWithProxy("PairAPI", [voter.address]).then(
    (contract) => PairAPI__factory.connect(contract.address, signer)
  );
  const rewardAPI = await deployWithProxy("RewardAPI", [voter.address]).then(
    (contract) => RewardAPI__factory.connect(contract.address, signer)
  );

  const veNFTAPI = await deployWithProxy("veNFTAPI", [
    voter.address,
    rewardsDistributor.address,
    pairAPI.address,
    pairFactory.address,
  ]).then((contract) => VeNFTAPI__factory.connect(contract.address, signer));

  if (await veJungle.api().then((v) => v !== veNFTAPI.address)) {
    await veJungle.setAPI(veNFTAPI.address).then((tx) => tx.wait());
  }

  if (await pairAPI.voter().then((v) => v !== voter.address)) {
    await pairAPI.setVoter(voter.address).then((tx) => tx.wait());
  }

  if (await rewardAPI.voter().then((v) => v !== voter.address)) {
    await rewardAPI.setVoter(voter.address).then((tx) => tx.wait());
  }

  if (await veNFTAPI.voter().then((v) => v !== voter.address)) {
    await veNFTAPI.setVoter(voter.address).then((tx) => tx.wait());
  }

  if (await veNFTAPI.ve().then((v) => v !== veJungle.address)) {
    await veNFTAPI.setVotingEscrow(veJungle.address).then((tx) => tx.wait());
  }

  // others
  const epochController = await deployWithProxy("EpochController", [
    minter.address,
    voter.address,
  ]).then((contract) => {
    const instance = EpochController__factory.connect(contract.address, signer);
    (instance as any).newlyDeployed = contract.newlyDeployed;
    return instance;
  });

  if (await epochController.voter().then((v) => v !== voter.address)) {
    await epochController.setVoter(voter.address).then((tx) => tx.wait());
  }

  if (await epochController.minter().then((m) => m !== minter.address)) {
    await epochController.setMinter(minter.address).then((tx) => tx.wait());
  }

  if (
    await voter.epochController().then((m) => m !== epochController.address)
  ) {
    await voter
      .setEpochController(epochController.address)
      .then((tx) => tx.wait());
  }

  const feeDistributor = await deployWithProxy("FeeDistributor", [
    pairFactory.address,
    voter.address,
  ]).then((contract) =>
    FeeDistributor__factory.connect(contract.address, signer)
  );

  if (await feeDistributor.voter().then((v) => v !== voter.address)) {
    await feeDistributor.setVoter(voter.address).then((tx) => tx.wait());
  }

  if (
    await feeDistributor.pairFactory().then((m) => m !== pairFactory.address)
  ) {
    await feeDistributor
      .setPairFactory(pairFactory.address)
      .then((tx) => tx.wait());
  }

  const router = await deploy("Router", [
    pairFactory.address,
    pairLibraryAddress,
    WETH,
  ]).then((contract) => Router__factory.connect(contract.address, signer));

  const pools = [
    {
      token0: USDC,
      token1: zUSD,
      isStable: true,
    },
    {
      token0: USDC,
      token1: ZU,
      isStable: false,
    },
    {
      token0: zUSD,
      token1: jungl.address,
      isStable: false,
    },
  ];

  for (const pool of pools) {
    console.log(
      `Creating pair and gauge for ${pool.token0} - ${pool.token1} ...`
    );

    try {
      await pairFactory
        .createPair(pool.token0, pool.token1, pool.isStable)
        .then((tx) => tx.wait());
    } catch {}

    try {
      const pair = await pairFactory.getPair(
        pool.token0,
        pool.token1,
        pool.isStable
      );
      await voter.createGauge(pair).then((tx) => tx.wait());
    } catch {}
  }

  process.exit(0);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
