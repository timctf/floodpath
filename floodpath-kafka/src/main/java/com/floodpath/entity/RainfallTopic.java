package com.floodpath.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "TBL_RAINFALL_DATA")
public class RainfallTopic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "RECORDEDDATETIME")
    private LocalDateTime recordedDateTime;

    @Column(name = "STATIONID")
    private String stationId;

    @Column(name = "AREANAME")
    private String areaName;

    @Column(name = "LATITUDE")
    private BigDecimal latitude;

    @Column(name = "LONGITUDE")
    private BigDecimal longitude;

    @Column(name = "VALUE")
    private Long value;
}
