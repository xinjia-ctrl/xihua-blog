package com.xihua.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xihua.blog.entity.Stats;
import com.xihua.blog.mapper.StatsMapper;
import com.xihua.blog.service.ArticleService;
import com.xihua.blog.service.CommentService;
import com.xihua.blog.service.StatsService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class StatsServiceImpl implements StatsService {

    private final StatsMapper statsMapper;
    private final ArticleService articleService;
    private final CommentService commentService;

    public StatsServiceImpl(StatsMapper statsMapper, ArticleService articleService, CommentService commentService) {
        this.statsMapper = statsMapper;
        this.articleService = articleService;
        this.commentService = commentService;
    }

    @Override
    public Map<String, Object> getOverview() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("articleCount", articleService.getArticleCount());
        map.put("commentCount", commentService.getCommentCount());

        Long totalPV = statsMapper.selectList(null).stream()
                .mapToLong(Stats::getPageViews).sum();
        map.put("totalPV", totalPV);

        Long totalUV = statsMapper.selectList(null).stream()
                .mapToLong(Stats::getUniqueVisitors).sum();
        map.put("totalUV", totalUV);

        return map;
    }

    @Override
    public Object getDailyStats(LocalDate start, LocalDate end) {
        return statsMapper.selectList(
                new LambdaQueryWrapper<Stats>()
                        .between(Stats::getStatDate, start, end)
                        .orderByAsc(Stats::getStatDate));
    }
}
