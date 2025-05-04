package com.floodpath.service.impl;

import com.floodpath.constants.AppConstants;
import com.floodpath.dto.RainfallDataResDTO;
import com.floodpath.dto.RainfallTopicDTO;
import com.floodpath.dto.rainfalldatares.RainfallDataResDataStationsDTO;
import com.floodpath.entity.RainfallTopic;
import com.floodpath.repository.RainfallRepository;
import com.floodpath.service.BrokerService;
import com.floodpath.service.RainfallService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class RainfallServiceImpl implements RainfallService {

    private final BrokerService brokerService;
    private final RainfallRepository rainfallRepository;

    @Value("${floodpath.nea.rainfall.api.url}")
    private String NEA_RAINFALL_API_URL;

    @Override
    public void getRainfallData(RestTemplate restTemplate) {
        ResponseEntity<RainfallDataResDTO> response = null;
        try {
            response = restTemplate.getForEntity(
                    NEA_RAINFALL_API_URL,
                    RainfallDataResDTO.class
            );
        } catch (HttpClientErrorException e) {
            log.error("Exception: {}", e.getMessage());
        }

        if (response != null && response.getStatusCode().is2xxSuccessful()) {
            log.info("Response from Data.Gov (NEA): {} ", response.getBody());
            ingestRainfallData(response.getBody());
        } else {
            log.error("Failed to retrieve rainfall data from Data.Gov (NEA) on {}", LocalDateTime.now());
        }
    }

    private void ingestRainfallData(RainfallDataResDTO response) {
        log.info("ingestRainfallData(): {}", response.toString());
        // processing before ingestion into kafka broker
        Map<String, RainfallDataResDataStationsDTO> stationIdToStationsMap = new HashMap<>();
        if (
            response.getData() != null &&
            response.getData().getStations() != null &&
            !response.getData().getStations().isEmpty()
        ) {
            response.getData().getStations().forEach(station -> {
                stationIdToStationsMap.put(station.getId(), station);
            });
        }
        if (
            response.getData() != null &&
            response.getData().getReadings() != null &&
            !response.getData().getReadings().isEmpty()
        ) {
            response.getData().getReadings().forEach(reading -> {
                if (!reading.getData().isEmpty()) {
                    reading.getData().forEach(readingData -> {
                        String areaName = null;
                        if (stationIdToStationsMap.containsKey(readingData.getStationId())) {
                            areaName = stationIdToStationsMap.get(readingData.getStationId()).getName();
                        }
                        BigDecimal latitude = null;
                        BigDecimal longitude = null;
                        if (
                            stationIdToStationsMap.containsKey(readingData.getStationId()) &&
                            stationIdToStationsMap.get(readingData.getStationId()).getLocation() != null &&
                            stationIdToStationsMap.get(readingData.getStationId()).getLocation().getLatitude() != null &&
                            stationIdToStationsMap.get(readingData.getStationId()).getLocation().getLongitude() != null
                        ) {
                            latitude = stationIdToStationsMap.get(readingData.getStationId()).getLocation().getLatitude();
                            longitude = stationIdToStationsMap.get(readingData.getStationId()).getLocation().getLongitude();
                        }
                        LocalDateTime recordedDateTime = null;
                        try {
                            OffsetDateTime offsetDateTime = OffsetDateTime.parse(reading.getTimestamp());
                            recordedDateTime = offsetDateTime.atZoneSameInstant(ZoneId.of(AppConstants.ZONE_ID)).toLocalDateTime();
                        } catch (DateTimeParseException e) {
                            log.error("Failed to convert timestamp in Rainfall data to LocalDateTime: {}", reading.getTimestamp());
                        }
                        if (
                            recordedDateTime != null &&
                            readingData.getStationId() != null &&
                            areaName != null &&
                            latitude != null &&
                            longitude != null &&
                            readingData.getValue() != null &&
                            !rainfallRecordsExistsInDatabase(readingData.getStationId(), recordedDateTime)
                        ) {
                            Long value = readingData.getValue();
                            if (AppConstants.MOCK_DATA && AppConstants.MOCK_DATA_STATION_ID.contains(readingData.getStationId())) {
                                value = (long) ThreadLocalRandom.current().nextInt(1, 6);
                            }
                            brokerService.sendDataToBroker(
                                new RainfallTopicDTO(
                                    recordedDateTime,
                                    readingData.getStationId(),
                                    areaName,
                                    latitude,
                                    longitude,
                                    value
                                )
                            );
                        }
                    });
                }
            });
        }
    }

    // checks if records for the stationId at the specific 5min interval timestamp exists in the database
    private boolean rainfallRecordsExistsInDatabase(String stationId, LocalDateTime recordedDateTime) {
        List<RainfallTopic> rainfallTopic = rainfallRepository.findAllByStationIdAndRecordedDateTime(stationId, recordedDateTime);
        if (rainfallTopic == null) {
            log.info(
                "Unable to determine if rainfall record already exists. Skipping record - stationId: {}, recordedDatetTime: {}",
                stationId,
                recordedDateTime
            );
            return true; // to skip record
        } else if (!rainfallTopic.isEmpty()) {
            log.info(
                "Rainfall data record already exists in database. Skipping record - stationId: {}, recordedDateTime: {}",
                stationId,
                recordedDateTime
            );
            return true;
        } else {
            return false;
        }
    }

    @Override
    public void saveRainfallData(RainfallTopicDTO data) {
        if (rainfallRecordsExistsInDatabase(data.getStationId(), data.getRecordedDateTime())) {
            return;
        }
        RainfallTopic rainfallTopic = new RainfallTopic();
        rainfallTopic.setRecordedDateTime(data.getRecordedDateTime());
        rainfallTopic.setStationId(data.getStationId());
        rainfallTopic.setAreaName(data.getAreaName());
        rainfallTopic.setLatitude(data.getLatitude());
        rainfallTopic.setLongitude(data.getLongitude());
        rainfallTopic.setValue(data.getValue());
        rainfallTopic = rainfallRepository.save(rainfallTopic);
        log.info("Rainfall data saved in database - id {}: {}", rainfallTopic.getId(), rainfallTopic);
    }
}
