package com.floodpath.dto.carparkavailres;

import lombok.Data;

import java.util.List;

@Data
public class CarParkAvailResDTO {
    private List<CarParkAvailResItemsDTO> items;
}
