package com.floodpath.service;

import com.floodpath.dto.RainfallTopicDTO;

public interface BrokerService {
    void sendDataToBroker(Object data);
}
