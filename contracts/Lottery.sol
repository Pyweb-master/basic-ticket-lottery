// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

/**
 * @title Ethereum-Lottery
 * @dev Simple lottery smart contract to run on the Ethereum
 * chain. Designed to (hopefully) work well with a web3 front-end.
 * Source of randomness comes from ethereum block hashes.
 */

contract Lottery {

    event LotteryTicketPurchased(address indexed _purchaser, uint256 _ticketID);
    event LotteryAmountPaid(address indexed _winner, uint8 _ticketID, uint256 _amount);

    uint256 public ticketPrice = 50000000 gwei;
    uint8 public ticketMax = 5;
    address payable[5]  public ticketMapping;
    uint256 public ticketsBought = 0;

    constructor() {
    }

    modifier allTicketsSold() {
      require(ticketsBought>=ticketMax);
      _;
    }

    function buyTicket(uint16 _ticket) payable public returns (bool) {
      require(msg.value == ticketPrice, "Must pay ticket price");
      require(_ticket > 0 && _ticket < ticketMax+1, "Wrong number ticket");
      require(ticketMapping[_ticket-1]==address(0), "Already sold out");
      require(ticketsBought < ticketMax, "All sold out");

      address payable purchaser = payable(msg.sender);
      ticketsBought += 1;
      ticketMapping[_ticket-1] = purchaser;
      emit LotteryTicketPurchased(purchaser, _ticket);

      // placing "burden" of sendReward() on last ticket buyer
      // is okay, because the refund from destroying the arrays
      // makes it cost the same as buying a regular ticket
      if(ticketsBought >= ticketMax) {
        sendReward();
      }

      return true;
    }

    function sendReward() public allTicketsSold returns (address) {
      uint8 winningNumber = lotteryPicker();
      address payable winner = ticketMapping[winningNumber];

      require(winner != address(0));
      uint256 totalAmount = ticketMax*ticketPrice;
      reset();
      winner.transfer(totalAmount);
      emit LotteryAmountPaid(winner, winningNumber, totalAmount);
      return winner;
    }

    // @return a random number based off of current block information
    function lotteryPicker() public allTicketsSold returns (uint8) {
      return uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.number))) % ticketMax);
    }

    // resets everything to work again
    function reset() private allTicketsSold returns (bool) {
      ticketsBought = 0;
      for(uint x = 0; x < ticketMax; x++) {
        delete ticketMapping[x];
      }
      return true;
    }

    // @dev returns the entire array of tickets purchased
    // while I understand there's a getter function for the
    // array, I'd prefer for there to be a way to get it
    // all at once, since the getter is by element only
    function getTicketsPurchased() public view returns(address payable[5] memory) {
      return ticketMapping;
    }
}
