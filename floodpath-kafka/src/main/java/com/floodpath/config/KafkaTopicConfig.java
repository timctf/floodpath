package com.floodpath.config;

import com.floodpath.constants.AppConstants;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic adhocTopic() {
        return TopicBuilder.name(AppConstants.ADHOC_TOPIC_NAME).build();
    }

    @Bean
    public NewTopic rainfallTopic() {
        return TopicBuilder.name(AppConstants.RAINFALL_TOPIC_NAME).build();
    }
}
