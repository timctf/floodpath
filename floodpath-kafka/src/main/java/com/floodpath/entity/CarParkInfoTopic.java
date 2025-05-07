package com.floodpath.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "TBL_CARPARK_INFO_DATA")
public class CarParkInfoTopic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "CARPARKNO")
    private String carParkNo; // supposedly unique

    @Column(name = "ADDRESS")
    private String address;

    @Column(name = "XCOORD")
    private String xCoord;

    @Column(name = "YCOORD")
    private String yCoord;

    @Column(name = "CARPARKTYPE")
    private String carParkType;

    @Column(name = "TYPEOFPARKINGSYSTEM")
    private String typeOfParkingSystem;

    @Column(name = "SHORTTERMPARKING")
    private String shortTermParking;

    @Column(name = "FREEPARKING")
    private String freeParking;

    @Column(name = "NIGHTPARKING")
    private String nightParking;

    @Column(name = "CARPARKDECKS")
    private String carParkDecks;

    @Column(name = "GANTRYHEIGHT")
    private String gantryHeight;

    @Column(name = "CARPARKBASEMENT")
    private String carParkBasement;

    @Column(name = "LATITUDE")
    private String latitude;

    @Column(name = "LONGITUDE")
    private String longitude;
}
