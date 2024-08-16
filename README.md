# DeJungle Dex

This is Jungle's public contract repository

```
npm install
npx eth-sdk
npx hardhat compile
```

_Deployment_

```
npx hardhat run scripts/deploy.ts --network NETWORK
npm run create-task:gauge-tracker -- --network NETWORK
npx hardhat run scripts/init.ts --network NETWORK

npx hardhat deploy --network {network} --tags all --export meta/{network}.json

```
