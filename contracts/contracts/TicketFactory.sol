// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Ticket.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

contract TicketFactory is Ownable2Step {

    constructor() Ownable(msg.sender) {}

}
