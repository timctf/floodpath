package com.floodpath.controller;

import com.floodpath.dto.AdhocRequestDTO;
import com.floodpath.service.BrokerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/v1/")
@Slf4j
public class BrokerController {

    private final BrokerService brokerService;

    @PostMapping("/send")
    public void sendData(@Valid @RequestBody AdhocRequestDTO request) {
        brokerService.sendDataToBroker(request.getData());
    }
}
