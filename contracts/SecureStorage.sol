//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract SecureStorage is Ownable, Pausable {
    struct File {
        string ipfsHash;    // IPFS hash of encrypted file
        string fileName;    // Name of the file
        string encryptedKey;// Encrypted key (stored as string)
        uint256 timestamp;  // When it was stored
        bool isPublic;      // Publicly viewable?
    }
    mapping(address => mapping(uint256 => File)) private files;
    mapping(address => uint256) private fileCount;
    mapping(address => bool) private allowedUsers;

    event FileStored(address indexed user, uint256 id, string ipfsHash, string fileName);
    event FileDeleted(address indexed user, uint256 id);
    event UserStatusChanged(address indexed user, bool allowed);

    constructor() {
        allowedUsers[msg.sender] = true;
    }

    modifier onlyAllowed() {
        require(allowedUsers[msg.sender], "Not authorized");
        _;
    }

    function storeFile(
        string memory _ipfsHash, 
        string memory _fileName, 
        string memory _encryptedKey, 
        bool _isPublic
    ) public whenNotPaused onlyAllowed {
        uint256 id = fileCount[msg.sender];
        files[msg.sender][id] = File(_ipfsHash, _fileName, _encryptedKey, block.timestamp, _isPublic);
        fileCount[msg.sender]++;
        emit FileStored(msg.sender, id, _ipfsHash, _fileName);
    }

    function getFile(uint256 _id) 
        public view 
        returns (string memory, string memory, string memory, uint256, bool) {
        require(_id < fileCount[msg.sender], "ID does not exist");
        File memory file = files[msg.sender][_id];
        return (file.ipfsHash, file.fileName, file.encryptedKey, file.timestamp, file.isPublic);
    }

    function getPublicFile(address _user, uint256 _id) 
        public view 
        returns (string memory, string memory) {
        require(_id < fileCount[_user], "ID does not exist");
        File memory file = files[_user][_id];
        require(file.isPublic, "File is not public");
        return (file.ipfsHash, file.fileName); // Key not shared for public files
    }

    function getFileKey(uint256 _id) public view returns (string memory) {
        require(_id < fileCount[msg.sender], "ID does not exist");
        return files[msg.sender][_id].encryptedKey;
    }

    function getFileCount() public view returns (uint256) {
        return fileCount[msg.sender];
    }

    function deleteFile(uint256 _id) public whenNotPaused {
        require(_id < fileCount[msg.sender], "ID does not exist");
        delete files[msg.sender][_id];
        emit FileDeleted(msg.sender, _id);
    }

    function addAllowedUser(address _user) public onlyOwner {
        allowedUsers[_user] = true;
        emit UserStatusChanged(_user, true);
    }

    function removeAllowedUser(address _user) public onlyOwner {
        allowedUsers[_user] = false;
        emit UserStatusChanged(_user, false);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}
