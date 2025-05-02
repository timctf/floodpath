package com.floodpath.service.impl;

import com.floodpath.service.CarParkService;
import com.floodpath.service.CommonService;
import com.floodpath.service.RainfallService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Timer;
import java.util.TimerTask;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class CommonServiceImpl implements CommonService {

    private final RainfallService rainfallService;
    private final CarParkService carParkService;


    @Value("${floodpath.nea.rainfall.api.enable}")
    private Boolean NEA_RAINFALL_API_ENABLE;

    @Value("${floodpath.nea.rainfall.api.interval}")
    private Long NEA_RAINFALL_API_INTERVAL;

    @Value("${floodpath.hdb.carpark.info.api.enable}")
    private Boolean CARPARK_INFO_API_ENABLE;

    @Value("${floodpath.hdb.carpark.info.api.interval}")
    private Long CARPARK_INFO_API_INTERVAL;

    @Value("${floodpath.hdb.carpark.avail.api.enable}")
    private Boolean CARPARK_AVAIL_API_ENABLE;

    @Value("${floodpath.hdb.carpark.avail.api.interval}")
    private Long CARPARK_AVAIL_API_INTERVAL;

    @Override
    public void pollDataSources() {
        Timer timer = new Timer();
        RestTemplate restTemplate = new RestTemplate();

        // Rainfall data - Data.Gov (NEA)
        if (Boolean.TRUE.equals(NEA_RAINFALL_API_ENABLE)) {
            timer.schedule(new TimerTask() {
                @Override
                public void run() {
                    rainfallService.getRainfallData(restTemplate);
                }
            }, 0, NEA_RAINFALL_API_INTERVAL * 1000);
        }

        // Carpark info data - Data.Gov (HDB)
        if (Boolean.TRUE.equals(CARPARK_INFO_API_ENABLE)) {
            timer.schedule(new TimerTask() {
                @Override
                public void run() {
                    carParkService.getCarParkInfoData(restTemplate, null);
                }
            }, 0, CARPARK_INFO_API_INTERVAL * 1000);
        }

        // Carpark availability data
        if (Boolean.TRUE.equals(CARPARK_AVAIL_API_ENABLE)) {
            timer.schedule(new TimerTask() {
                @Override
                public void run() {
                    carParkService.getCarParkAvailData(restTemplate);
                }
            }, 0, CARPARK_AVAIL_API_INTERVAL * 1000);
        }
    }
}
