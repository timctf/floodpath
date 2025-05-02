package com.floodpath.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CarParkInfoTopicDTO {
    private String carParkNo;
    private String address;
    private String xCoord;
    private String yCoord;
    private String carParkType;
    private String typeOfParkingSystem;
    private String shortTermParking;
    private String freeParking;
    private String nightParking;
    private String carParkDecks;
    private String gantryHeight;
    private String carParkBasement;
}
