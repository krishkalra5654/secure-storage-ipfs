const SecureStorage = artifacts.require("SecureStorage");

contract("SecureStorage", (accounts) => {
  let instance;
  const owner = accounts[0];
  const user1 = accounts[1];
  const user2 = accounts[2];

  beforeEach(async () => {
    instance = await SecureStorage.new({ from: owner });
  });

  it("stores and retrieves an encrypted file", async () => {
    await instance.addAllowedUser(user1, { from: owner });
    await instance.storeFile("Qm123", "test.txt", "key123", true, { from: user1 });
    
    // Correct way to handle the returned tuple
    const result = await instance.getFile.call(0, { from: user1 });
    assert.equal(result[0], "Qm123", "IPFS hash mismatch");
    assert.equal(result[1], "test.txt", "File name mismatch");
    assert.equal(result[2], "key123", "Key mismatch");
    assert.equal(result[4], true, "Public status mismatch");
    assert.isAbove(Number(result[3]), 0, "Timestamp should be set");
  });

  it("restricts non-allowed users", async () => {
    // Attempt to store file without being allowed
    try {
      await instance.storeFile("Qm456", "test2.txt", "key456", false, { from: user1 });
      assert.fail("Should have reverted");
    } catch (error) {
      assert.include(error.message, "Not authorized", "Expected authorization error");
    }

    // Verify no file was stored
    const count = await instance.getFileCount({ from: user1 });
    assert.equal(count.toString(), "0", "File count should be 0");
  });

  it("allows owner to add users", async () => {
    await instance.addAllowedUser(user1, { from: owner });
    
    // Verify user can now store files
    await instance.storeFile("Qm789", "test3.txt", "key789", false, { from: user1 });
    const count = await instance.getFileCount({ from: user1 });
    assert.equal(count.toString(), "1", "File count mismatch");
    
    // Verify another user still can't store files
    try {
      await instance.storeFile("Qm000", "test.txt", "key000", false, { from: user2 });
      assert.fail("Should have reverted");
    } catch (error) {
      assert.include(error.message, "Not authorized", "Expected authorization error");
    }
  });

  it("blocks storage when paused", async () => {
    await instance.addAllowedUser(user1, { from: owner });
    await instance.pause({ from: owner });
    
    try {
      await instance.storeFile("Qm999", "test4.txt", "key999", true, { from: user1 });
      assert.fail("Should have reverted");
    } catch (error) {
      assert.include(error.message, "Pausable: paused", "Expected paused error");
    }
    
    // Unpause and verify it works again
    await instance.unpause({ from: owner });
    await instance.storeFile("Qm999", "test4.txt", "key999", true, { from: user1 });
    const count = await instance.getFileCount({ from: user1 });
    assert.equal(count.toString(), "1", "File should be stored after unpausing");
  });

  it("retrieves public files without key", async () => {
    // Owner stores a public file
    await instance.storeFile("QmABC", "public.txt", "keyABC", true, { from: owner });
    
    // User1 retrieves public file (without being allowed)
    const result = await instance.getPublicFile.call(owner, 0, { from: user1 });
    assert.equal(result[0], "QmABC", "IPFS hash mismatch");
    assert.equal(result[1], "public.txt", "File name mismatch");
    
    // Verify private data isn't exposed
    try {
      await instance.getFile(0, { from: user1 });
      assert.fail("Should have reverted - user1 shouldn't access owner's private file");
    } catch (error) {
      assert.include(error.message, "ID does not exist", "Expected access error");
    }
  });
});
