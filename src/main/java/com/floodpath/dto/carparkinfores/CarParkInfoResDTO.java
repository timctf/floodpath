package com.floodpath.dto.carparkinfores;

import lombok.Data;

import java.util.List;

@Data
public class CarParkInfoResDTO {
    private String help;
    private Boolean success;
    private CarParkInfoResResultDTO result;
}
