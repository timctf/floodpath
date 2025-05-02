package com.floodpath.service.impl;

import com.floodpath.dto.CarParkInfoTopicDTO;
import com.floodpath.dto.carparkinfores.CarParkInfoResDTO;
import com.floodpath.dto.carparkinfores.CarParkInfoResRecordsDTO;
import com.floodpath.entity.CarParkInfoTopic;
import com.floodpath.repository.CarParkInfoRepository;
import com.floodpath.service.BrokerService;
import com.floodpath.service.CarParkService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class CarParkServiceImpl implements CarParkService {

    private final BrokerService brokerService;
    private final CarParkInfoRepository carParkInfoRepository;

    @Value("${floodpath.hdb.carpark.info.api.url.1}")
    private String CARPARK_INFO_API_URL_1;

    @Value("${floodpath.hdb.carpark.info.api.url.2}")
    private String CARPARK_INFO_API_URL_2;

    @Override
    public void getCarParkInfoData(RestTemplate restTemplate, String offsetURL) {
        ResponseEntity<CarParkInfoResDTO> response = null;
        try {
            response = restTemplate.getForEntity(
                    CARPARK_INFO_API_URL_1 +
                    (
                        (offsetURL == null)?  CARPARK_INFO_API_URL_2 : offsetURL
                    ),
                    CarParkInfoResDTO.class
            );
        } catch (HttpClientErrorException e) {
            log.error("HttpClientErrorException: {}", e.getMessage());
        }

        if (response != null && response.getStatusCode().is2xxSuccessful()) {
            log.info("Response from Data.Gov (HDB): {} ", response.getBody());
            ingestCarParkInfoData(response.getBody());
            long offsetVal = extractOffsetValueFromURL(response.getBody().getResult().get_links().getNext());
            if (
                response.getBody().getResult() != null &&
                response.getBody().getResult().get_links() != null &&
                response.getBody().getResult().get_links().getNext() != null &&
                !response.getBody().getResult().get_links().getNext().isBlank() && // if next link is provided
                response.getBody().getResult().getTotal() != null &&
                offsetVal != -1L &&
                response.getBody().getResult().getTotal() > offsetVal // and if total results is more than offset value
            ) {
                getCarParkInfoData(restTemplate, response.getBody().getResult().get_links().getNext()); // recursive call to retrieve other pages
            }
        } else {
            log.error("Failed to retrieve carpark information data from Data.Gov (NEA) on {}", LocalDateTime.now());
        }
    }

    private long extractOffsetValueFromURL(String offsetURL) {
        long offsetValue = -1L;
        try {
            offsetValue = Long.parseLong(offsetURL.substring(offsetURL.indexOf("offset=")).substring(7));
        } catch(NumberFormatException e) {
            log.error("Failed to convert offsetValue to Long. NumberFormatException: {}", e.getMessage());
        }
        return offsetValue;
    }

    private void ingestCarParkInfoData(CarParkInfoResDTO response) {
        log.info("ingestCarParkInfoData(): {}", response.toString());
        if (
            response.getResult() != null &&
            response.getResult().getRecords() != null &&
            !response.getResult().getRecords().isEmpty()
        ) {
            for (CarParkInfoResRecordsDTO record : response.getResult().getRecords()) {
                brokerService.sendDataToBroker(
                    new CarParkInfoTopicDTO(
                        record.getCar_park_no(),
                        record.getAddress(),
                        record.getX_coord(),
                        record.getY_coord(),
                        record.getCar_park_type(),
                        record.getType_of_parking_system(),
                        record.getShort_term_parking(),
                        record.getFree_parking(),
                        record.getNight_parking(),
                        record.getCar_park_decks(),
                        record.getGantry_height(),
                        record.getCar_park_basement()
                    )
                );
            }
        }
    }

    @Override
    public void saveCarParkInfoData(CarParkInfoTopicDTO data) {
        CarParkInfoTopic carParkTopic;
        List<CarParkInfoTopic> carParkInfoList = carParkInfoRepository.findAllByCarParkNo(data.getCarParkNo());
        String action;
        if (carParkInfoList == null || carParkInfoList.isEmpty()) {
            action = "saved";
            carParkTopic = new CarParkInfoTopic();
        } else if (carParkInfoList.size() > 1) {
            log.error("Duplicate records detected in database. Skipping saving of record. Check record for Car Park No: {}", data.getCarParkNo());
            return;
        } else {
            action = "updated";
            carParkTopic = carParkInfoList.get(0);
        }
        carParkTopic.setCarParkNo(data.getCarParkNo());
        carParkTopic.setAddress(data.getAddress());
        carParkTopic.setXCoord(data.getXCoord());
        carParkTopic.setYCoord(data.getYCoord());
        carParkTopic.setCarParkType(data.getCarParkType());
        carParkTopic.setTypeOfParkingSystem(data.getTypeOfParkingSystem());
        carParkTopic.setShortTermParking(data.getShortTermParking());
        carParkTopic.setFreeParking(data.getFreeParking());
        carParkTopic.setNightParking(data.getNightParking());
        carParkTopic.setCarParkDecks(data.getCarParkDecks());
        carParkTopic.setGantryHeight(data.getGantryHeight());
        carParkTopic.setCarParkBasement(data.getCarParkBasement());
        carParkTopic = carParkInfoRepository.save(carParkTopic);
        log.info("Carpark information data {} in database - car park no {}: {}", action, carParkTopic.getCarParkNo(), carParkTopic);
    }

    // TODO
    @Override
    public void getCarParkAvailData(RestTemplate restTemplate) {
        /*ResponseEntity<CarParkAvailResDTO> response = null;
        try {
            response = restTemplate.getForEntity(
                    CARPARK_INFO_API_URL,
                    CarParkAvailResDTO.class
            );
        } catch (HttpClientErrorException e) {
            log.error("HttpClientErrorException: {}", e.getMessage());
        }

        if (response != null && response.getStatusCode().is2xxSuccessful()) {
            log.info("Response from Data.Gov (HDB): {} ", response.getBody());
            // ingestCarParkAvailData(response.getBody());
        } else {
            log.error("Failed to retrieve carpark availability data from Data.Gov (NEA) on {}", LocalDateTime.now());
        }*/
    }
}
