package com.floodpath.service.impl;

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

    @Value("${floodpath.nea.rainfall.api.interval}")
    private Long NEA_RAINFALL_API_INTERVAL;

    @Override
    public void pollDataSources() {
        Timer timer = new Timer();
        RestTemplate restTemplate = new RestTemplate();

        // Rainfall data - Data.Gov (NEA)
        timer.schedule(new TimerTask() {
            @Override
            public void run() {
                rainfallService.getRainfallData(restTemplate);
            }
        }, 0, NEA_RAINFALL_API_INTERVAL * 1000);
    }
}
