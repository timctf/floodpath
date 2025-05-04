package com.floodpath.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CarParkAvailTopicDTO {
    private String carParkNo;
    private LocalDateTime recordedDateTime;
    private String totalLots;
    private String lotsAvailable;
    private String lotType;
}
