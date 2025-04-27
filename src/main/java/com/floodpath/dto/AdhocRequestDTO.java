package com.floodpath.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdhocRequestDTO {
    @NotNull(message = "data is null")
    private String data;
}
