import fs from 'fs';
import hre from 'hardhat';

const { ethers, network } = hre;

async function main() {
  const [signer] = await ethers.getSigners();

  const addressFile = `addresses.${network.name}.json`;
  const addresses = JSON.parse(fs.readFileSync(addressFile, 'utf-8'));

  const minter = await ethers.getContractAt('Minter', addresses.MinterUpgradeable, signer);
  await minter._initialize();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
