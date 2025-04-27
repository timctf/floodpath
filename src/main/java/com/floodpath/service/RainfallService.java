package com.floodpath.service;

import com.floodpath.dto.RainfallTopicDTO;

public interface RainfallService {
    void pollRainfallData();
    void saveRainfallData(RainfallTopicDTO data);
}
