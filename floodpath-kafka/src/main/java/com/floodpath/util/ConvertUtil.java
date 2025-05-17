package com.floodpath.util;

import com.floodpath.dto.LatLongDTO;
import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@UtilityClass
@Slf4j
public class ConvertUtil {
    private final String CONVERT_URL = "https://www.onemap.gov.sg/api/common/convert/3414to4326?X={x}&Y={y}";
    private final String TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzOGQ1OTk1MzkzZTg0NWQ4NTcwMzI0MzIzNGMxZGQ1OSIsImlzcyI6Imh0dHA6Ly9pbnRlcm5hbC1hbGItb20tcHJkZXppdC1pdC1uZXctMTYzMzc5OTU0Mi5hcC1zb3V0aGVhc3QtMS5lbGIuYW1hem9uYXdzLmNvbS9hcGkvdjIvdXNlci9wYXNzd29yZCIsImlhdCI6MTc0NzQ2MDgzNSwiZXhwIjoxNzQ3NzIwMDM1LCJuYmYiOjE3NDc0NjA4MzUsImp0aSI6IkNuSTY4Uk9DREk0d0p0ZEUiLCJ1c2VyX2lkIjo2OTA1LCJmb3JldmVyIjpmYWxzZX0.H3nWZHxELqC_09mxm1DKH_QQeAy8bMB86JIW6uA0U0Q";

    public LatLongDTO convertXYToLatLong(String x, String y) throws InterruptedException {
        Thread.sleep(1000); // prevent 429 TOO MANY REQUESTS
        RestTemplate restTemplate = new RestTemplate();
        String finalURL = CONVERT_URL.replace("{x}", x).replace("{y}", y);
        ResponseEntity<LatLongDTO> response = null;
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", TOKEN);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        try {
            response = restTemplate.exchange(finalURL, HttpMethod.GET, entity, LatLongDTO.class);
        } catch (HttpClientErrorException e) {
            log.error("(convertXYToLatLong()) HttpClientErrorException: {}", e.getMessage());
        }
        if (response != null && response.getStatusCode().is2xxSuccessful()) {
            return response.getBody();
        }
        return null;
    }
}
