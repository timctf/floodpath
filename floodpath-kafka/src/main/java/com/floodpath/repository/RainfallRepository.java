package com.floodpath.repository;

import com.floodpath.entity.RainfallTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RainfallRepository extends JpaRepository<RainfallTopic, Long> {
    List<RainfallTopic> findAllByStationIdAndRecordedDateTime(String stationId, LocalDateTime recordedDateTime);
}
