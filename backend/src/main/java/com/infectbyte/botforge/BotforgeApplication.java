package com.infectbyte.botforge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class BotforgeApplication {

    public static void main(String[] args) {
        SpringApplication.run(BotforgeApplication.class, args);
    }
}
