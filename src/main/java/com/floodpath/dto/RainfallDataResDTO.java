package com.floodpath.dto;

import com.floodpath.dto.rainfalldatares.RainfallDataResDataDTO;
import lombok.Data;

@Data
public class RainfallDataResDTO {
    private Long code;
    private String errorMsg;
    private RainfallDataResDataDTO data;
}
