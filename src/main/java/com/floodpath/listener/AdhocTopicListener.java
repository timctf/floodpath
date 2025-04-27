package com.floodpath.listener;

import com.floodpath.constants.AppConstants;
import com.floodpath.dto.RainfallTopicDTO;
import com.floodpath.service.BrokerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdhocTopicListener {

    private final BrokerService brokerService;

    @KafkaListener(topics = AppConstants.ADHOC_TOPIC_NAME, groupId = AppConstants.ADHOC_GROUP_ID)
    void listener(String data) {
        log.info("Adhoc data received from broker: {}", data);
    }
}
