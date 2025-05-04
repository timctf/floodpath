package com.floodpath.dto.carparkinfores;

import lombok.Data;

import java.util.List;

@Data
public class CarParkInfoResResultDTO {
    private String resource_id;
    private List<CarParkInfoResResultFieldsDTO> fields;
    private List<CarParkInfoResRecordsDTO> records;
    private CarParkInfoResLinksDTO _links;
    private Long total;
}
