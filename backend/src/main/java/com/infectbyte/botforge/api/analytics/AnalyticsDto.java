package com.infectbyte.botforge.api.analytics;

import java.util.List;
import java.util.Map;

public record AnalyticsDto(
        // Summary cards
        long totalConversations,
        long totalMessages,
        long totalLeads,
        long unansweredQuestions,
        double avgResponseMs,
        double unansweredRate,

        // Today
        long conversationsToday,
        long leadsToday,
        long messagesToday,

        // Daily chart data (last 7 days)
        List<DailyStat> dailyStats,

        // Breakdowns
        Map<String, Long> channelBreakdown,
        Map<String, Long> leadStatusBreakdown,

        // Top unanswered questions
        List<String> topUnansweredQuestions
) {
    public record DailyStat(String date, long conversations, long messages, long leads) {}
}
