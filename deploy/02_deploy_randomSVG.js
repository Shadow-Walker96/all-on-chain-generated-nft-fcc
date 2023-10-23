const { ethers } = require("hardhat")
let { networkConfig } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = await getChainId()

    // If we are on a local chain like hardhat, what is the link token address?
    // A. There is none. So what do we do, is to deploy a fake one
    // But for real chain we use the real ones
    let linkTokenAddress, vrfCoordinatorAddress

    if (chainId == 31337) {
        // means we are on a local chain
        let linkToken = await get("LinkToken") // get means to get the contract
        linkTokenAddress = linkToken.address
        let vrfCoordinatorMock = await get("VRFCoordinatorMock")
        vrfCoordinatorAddress = vrfCoordinatorMock.address
    } else {
        linkTokenAddress = networkConfig[chainId]["linkToken"]
        vrfCoordinatorAddress = networkConfig[chainId]["vrfCoordinatorV2"]
    }

    // Here if we are on the local network, we dont need to place
    // keyHash and fee in an if statement
    const keyhash = networkConfig[chainId]["keyHash"]
    const fee = networkConfig[chainId]["fee"]

    let args = [vrfCoordinatorAddress, linkTokenAddress, keyhash, fee]

    log("--------------------------------------------------")

    const RandomSVG = await deploy("RandomSVG", {
        from: deployer,
        args: args,
        log: true,
    })

    log("You have deployed your NFT contract!")

    const networkName = networkConfig[chainId]["name"]
    log(
        `Verify with: \n npx hardhat verify --network ${networkName} ${RandomSVG.address} ${args
            .toString()
            .replace(/,/g, " ")}`
    )

    // We want to interact with our contract
    // fund with LINK Token
    const linkTokenContract = await ethers.getContractFactory("LinkToken")
    const accounts = await hre.ethers.getSigners()
    signer = accounts[0]
    linkToken = new ethers.Contract(linkTokenAddress, linkTokenContract.interface, signer)

    // linkToken.transfer --> will transfer token to a specified address.
    let fund_tx = await linkToken.transfer(RandomSVG.address, fee)
    await fund_tx.wait(1)

    // create an NFT! By calling a random number
    const RandomSVGContract = await ethers.getContractFactory("RandomSVG")
    const randomSVG = new ethers.Contract(RandomSVG.address, RandomSVGContract.interface, signer)
    let creation_tx = await randomSVG.create({ gasLimit: 300000 })
    let receipt = await creation_tx.wait(1)

    // events[3] --> our own events i.e event requestedRandomSVG(bytes32 indexed requestId, uint256 indexed tokenId);
    // starts from 4 which is index of 3 since it reads the array from 0
    // also we know that the contracts we deployed has its events and our own starts from events[3] i.e 3
    // topics[0] --> the hash of event requestedRandomSVG(bytes32 indexed requestId, uint256 indexed tokenId);
    // topics[1] --> bytes32 indexed requestId
    // topics[2] --> uint256 indexed tokenId
    let tokenId = receipt.events[3].topics[2]
    log(`You've made your NFT! This is token number ${tokenId.toString()}`)
    log("Let's wait for the chainlink node to respond..")

    if (chainId != 31337) {
        // we created a promise bcos the testnet takes time to respond
        // we gave it 180 seconds bcos testing on a test net do take time
        await new Promise(r => setTimeout(r, 180000))
        log("Now let's finish the mint...")
        let finish_tx = await randomSVG.finishMint(tokenId, { gasLimit: 2000000 })
        await finish_tx.wait(1)
        log(`You can view the tokenURI here ${await randomSVG.tokenURI(tokenId)}`)
    } else {
        const VRFCoordinatorMock = await deployments.get("VRFCoordinatorMock")
        vrfCoordinator = await ethers.getContractAt(
            "VRFCoordinatorMock",
            VRFCoordinatorMock.address,
            signer
        )
        // from import "@chainlink/contracts/src/v0.6/tests/VRFCoordinatorMock.sol";
        // vrfCoordinator.callBackWithRandomness(bytes32 requestId,uint256 randomness,address consumerContract)
        // logs/events is the same thing
        // logs[3] i.e the fourth events or fourth log
        let vrf_tx = await vrfCoordinator.callBackWithRandomness(
            receipt.logs[3].topics[1],
            77777,
            randomSVG.address
        )
        await vrf_tx.wait(1)
        
        // Now we assume that our function fulfillRandomness(...) is done 
        // and it has given tokenIdToRandomNumber[tokenId] = randomNumber;
        // So we can call the finishMint()

        log("Now let's finish the mint!")
        // we gave it a gasLimit bcos it might break
        let finish_tx = await randomSVG.finishMint(tokenId, { gasLimit: 2000000 })
        await finish_tx.wait(1)
        log(`You can view the tokenURI here: ${await randomSVG.tokenURI(tokenId)}`)
    }
}

module.exports.tags = ["all", "rsvg"]


// yarn hardhat deploy --tags rsvg
// --------------------------------------------------
// deploying "RandomSVG" (tx: 0x16f96f1e038f0c3867d68b363d4440ebee5d4921557164786d6434d2336c10b8)...: deployed at 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 with 4342404 gas
// You have deployed your NFT contract!



// yarn hardhat deploy --tags rsvg
// --------------------------------------------------
// deploying "RandomSVG" (tx: 0x16f96f1e038f0c3867d68b363d4440ebee5d4921557164786d6434d2336c10b8)...: deployed at 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 with 4342404 gas
// You have deployed your NFT contract!
// Verify with:
//  npx hardhat verify --network localhost 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 0x5FbDB2315678afecb367f032d93F642f64180aa3 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c 10000000000000000
// Done in 29.96s.



// yarn hardhat deploy --tags rsvg
// --------------------------------------------------
// deploying "RandomSVG" (tx: 0x16f96f1e038f0c3867d68b363d4440ebee5d4921557164786d6434d2336c10b8)...: deployed at 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 with 4342404 gas
// You have deployed your NFT contract!
// Verify with:
//  npx hardhat verify --network localhost 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 0x5FbDB2315678afecb367f032d93F642f64180aa3 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c 10000000000000000
// Duplicate definition of Transfer (Transfer(address,address,uint256,bytes), Transfer(address,address,uint256))
// You've made your NFT! This is token number 0x0000000000000000000000000000000000000000000000000000000000000000
// Let's wait for the chainlink node to respond..
// Now let's finish the mint!
// You can view the tokenURI here: data:application/json;base64,eyJuYW1lIjoiU1ZHIE5GVCIsICJkZXNjcmlwdGlvbiI6IkFuIE5GVCBiYXNlZCBvbiBTVkchIiwgImF0dHJpYnV0ZXMiOiIiLCAiaW1hZ2UiOiJkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBITjJaeUI0Yld4dWN6MG5hSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY25JR2hsYVdkb2REMG5OVEF3SnlCM2FXUjBhRDBuTlRBd0p6NDhjR0YwYUNCa1BTZE5JREl3TVNBME56Qk1JREV3TlNBME9UaE5JRE01T0NBME5qQk1JRE14TlNBek1ERk1JREV4TWlBek1qSW5JR1pwYkd3OUozUnlZVzV6Y0dGeVpXNTBKeUJ6ZEhKdmEyVTlKMkpzZFdVbkx6NDhjR0YwYUNCa1BTZE1JRFF6TnlBME5qTW5JR1pwYkd3OUozUnlZVzV6Y0dGeVpXNTBKeUJ6ZEhKdmEyVTlKMmR5WldWdUp5OCtQSEJoZEdnZ1pEMG5UQ0F5T1RRZ016RTNKeUJtYVd4c1BTZDBjbUZ1YzNCaGNtVnVkQ2NnYzNSeWIydGxQU2RpYkdGamF5Y3ZQanh3WVhSb0lHUTlKMDBnTXpBZ01URXhUQ0EwT0RNZ09UTk1JREkyTkNBeU9UZE5JRFV6SURReE4wd2dNell6SURZMkp5Qm1hV3hzUFNkMGNtRnVjM0JoY21WdWRDY2djM1J5YjJ0bFBTZGliSFZsSnk4K1BIQmhkR2dnWkQwblRDQXpPVGtnTkRJNFRDQTBOREVnTWpBeUp5Qm1hV3hzUFNkMGNtRnVjM0JoY21WdWRDY2djM1J5YjJ0bFBTZG5jbVZsYmljdlBqeHdZWFJvSUdROUowMGdNakVnTXprd1RDQXpPVE1nTkRReUp5Qm1hV3hzUFNkMGNtRnVjM0JoY21WdWRDY2djM1J5YjJ0bFBTZG5jbVZsYmljdlBqeHdZWFJvSUdROUowMGdNVE01SURFM05Vd2dNalE1SURJeE1VMGdNVEkzSURRMk1VMGdNaklnTVRVekp5Qm1hV3hzUFNkMGNtRnVjM0JoY21WdWRDY2djM1J5YjJ0bFBTZGliSFZsSnk4K1BIQmhkR2dnWkQwblRTQXhPVGNnTVRrNEp5Qm1hV3hzUFNkMGNtRnVjM0JoY21WdWRDY2djM1J5YjJ0bFBTZDVaV3hzYjNjbkx6NDhMM04yWno0PSJ9
// Done in 19.16s.
