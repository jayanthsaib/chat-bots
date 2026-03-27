package com.infectbyte.botforge.api.analytics;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final JdbcTemplate jdbc;

    public AnalyticsDto getOverview(UUID tenantId) {
        String tid = tenantId.toString();

        // ── Summary counts ────────────────────────────────────────────────────
        long totalConversations = count(
                "SELECT COUNT(*) FROM conversations WHERE tenant_id = ?::uuid", tid);

        long totalMessages = count(
                "SELECT COUNT(*) FROM messages WHERE tenant_id = ?::uuid AND role = 'user'", tid);

        long totalLeads = count(
                "SELECT COUNT(*) FROM leads WHERE tenant_id = ?::uuid", tid);

        long unansweredQuestions = count(
                "SELECT COUNT(*) FROM messages m " +
                "JOIN conversations c ON c.id = m.conversation_id " +
                "WHERE c.tenant_id = ?::uuid AND m.role = 'assistant' AND m.answered = false", tid);

        double avgResponseMs = queryDouble(
                "SELECT COALESCE(AVG(latency_ms), 0) FROM messages " +
                "WHERE tenant_id = ?::uuid AND role = 'assistant' AND latency_ms > 0", tid);

        long totalAssistantMessages = count(
                "SELECT COUNT(*) FROM messages WHERE tenant_id = ?::uuid AND role = 'assistant'", tid);
        double unansweredRate = totalAssistantMessages > 0
                ? (double) unansweredQuestions / totalAssistantMessages : 0.0;

        // ── Today ─────────────────────────────────────────────────────────────
        long conversationsToday = count(
                "SELECT COUNT(*) FROM conversations WHERE tenant_id = ?::uuid " +
                "AND started_at >= CURRENT_DATE", tid);

        long messagesToday = count(
                "SELECT COUNT(*) FROM messages WHERE tenant_id = ?::uuid " +
                "AND role = 'user' AND created_at >= CURRENT_DATE", tid);

        long leadsToday = count(
                "SELECT COUNT(*) FROM leads WHERE tenant_id = ?::uuid " +
                "AND created_at >= CURRENT_DATE", tid);

        // ── Daily stats (last 7 days) ─────────────────────────────────────────
        List<AnalyticsDto.DailyStat> dailyStats = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM dd");
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            String dateStr = date.toString();
            long convs = count(
                    "SELECT COUNT(*) FROM conversations WHERE tenant_id = ?::uuid " +
                    "AND DATE(started_at) = ?::date", tid, dateStr);
            long msgs = count(
                    "SELECT COUNT(*) FROM messages WHERE tenant_id = ?::uuid " +
                    "AND role = 'user' AND DATE(created_at) = ?::date", tid, dateStr);
            long leads = count(
                    "SELECT COUNT(*) FROM leads WHERE tenant_id = ?::uuid " +
                    "AND DATE(created_at) = ?::date", tid, dateStr);
            dailyStats.add(new AnalyticsDto.DailyStat(date.format(fmt), convs, msgs, leads));
        }

        // ── Channel breakdown ─────────────────────────────────────────────────
        Map<String, Long> channelBreakdown = new LinkedHashMap<>();
        jdbc.query(
                "SELECT channel, COUNT(*) as cnt FROM conversations " +
                "WHERE tenant_id = ?::uuid GROUP BY channel ORDER BY cnt DESC",
                rs -> { channelBreakdown.put(rs.getString("channel"), rs.getLong("cnt")); },
                tid);

        // ── Lead status breakdown ─────────────────────────────────────────────
        Map<String, Long> leadStatusBreakdown = new LinkedHashMap<>();
        jdbc.query(
                "SELECT status, COUNT(*) as cnt FROM leads " +
                "WHERE tenant_id = ?::uuid GROUP BY status ORDER BY cnt DESC",
                rs -> { leadStatusBreakdown.put(rs.getString("status"), rs.getLong("cnt")); },
                tid);

        // ── Top unanswered questions ──────────────────────────────────────────
        List<String> topUnanswered = new ArrayList<>();
        jdbc.query(
                "SELECT m.content FROM messages m " +
                "JOIN conversations c ON c.id = m.conversation_id " +
                "WHERE c.tenant_id = ?::uuid AND m.role = 'assistant' AND m.answered = false " +
                "ORDER BY m.created_at DESC LIMIT 5",
                rs -> {
                    String content = rs.getString("content");
                    if (content != null && content.length() > 80) content = content.substring(0, 80) + "...";
                    topUnanswered.add(content);
                },
                tid);

        return new AnalyticsDto(
                totalConversations, totalMessages, totalLeads, unansweredQuestions,
                avgResponseMs, unansweredRate,
                conversationsToday, leadsToday, messagesToday,
                dailyStats, channelBreakdown, leadStatusBreakdown, topUnanswered
        );
    }

    private long count(String sql, Object... args) {
        Long result = jdbc.queryForObject(sql, Long.class, args);
        return result != null ? result : 0L;
    }

    private double queryDouble(String sql, Object... args) {
        Double result = jdbc.queryForObject(sql, Double.class, args);
        return result != null ? result : 0.0;
    }
}
