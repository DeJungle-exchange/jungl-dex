import fs from 'fs';
import hre from 'hardhat';
import { FeeDistributor__factory } from '../typechain';

const { ethers, network } = hre;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main() {
  const [signer] = await ethers.getSigners();

  console.log('Distributing Fees...');

  /*while (true)*/ {
    const addresses = JSON.parse(fs.readFileSync(`addresses.${network.name}.json`, 'utf-8'));

    const feeDistributor = FeeDistributor__factory.connect(addresses.FeeDistributor, signer);
    const [canExec] = await feeDistributor.checker();

    if (canExec) {
      await feeDistributor.distribute().then((tx) => tx.wait());
      console.log('> distributed');
    } else {
      await sleep(5000);
      await network.provider.send('evm_mine');
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
