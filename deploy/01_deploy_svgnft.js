const fs = require("fs")
let { networkConfig } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = await getChainId()

    log("---------------------------------------------------")
    const SVGNFT = await deploy("SVGNFT", {
        from: deployer,
        log: true,
    })

    log(`You have deployed an NFT contract to ${SVGNFT.address}`)

    const svgNFTContract = await ethers.getContractFactory("SVGNFT")
    const accounts = await hre.ethers.getSigners()
    const signer = accounts[0]
    const svgNFT = new ethers.Contract(SVGNFT.address, svgNFTContract.interface, signer)
    const networkName = networkConfig[chainId]["name"]

    log(`Verify with: \n npx hardhat verify --network ${networkName} ${svgNFT.address}`)
    log("Let's create an NFT now!")

    let filepath = "./img/triangle.svg"
    let svg = fs.readFileSync(filepath, { encoding: "utf-8" })

    log(`We will use ${filepath} as our SVG, and this will turn into a tokenURI. `)

    let transactionResponse = await svgNFT.create(svg)
    await transactionResponse.wait(1)

    log(`You've made an NFT!`)
    log(`You can view the tokenURI here ${await svgNFT.tokenURI(0)}`)
}

module.exports.tags = ["all", "svg"]

// hh deploy
// Nothing to compile
// ---------------------------------------------------
// deploying "SVGNFT" (tx: 0xe66d3544ee51961e7b618ce63555900ff194166af92fa0bfabff7672b59bf786)...: deployed at 0x5FbDB2315678afecb367f032d93F642f64180aa3 with 2683815 gas
// You have deployed an NFT contract to 0x5FbDB2315678afecb367f032d93F642f64180aa3
// Verify with:
//  npx hardhat verify --network localhost 0x5FbDB2315678afecb367f032d93F642f64180aa3
// Let's create an NFT now!
// We will use ./img/triangle.svg as our SVG, and this will turn into a tokenURI.
// You've made an NFT!
// You can view the tokenURI here data:application/json;base64,eyJuYW1lIjoiU1ZHIE5GVCIsICJkZXNjcmlwdGlvbiI6IkFuIE5GVCBiYXNlZCBvbiBTVkchIiwgImF0dHJpYnV0ZXMiOiIiLCAiaW1hZ2UiOiJkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBITjJaeUI0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lJR2hsYVdkb2REMGlNakV3SWlCM2FXUjBhRDBpTkRBd0lqNDhjR0YwYUNCa1BTSk5NVFV3SURBZ1REYzFJREl3TUNCTU1qSTFJREl3TUNCYUlpQXZQand2YzNablBnb0sifQ==


// yarn hardhat deploy --network sepolia
// yarn run v1.22.19
// warning package.json: No license field
// $ /home/shadow-walker/all-on-chain-generated-nft-fcc/node_modules/.bin/hardhat deploy --network sepolia
// Nothing to compile
// ---------------------------------------------------
// deploying "SVGNFT" (tx: 0xcb62bc35d423973f39e33a3702c39eee0aa063fa2c4ca17b7ba6f4acb258ddde)...: deployed at 0xbf659eAa27509e7aa83CA4933287A76833B773BC with 2684595 gas
// You have deployed an NFT contract to 0xbf659eAa27509e7aa83CA4933287A76833B773BC
// Verify with:
//  npx hardhat verify --network sepolia 0xbf659eAa27509e7aa83CA4933287A76833B773BC
// Let's create an NFT now!
// We will use ./img/triangle.svg as our SVG, and this will turn into a tokenURI.
// You've made an NFT!
// You can view the tokenURI here data:application/json;base64,eyJuYW1lIjoiU1ZHIE5GVCIsICJkZXNjcmlwdGlvbiI6IkFuIE5GVCBiYXNlZCBvbiBTVkchIiwgImF0dHJpYnV0ZXMiOiIiLCAiaW1hZ2UiOiJkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBITjJaeUI0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lJR2hsYVdkb2REMGlNakV3SWlCM2FXUjBhRDBpTkRBd0lqNDhjR0YwYUNCa1BTSk5NVFV3SURBZ1REYzFJREl3TUNCTU1qSTFJREl3TUNCYUlpQXZQand2YzNablBnb0sifQ==
// Done in 60.97s.


// yarn hardhat verify --network sepolia 0xbf659eAa27509e7aa83CA4933287A76833B773BC
// yarn run v1.22.19
// warning package.json: No license field
// $ /home/shadow-walker/all-on-chain-generated-nft-fcc/node_modules/.bin/hardhat verify --network sepolia 0xbf659eAa27509e7aa83CA4933287A76833B773BC
// Nothing to compile
// Successfully submitted source code for contract
// contracts/SVGNFT.sol:SVGNFT at 0xbf659eAa27509e7aa83CA4933287A76833B773BC
// for verification on the block explorer. Waiting for verification result...

// Successfully verified contract SVGNFT on Etherscan.
// https://sepolia.etherscan.io/address/0xbf659eAa27509e7aa83CA4933287A76833B773BC#code
// Done in 24.49s.