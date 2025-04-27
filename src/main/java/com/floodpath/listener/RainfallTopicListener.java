package com.floodpath.listener;

import com.floodpath.constants.AppConstants;
import com.floodpath.dto.RainfallTopicDTO;
import com.floodpath.service.RainfallService;
import com.floodpath.util.ObjectUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RainfallTopicListener {

    private final RainfallService rainfallService;

    @KafkaListener(topics = AppConstants.RAINFALL_TOPIC_NAME, groupId = AppConstants.RAINFALL_GROUP_ID)
    void listener(String data) {
        RainfallTopicDTO receivedData = ObjectUtil.convertJsonToObject(data, RainfallTopicDTO.class);
        if (receivedData != null) {
            log.info("Rainfall data received from broker: {}", receivedData);
            rainfallService.saveRainfallData(receivedData);
        }
    }
}
