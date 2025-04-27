package com.floodpath.dto;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RainfallTopicDTO {
    private LocalDateTime recordedDateTime;
    private String stationId;
    private String areaName;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Long value;
}
