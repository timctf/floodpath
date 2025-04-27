package com.floodpath;

import com.floodpath.service.RainfallService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class FloodPathKafkaApplication {

	public static void main(String[] args) {
		SpringApplication.run(FloodPathKafkaApplication.class, args);
	}

	@Bean
	CommandLineRunner commandLineRunner(RainfallService rainfallService) {
		return args -> {
			rainfallService.pollRainfallData();
		};
	}
}
