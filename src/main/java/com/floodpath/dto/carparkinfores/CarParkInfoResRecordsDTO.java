package com.floodpath.dto.carparkinfores;

import lombok.Data;

@Data
public class CarParkInfoResRecordsDTO {
    private Long _id;
    private String car_park_no;
    private String address;
    private String x_coord;
    private String y_coord;
    private String car_park_type;
    private String type_of_parking_system;
    private String short_term_parking;
    private String free_parking;
    private String night_parking;
    private String car_park_decks;
    private String gantry_height;
    private String car_park_basement;
}
