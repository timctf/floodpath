package com.floodpath.dto.rainfalldatares;

import com.floodpath.dto.AdhocRequestDTO;
import lombok.Data;

@Data
public class RainfallDataResDataStationsDTO {
    private String id;
    private String deviceId;
    private String name;
    private RainfallDataResDataStationsLocDTO location;
}
