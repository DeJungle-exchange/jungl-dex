import fs from 'fs';
import hre from 'hardhat';
import { EpochController__factory, VeNFTAPI__factory } from '../typechain';

const { ethers, network } = hre;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main() {
  const [signer] = await ethers.getSigners();
  /*
  for (let i = 0; i < 500; i++) {
    await network.provider.send('evm_mine');
  }
  process.exit(0)
*/
  console.log('Distributing Rewards...');

  while (true) {
    const addresses = JSON.parse(fs.readFileSync(`addresses.${network.name}.json`, 'utf-8'));
    /*
    const api = VeNFTAPI__factory.connect(addresses.veNFTAPI, signer);
    await api.getNFTFromAddress(signer.address).then(data => data.forEach(i => console.log(i)));
    process.exit(0);
*/
    const epochController = EpochController__factory.connect(addresses.EpochController, signer);
    const [canExec] = await epochController.checker();

    if (canExec) {
      await epochController
        .distribute()
        .then((tx) => {
          console.log(`${new Date()} > distributed`);
          return tx.wait();
        })
        .catch((err) => {
          console.warn(`${new Date()} ${err.reason}`);
          return sleep(5000);
        });
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
