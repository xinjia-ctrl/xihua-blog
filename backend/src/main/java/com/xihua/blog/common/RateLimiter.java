package com.xihua.blog.common;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimiter {

    private final Map<String, Map<Long, AtomicInteger>> buckets = new ConcurrentHashMap<>();

    /**
     * 检查某个 key（如 IP）在时间窗口内的请求是否超过限制
     *
     * @param key       限流 key（通常为 IP）
     * @param windowMs  时间窗口（毫秒），如 60000 表示 1 分钟
     * @param maxRequests 窗口内允许的最大请求数
     * @return true = 允许通过，false = 已被限流
     */
    public boolean tryAcquire(String key, long windowMs, int maxRequests) {
        long now = System.currentTimeMillis();
        long slot = now / windowMs;

        Map<Long, AtomicInteger> windowMap = buckets.computeIfAbsent(key, k -> new ConcurrentHashMap<>());
        AtomicInteger counter = windowMap.computeIfAbsent(slot, s -> new AtomicInteger(0));

        int count = counter.incrementAndGet();

        // 清理过期槽位（仅当当前槽位计数为 1 时触发清理）
        if (count == 1) {
            cleanExpiredSlots(key, slot);
        }

        return count <= maxRequests;
    }

    private void cleanExpiredSlots(String key, long currentSlot) {
        Map<Long, AtomicInteger> windowMap = buckets.get(key);
        if (windowMap == null) return;

        windowMap.keySet().removeIf(slot -> slot < currentSlot);
    }

    /** 获取某个 key 当前窗口的请求计数 */
    public int getCurrentCount(String key, long windowMs) {
        long slot = System.currentTimeMillis() / windowMs;
        Map<Long, AtomicInteger> windowMap = buckets.get(key);
        if (windowMap == null) return 0;
        AtomicInteger counter = windowMap.get(slot);
        return counter != null ? counter.get() : 0;
    }
}
