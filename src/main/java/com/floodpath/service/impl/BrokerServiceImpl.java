package com.floodpath.service.impl;

import com.floodpath.constants.AppConstants;
import com.floodpath.dto.CarParkAvailTopicDTO;
import com.floodpath.dto.CarParkInfoTopicDTO;
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
    private final KafkaTemplate<String, Object> dataKafkaTemplate;

    @Override
    public void sendDataToBroker(Object data) {
        if (data instanceof String) {
            log.info("Adhoc data received, proceeding to send to broker - {}", data);
            adhocKafkaTemplate.send(AppConstants.ADHOC_TOPIC_NAME, (String) data);
        } else if (data instanceof RainfallTopicDTO) {
            log.info("Rainfall data from Data.Gov (NEA) processed, proceeding to send to broker - {}", data);
            dataKafkaTemplate.send(AppConstants.RAINFALL_TOPIC_NAME, data);
        } else if (data instanceof CarParkInfoTopicDTO) {
            log.info("Carpark information data from Data.Gov (HDB) processed, proceeding to send to broker - {}", data);
            dataKafkaTemplate.send(AppConstants.CARPARK_INFO_TOPIC_NAME, data);
        } else if (data instanceof CarParkAvailTopicDTO) {
            log.info("Carpark availability data from Data.Gov (HDB) processed, proceeding to send to broker - {}", data);
            dataKafkaTemplate.send(AppConstants.CARPARK_AVAIL_TOPIC_NAME, data);
        } else {
            log.info("No valid combination to send to broker: {}", data);
        }
    };
}
