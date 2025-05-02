package com.floodpath.dto.carparkavailres;

import lombok.Data;

import java.util.List;

@Data
public class CarParkAvailResItemsDTO {
    private String timestamp;
    private List<CarParkAvailResItemsCarparkDataDTO> carpark_data;
}
