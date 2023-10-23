// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Get a random number
// Use that random number to generate some random SVG code
// base64 encode the SVG code
// Get the tokenURI and mint the NFT

// Note --> It is a good practise to emit an event when we create a mapping

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "base64-sol/base64.sol";

contract RandomSVG is ERC721URIStorage, VRFConsumerBase, Ownable {
    bytes32 public keyHash;
    uint256 public fee;
    uint256 public tokenCounter;

    // SVG Parameters
    uint256 public maxNumberOfPath;
    uint256 public maxNumberOfPathCommand;
    uint256 public size;
    string[] public pathCommands; // we didnt use memory here bcos we want it to store in the storage variable.
    string[] public colors;

    mapping(bytes32 => address) public requestIdToSender;
    mapping(bytes32 => uint256) public requestIdToTokenId;
    mapping(uint256 => uint256) public tokenIdToRandomNumber;

    // indexed here means that it going to be a topic
    // Also note that indexed cost gas but we dont care at this point
    event requestedRandomSVG(bytes32 indexed requestId, uint256 indexed tokenId);
    event CreatedUnfinishedRandomSVG(uint256 indexed tokenId, uint256 randomNumber);
    event CreatedRandomSVG(uint256 indexed tokenId, string tokenURI);

    constructor(
        address _VRFCoordinator,
        address _LinkToken,
        bytes32 _keyHash,
        uint256 _fee
    ) VRFConsumerBase(_VRFCoordinator, _LinkToken) ERC721("RandomSVG", "rsNFT") {
        fee = _fee;
        keyHash = _keyHash;
        tokenCounter = 0;

        maxNumberOfPath = 10; // we set the number of paths for the SVG image which will generate path to 10 to spent less abount of gas bcos the more paths the more gas we would for
        maxNumberOfPathCommand = 5;
        size = 500; // the size here we make both width and height to be 500
        pathCommands = ["M", "L"]; // "M" --> move to, "L" --> line to
        colors = ["red", "blue", "green", "yellow", "black", "white"];
    }

    function withdraw() public payable onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function create() public returns (bytes32 requestId) {
        // Here we request for a random number
        requestId = requestRandomness(keyHash, fee);
        // Here we map the requestId to individual sender that request for randomness
        requestIdToSender[requestId] = msg.sender;
        uint256 tokenId = tokenCounter;
        // Here we map the requestId to tokenId
        requestIdToTokenId[requestId] = tokenId;
        tokenCounter = tokenCounter + 1;
        emit requestedRandomSVG(requestId, tokenId);
    }

    // it is internal bcos it chainlink VRF that will call the fulfillRandomness() and we dont want anybody
    // to call this function
    function fulfillRandomness(bytes32 requestId, uint256 randomNumber) internal override {
        // There is an issue!!!!!!
        // The chainlink VRF has a max gas of 200,000 gas (computation units)
        // It means that if what we do with this random number is sufficiently complex
        // The chainlink node will say ha! its really hard for me, it is a lot of work
        // So what we will do is that we would tell chainlink node that it should not worry
        // Just return the randomNumber and we will deal with the heavy lifting,
        // We would make the transaction, we would spend the gas to do this
        // For context we would do 2M gas which is a lots of gas
        // It bcos we are doing lots of heavy lifting on-chain
        // Now this method is great bcos we have all of our metadata on-chain, and it is not so great
        // Bcos it is definately more expensive gas.

        address nftOwner = requestIdToSender[requestId];
        uint256 tokenId = requestIdToTokenId[requestId];
        _safeMint(nftOwner, tokenId);

        // we did this i.e tokenIdToRandomNumber bcos we want to lift the burden off chainlink VRF
        // Bcos it will cost more gas for chainlink VRF
        tokenIdToRandomNumber[tokenId] = randomNumber;
        emit CreatedUnfinishedRandomSVG(tokenId, randomNumber);
    }

    function finishMint(uint256 _tokenId) public {
        // Check to see if it's been minted and a random number is returned
        // generate some random SVG code
        // turn that into an image URI
        // use that imageURI to format into a tokenURI

        require(bytes(tokenURI(_tokenId)).length <= 0, "tokenId is already all set");
        require(tokenCounter > _tokenId, "TokenId has not been minted yet!");
        require(tokenIdToRandomNumber[_tokenId] > 0, "Need to wait for Chainlink VRF");
        uint256 randomNumber = tokenIdToRandomNumber[_tokenId];
        string memory svg = generateSVG(randomNumber);
        string memory imageURI = svgToImageURI(svg);
        string memory tokenURI = formatTokenURI(imageURI);
        _setTokenURI(_tokenId, tokenURI);
        emit CreatedRandomSVG(_tokenId, svg);
    }

    // Here is how the svg look like
    //  <svg xmlns="http://www.w3.org/2000/svg" height="210" width="400">
    //      <path d="M150 0 L75 200 L225 200 Z" />
    //      <path d="M1 0 L75 400 L100 100 fill="transparent" stroke="blue" />
    //      <path d="M1 0 L0 500 L100 100 fill="transparent" stroke="red" />
    //  </svg>

    function generateSVG(uint256 _randomNumber) public view returns (string memory finalSvg) {
        // 100 / 10 = 10
        // 100 % 10 = 0
        // 101 % 10 = 1
        uint256 numberOfPaths = (_randomNumber % maxNumberOfPath) + 1; // +1 we added is just say that at least it will have 1 path
        finalSvg = string(
            // Here we start with --> <svg xmlns="http://www.w3.org/2000/svg" height="210" width="400">
            abi.encodePacked(
                "<svg xmlns='http://www.w3.org/2000/svg' height='",
                // Here we convert the size to uint256 bcos the size is a string i.e "210"
                uint2str(size), // the size for height we set it to be 500
                "' width='",
                uint2str(size), // the size for width we set it to be 500 also
                "'>"
            )
        );
        for (uint i = 0; i < numberOfPaths; i++) {
            // we want to use a new random number for each path
            // it is gotten from chainlink VRF docs, under USING RANDOMNESS, click on Best Practices
            // The function answer is already determined by VRF and cant be guessed
            // Also dont use this function outside of the randomNumber bcos if u use it in another function
            // Like createMint() someone can brute force like do nasty things with it
            uint256 newRNG = uint256(keccak256(abi.encode(_randomNumber, i))); // 
            string memory pathSvg = generatePath(newRNG);
            finalSvg = string(abi.encodePacked(finalSvg, pathSvg));
        }
        finalSvg = string(abi.encodePacked(finalSvg, "</svg>"));
    }

    function generatePath(uint256 _randomness) public view returns (string memory pathSvg) {
        uint256 numberOfPathCommands = (_randomness % maxNumberOfPathCommand) + 1;
        // we start with what inside the path command i.e --> "M150 0 L75 200 L225 200 Z" />
        pathSvg = "<path d='";
        for (uint i = 0; i < numberOfPathCommands; i++) {
            string memory pathCommand = generatePathCommand(
                uint256(keccak256(abi.encode(_randomness, size + i)))
            );
            pathSvg = string(abi.encodePacked(pathSvg, pathCommand));
        }
        string memory color = colors[_randomness % colors.length];
        // output of pathSvg looks like ---> "M150 0 L75 200 L225 200 fill="transparent" stroke="blue" />
        pathSvg = string(abi.encodePacked(pathSvg, "' fill='transparent' stroke='", color, "'/>"));
    }

    function generatePathCommand(
        uint256 _randomness
    ) public view returns (string memory pathCommand) {
        // the path command is --> pathCommands = ["M", "L"]; 
        pathCommand = pathCommands[_randomness % pathCommands.length];
        // parameterOne looks like this --> "M150 0 L75
        uint256 parameterOne = uint256(keccak256(abi.encode(_randomness, size * 2))) % size;
        // parameterTwo looks like this --> "200 L225 200
        uint256 parameterTwo = uint256(keccak256(abi.encode(_randomness, size * 2 + 1))) % size;
        // pathCommand looks like this --> "M150 0 L75 200 L225 200"
        // the reason for " " is bcos the commands have spaces in them i.e "M150 0 L75 200 L225 200"
        pathCommand = string(
            abi.encodePacked(pathCommand, " ", uint2str(parameterOne), " ", uint2str(parameterTwo))
        );
    }

    // From: https://stackoverflow.com/a/65707309/11969592
    function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    function svgToImageURI(string memory _svg) public pure returns (string memory) {
        string memory baseURL = "data:image/svg+xml;base64,";
        string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(_svg))));
        string memory imageURI = string(abi.encodePacked(baseURL, svgBase64Encoded));
        return imageURI;
    }

    function formatTokenURI(string memory _imageURI) public pure returns (string memory) {
        string memory baseURL = "data:application/json;base64,";
        return
            string(
                abi.encodePacked(
                    baseURL,
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                "SVG NFT", // You can add whatever name here
                                '", "description":"An NFT based on SVG!", "attributes":"", "image":"',
                                _imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }
}
