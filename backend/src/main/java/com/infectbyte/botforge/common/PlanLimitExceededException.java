package com.infectbyte.botforge.common;

public class PlanLimitExceededException extends RuntimeException {
    public PlanLimitExceededException(String message) {
        super(message);
    }
}
