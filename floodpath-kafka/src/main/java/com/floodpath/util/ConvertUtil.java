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
    private final String TOKEN = "<YOUR_ONE_MAP_TOKEN>";

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
