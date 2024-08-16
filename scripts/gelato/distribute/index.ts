import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "@ethersproject/contracts";

const EPOCH_ABI = [
  "function distribute()",
  "function checker() external view returns (bool canExec, bytes memory execPayload)",
];
const MINTER_ABI = [
  "function check() external view returns (bool)",
  "function nextPeriod() external view returns (uint256)",
];

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, storage, multiChainProvider } = context;
  const provider = multiChainProvider.default();

  // Create epoch & minter contract
  const epochCtrlAddress = userArgs.epoch as string;

  const minterAddress = userArgs.minter as string;

  let isCheck;
  let epoch;
  let minter;
  let nextPeriod;

  // Retrieve nextPeriod and check from minter
  try {
    epoch = new Contract(epochCtrlAddress, EPOCH_ABI, provider);
    [isCheck] = await epoch.checker();

    minter = new Contract(minterAddress, MINTER_ABI, provider);
    nextPeriod = parseInt(await minter.nextPeriod());
  } catch (err) {
    return { canExec: false, message: `Rpc call failed` };
  }

  //current timestamp
  const blockTimestamp = (await provider.getBlock("latest")).timestamp;
  const timestamp = Math.ceil(new Date().getTime() / 1000);

  console.log(
    "Next period",
    nextPeriod,
    "Block time",
    blockTimestamp,
    "timestamp",
    timestamp
  );

  // Check if minter is ready for reward distribution
  if (!isCheck) {
    return {
      canExec: false,
      message: `!Active, next period in ${Math.ceil(
        (nextPeriod - timestamp) / 60
      )} min; last blockTransaction ${Math.ceil(
        Math.abs(blockTimestamp - timestamp) / 60
      )} min ago`,
    };
  }

  // Return execution call data
  return {
    canExec: true,
    callData: [
      {
        to: epochCtrlAddress,
        data: epoch.interface.encodeFunctionData("distribute", []),
      },
    ],
  };
});
