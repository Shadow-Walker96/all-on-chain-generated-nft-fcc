module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
    const DECIMALS = "18"
    const INITIAL_PRICE = "200000000000000000000"

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = await getChainId()

    // If we are on a local development network, we need to deploy mocks!
    if (chainId == 31337) {
        log("Local network detected! Deploying mocks...")

        const linkToken = await deploy("LinkToken", {
            from: deployer,
            log: true,
        })

        await deploy("VRFCoordinatorMock", {
            from: deployer,
            log: true,
            args: [linkToken.address],
        })

        // await deploy("EthUsdAggregator", {
        //     contract: "MockV3Aggregator",
        //     from: deployer,
        //     log: true,
        //     args: [DECIMALS, INITIAL_PRICE],
        // })

        log("Mocks Deployed!")
        log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        log("You are deploying to a local network, you'll need a local network running to interact")
        log("Please run `npx hardhat console` to interact with the deployed smart contracts!")
        log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    }
}
module.exports.tags = ["all", "rsvg", "svg"]
// module.exports.tags = ["all", "mocks", "rsvg", "svg", "main"]

// yarn hardhat deploy --tags svg
// Compiled 37 Solidity files successfully
// Local network detected! Deploying mocks...
// deploying "LinkToken" (tx: 0x596222d755670dab88fa5005d6e6f25097b05ccef8810d13ec5b6c8adb02e05d)...: deployed at 0x5FbDB2315678afecb367f032d93F642f64180aa3 with 1279067 gas
// deploying "VRFCoordinatorMock" (tx: 0xb05b974324ef48416756433f26a15fd6f19b3d3a46e691c0e87f8fef4f612a5c)...: deployed at 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 with 363650 gas
// Mocks Deployed!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// You are deploying to a local network, you'll need a local network running to interact
// Please run `npx hardhat console` to interact with the deployed smart contracts!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// Done in 84.61s.
