const Lottery = artifacts.require("Lottery");
var Web3 = require('web3');
var BN = web3.utils.BN;
contract("Lottery", (accounts) => {
  let lottery;
  let expectedAdopter;

  before(async () => {
    lottery = await Lottery.deployed();
  });

  describe("buy ticket", async () => {
    it("error when buy ticket with less payment", async () => {
        let thrownError;
        try {
            await lottery.buyTicket(0, { from: accounts[1], value: web3.utils.toWei('0.04', 'ether')});
        } catch (error) {
            thrownError = error;
        }
        assert.include(thrownError.message, 'Must pay ticket price');
    });
    it("error when buy ticket with wrong number", async () => {
        let thrownError;
        try {
            await lottery.buyTicket(0, { from: accounts[1], value: web3.utils.toWei('0.05', 'ether')});
        } catch (error) {
            thrownError = error;
        }
        assert.include(thrownError.message, 'Wrong number ticket');
    });
  });
});
