package com.floodpath.repository;

import com.floodpath.entity.CarParkAvailTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CarParkAvailRepository extends JpaRepository<CarParkAvailTopic, Long> {
    List<CarParkAvailTopic> findAllByCarParkNoAndLotTypeAndRecordedDateTime(String carParkNo, String lotType, LocalDateTime recordedDateTime);
}
