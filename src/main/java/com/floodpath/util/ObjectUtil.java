package com.floodpath.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;

@UtilityClass
@Slf4j
public class ObjectUtil {
    public static <T> T convertJsonToObject(String jsonString, Class<T> targetClass) {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        try {
            return objectMapper.readValue(jsonString, targetClass);
        } catch (IOException e) {
            log.info("Error converting JSON to Object: {}", e.getMessage());
        }
        return null;
    }
}
