package com.floodpath.service.impl;

import com.floodpath.constants.AppConstants;
import com.floodpath.dto.RainfallTopicDTO;
import com.floodpath.service.BrokerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class BrokerServiceImpl implements BrokerService {

    private final KafkaTemplate<String, String> adhocKafkaTemplate;
    private final KafkaTemplate<String, Object> rainfallKafkaTemplate;

    @Override
    public void sendDataToBroker(String data) {
        log.info("Adhoc data received, proceeding to send to broker - {}", data);
        adhocKafkaTemplate.send(AppConstants.ADHOC_TOPIC_NAME, data);
    };

    @Override
    public void sendDataToBroker(RainfallTopicDTO data) {
        log.info("Rainfall data from Data.Gov (NEA) processed, proceeding to send to broker - {}", data.toString());
        rainfallKafkaTemplate.send(AppConstants.RAINFALL_TOPIC_NAME, data);
    };
}
