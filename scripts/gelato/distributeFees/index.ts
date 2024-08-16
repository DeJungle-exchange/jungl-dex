import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "@ethersproject/contracts";

const FeeDistributor_ABI = [
  "function distribute()",
  "function checker() external view returns (bool canExec, bytes memory execPayload)",
];

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, storage, multiChainProvider } = context;
  const provider = multiChainProvider.default();

  let isCheck;

  // Create fee distributor contract
  const feeDistributorAddress = userArgs.feeDistributor as string;
  const feeDistibutor = new Contract(
    feeDistributorAddress,
    FeeDistributor_ABI,
    provider
  );

  [isCheck] = await feeDistibutor.checker();
  if (!isCheck) {
    return {
      canExec: false,
      message: `!Active`,
    };
  }
  const blockTimestamp = (await provider.getBlock("latest")).timestamp;
  console.log("Block time", blockTimestamp);

  // Return execution call data
  return {
    canExec: true,
    callData: [
      {
        to: feeDistributorAddress,
        data: feeDistibutor.interface.encodeFunctionData("distribute", []),
      },
    ],
  };
});
