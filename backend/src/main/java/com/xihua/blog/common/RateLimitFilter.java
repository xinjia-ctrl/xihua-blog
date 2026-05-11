package com.xihua.blog.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimiter rateLimiter;

    private static final int LOGIN_MAX = 5;
    private static final int COMMENT_MAX = 10;
    private static final int ADMIN_MAX = 30;
    private static final int API_MAX = 60;
    private static final long WINDOW_MS = 60_000L;

    public RateLimitFilter(RateLimiter rateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String ip = resolveClientIp(request);
        String path = request.getRequestURI();
        String method = request.getMethod();

        int maxRequests = resolveLimit(path, method);

        if (!rateLimiter.tryAcquire(ip, WINDOW_MS, maxRequests)) {
            response.setStatus(429);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":429,\"message\":\"请求过于频繁，请稍后再试\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String xri = request.getHeader("X-Real-IP");
        if (xri != null && !xri.isBlank()) {
            return xri;
        }
        return request.getRemoteAddr();
    }

    private int resolveLimit(String path, String method) {
        if (path.contains("/api/auth/")) {
            return LOGIN_MAX;
        }
        if (path.contains("/api/comments") && "POST".equalsIgnoreCase(method)) {
            return COMMENT_MAX;
        }
        if (path.contains("/api/admin/")) {
            return ADMIN_MAX;
        }
        return API_MAX;
    }
}
