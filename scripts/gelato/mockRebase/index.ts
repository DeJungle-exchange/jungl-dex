import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "@ethersproject/contracts";

const RebaseProxy_ABI = [
  "function rebase( uint256 epoch, int256 supplyDelta ) external returns (uint256)",
];

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, storage, multiChainProvider } = context;
  const provider = multiChainProvider.default();

  // Create fee distributor contract
  const rebaseProxyAddress =
    (userArgs.epoch as string) ?? "0xd856A706eF29a9170F624907f576f60f432131Ae";
  const rebaseProxy = new Contract(
    rebaseProxyAddress,
    RebaseProxy_ABI,
    provider
  );

  const blockTimestamp = (await provider.getBlock("latest")).timestamp;
  console.log("Block time", blockTimestamp);

  const rebaseAmount = "10000000000000000000000";

  // Return execution call data
  return {
    canExec: true,
    callData: [
      {
        to: rebaseProxyAddress,
        data: rebaseProxy.interface.encodeFunctionData("rebase", [
          1409,
          rebaseAmount,
        ]),
      },
    ],
  };
});
