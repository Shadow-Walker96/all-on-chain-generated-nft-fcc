const networkConfig = {
    31337: {
        name: "localhost",
        keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        fee: "10000000000000000", // 0.01 ETH  // WEI/JUELS
    },
    11155111: {
        name: "sepolia",
        linkToken: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
        vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        fee: "10000000000000000", // 0.01 ETH  // WEI / JUELS
    },
}

const DECIMALS = "18"
const INITIAL_PRICE = "200000000000000000000"
const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_PRICE,
}
