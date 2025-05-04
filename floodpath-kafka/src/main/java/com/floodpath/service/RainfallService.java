package com.floodpath.service;

import com.floodpath.dto.RainfallTopicDTO;
import org.springframework.web.client.RestTemplate;

public interface RainfallService {
    void getRainfallData(RestTemplate restTemplate);
    void saveRainfallData(RainfallTopicDTO data);
}
