package com.floodpath.dto.rainfalldatares;

import lombok.Data;

import java.util.List;

@Data
public class RainfallDataResDataReadingsDTO {
    private String timestamp;
    private List<RainfallDataResDataReadingsDataDTO> data;
}
