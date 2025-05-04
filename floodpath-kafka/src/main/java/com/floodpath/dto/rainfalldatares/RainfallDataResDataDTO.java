package com.floodpath.dto.rainfalldatares;

import lombok.Data;

import java.util.List;

@Data
public class RainfallDataResDataDTO {
    private List<RainfallDataResDataStationsDTO> stations;
    private List<RainfallDataResDataReadingsDTO> readings;
    private String readingType;
    private String readingUnit;
    private String paginationToken;
}
