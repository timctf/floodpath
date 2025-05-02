package com.floodpath.service;

import com.floodpath.dto.CarParkInfoTopicDTO;
import org.springframework.web.client.RestTemplate;

public interface CarParkService {
    void getCarParkInfoData(RestTemplate restTemplate, String offsetURL);
    void getCarParkAvailData(RestTemplate restTemplate);
    void saveCarParkInfoData(CarParkInfoTopicDTO data);
}
