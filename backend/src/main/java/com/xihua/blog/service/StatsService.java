package com.xihua.blog.service;

import java.time.LocalDate;
import java.util.Map;

public interface StatsService {
    void recordVisit(String ip, String userAgent);
    Map<String, Object> getOverview();
    Object getDailyStats(LocalDate start, LocalDate end);
}
