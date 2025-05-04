package com.floodpath.listener;

import com.floodpath.constants.AppConstants;
import com.floodpath.dto.CarParkAvailTopicDTO;
import com.floodpath.dto.CarParkInfoTopicDTO;
import com.floodpath.service.CarParkService;
import com.floodpath.util.ObjectUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CarParkAvailTopicListener {

    private final CarParkService carParkService;

    @KafkaListener(topics = AppConstants.CARPARK_AVAIL_TOPIC_NAME, groupId = AppConstants.CARPARK_AVAIL_GROUP_ID)
    void listener(String data) {
        CarParkAvailTopicDTO receivedData = ObjectUtil.convertJsonToObject(data, CarParkAvailTopicDTO.class);
        if (receivedData != null) {
            log.info("Carpark availability data received from broker: {}", receivedData);
            carParkService.saveCarParkAvailData(receivedData);
        }
    }
}
