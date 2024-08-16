import fs from 'fs';
import hre from 'hardhat';

const { ethers, network } = hre;

const DAO_MULTISIG_ADDRESS = '0xE603d1b4dEC02F7c0Bcd96F4BdeBefC2Bff4e398';
const TEAM_MULTISIG_ADDRESS = '0x5d77EF27Dc3C04F51C4e834Ee2881Cac963926F1';

async function main() {
  const [signer] = await ethers.getSigners();

  const accessControlABI = [
    'function setFeeManager(address feeManager)',
    'function setOwner(address owner)',
    'function setTeam(address team)',
    'function transferOwnership(address newOwner)',
    'function grantRole(bytes32 role, address account)',
    'function revokeRole(bytes32 role, address account)',
    'function setGovernor(address governor)',
    'function setEmergencyCouncil(address council)',
  ];

  const addresses = JSON.parse(fs.readFileSync(`addresses.${network.name}.json`, 'utf-8'));

  const accessControl = new ethers.utils.Interface(accessControlABI);
  const bribeFactory = new ethers.Contract(addresses.BribeFactory, ['function BRIBE_ADMIN_ROLE() view returns (bytes32)'], signer);
  const bribeAdminRole = await bribeFactory.BRIBE_ADMIN_ROLE();

  const calls = [
    {
      target: addresses.VotingEscrow,
      callData: accessControl.encodeFunctionData('setTeam', [DAO_MULTISIG_ADDRESS]),
    },
    {
      target: addresses.RewardsDistributor,
      callData: accessControl.encodeFunctionData('setOwner', [DAO_MULTISIG_ADDRESS]),
    },
    {
      target: addresses.PairFactory,
      callData: accessControl.encodeFunctionData('setFeeManager', [DAO_MULTISIG_ADDRESS]),
    },
    {
      target: addresses.PairFactory,
      callData: accessControl.encodeFunctionData('transferOwnership', [DAO_MULTISIG_ADDRESS]),
    },
    {
      target: addresses.GaugeFactory,
      callData: accessControl.encodeFunctionData('transferOwnership', [DAO_MULTISIG_ADDRESS]),
    },
    {
      target: addresses.BribeFactory,
      callData: accessControl.encodeFunctionData('grantRole', [ethers.constants.HashZero, DAO_MULTISIG_ADDRESS]),
    },
    {
      target: addresses.BribeFactory,
      callData: accessControl.encodeFunctionData('grantRole', [bribeAdminRole, DAO_MULTISIG_ADDRESS]),
    },
    {
      target: addresses.BribeFactory,
      callData: accessControl.encodeFunctionData('revokeRole', [bribeAdminRole, signer.address]),
    },
    {
      target: addresses.BribeFactory,
      callData: accessControl.encodeFunctionData('revokeRole', [ethers.constants.HashZero, signer.address]),
    },
    {
      target: addresses.Voter,
      callData: accessControl.encodeFunctionData('setGovernor', [TEAM_MULTISIG_ADDRESS]),
    },
    {
      target: addresses.Voter,
      callData: accessControl.encodeFunctionData('setEmergencyCouncil', [DAO_MULTISIG_ADDRESS]),
    },
    /*
    {
      target: addresses.Minter,
      callData: accessControl.encodeFunctionData('setTeam', [DAO_MULTISIG_ADDRESS]),
    },
    */
    {
      target: addresses.PairAPI,
      callData: accessControl.encodeFunctionData('setOwner', [DAO_MULTISIG_ADDRESS]),
    },
    {
      target: addresses.RewardAPI,
      callData: accessControl.encodeFunctionData('setOwner', [DAO_MULTISIG_ADDRESS]),
    },
    {
      target: addresses.veNFTAPI,
      callData: accessControl.encodeFunctionData('setOwner', [DAO_MULTISIG_ADDRESS]),
    },
    {
      target: addresses.EpochController,
      callData: accessControl.encodeFunctionData('transferOwnership', [DAO_MULTISIG_ADDRESS]),
    },
  ];

  function getContractName(call) {
    for (const contract of Object.keys(addresses)) {
      if (addresses[contract] === call.target) {
        return contract;
      }
    }
    return undefined;
  }

  function getFunctionName(call) {
    const tx = accessControl.parseTransaction({ data: call.callData });
    return tx.functionFragment.name;
  }

  console.log("Dry run...\n");

  for (const call of calls) {
    const description = `${getFunctionName(call)} on ${getContractName(call)}`;
    await signer
      .estimateGas({
        to: call.target,
        data: call.callData,
      }).then(estimate => {
        console.log(`* ${description}: ${estimate.toString()}`);
      });
  }

  console.log("\nTransferring Contract Ownerships...\n");

  for (const call of calls) {
    const description = `${getFunctionName(call)} on ${getContractName(call)}`;
    await signer
      .sendTransaction({
        to: call.target,
        data: call.callData,
        maxPriorityFeePerGas: 35_000_000_000,
        maxFeePerGas: 150_000_000_000,
      })
      .then((tx) => {
        console.log(`* ${tx.hash}: ${description}`);
        return tx.wait();
      });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
