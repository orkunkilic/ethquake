// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./APIConsumer.sol";

contract Mock{
    APIConsumer private consumer;

    constructor(APIConsumer _consumer){
        consumer = _consumer;
    }

    function getIsEarthquake(string memory lat, string memory long) external returns (bool){
        consumer.requestEarthquakeData(lat, long);
        return consumer.isEarthquake();
    }

}