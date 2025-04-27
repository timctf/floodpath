package com.floodpath.service;

import com.floodpath.dto.RainfallTopicDTO;

public interface BrokerService {
    void sendDataToBroker(String data);
    void sendDataToBroker(RainfallTopicDTO data);
}
