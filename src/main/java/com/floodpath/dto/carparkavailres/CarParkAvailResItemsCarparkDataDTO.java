package com.floodpath.dto.carparkavailres;

import lombok.Data;

import java.util.List;

@Data
public class CarParkAvailResItemsCarparkDataDTO {
    List<CarParkAvailResItemsCarparkDataCarparkInfoDTO> carpark_info;
    private String carpark_number;
    private String update_datetime;
}
