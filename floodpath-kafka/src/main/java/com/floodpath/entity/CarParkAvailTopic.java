package com.floodpath.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "TBL_CARPARK_AVAIL_DATA")
public class CarParkAvailTopic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "CARPARKNO")
    private String carParkNo;

    @Column(name = "RECORDEDDATETIME")
    private LocalDateTime recordedDateTime;

    @Column(name = "TOTALLOTS")
    private String totalLots;

    @Column(name = "LOTSAVAILABLE")
    private String lotsAvailable;

    @Column(name = "LOTSTYPE")
    private String lotType;
}
