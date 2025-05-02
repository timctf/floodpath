package com.floodpath.listener;

import com.floodpath.constants.AppConstants;
import com.floodpath.dto.CarParkInfoTopicDTO;
import com.floodpath.dto.RainfallTopicDTO;
import com.floodpath.service.CarParkService;
import com.floodpath.service.RainfallService;
import com.floodpath.util.ObjectUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CarParkInfoTopicListener {

    private final CarParkService carParkService;

    @KafkaListener(topics = AppConstants.CARPARK_INFO_TOPIC_NAME, groupId = AppConstants.CARPARK_INFO_GROUP_ID)
    void listener(String data) {
        CarParkInfoTopicDTO receivedData = ObjectUtil.convertJsonToObject(data, CarParkInfoTopicDTO.class);
        if (receivedData != null) {
            log.info("Carpark information data received from broker: {}", receivedData);
            carParkService.saveCarParkInfoData(receivedData);
        }
    }
}
