package com.xihua.blog.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.xihua.blog.common.Result;
import com.xihua.blog.entity.Article;
import com.xihua.blog.entity.Comment;
import com.xihua.blog.service.ArticleService;
import com.xihua.blog.service.CommentService;
import com.xihua.blog.service.StatsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final CommentService commentService;
    private final ArticleService articleService;
    private final StatsService statsService;

    public AdminController(CommentService commentService,
                           ArticleService articleService,
                           StatsService statsService) {
        this.commentService = commentService;
        this.articleService = articleService;
        this.statsService = statsService;
    }

    // --- 评论管理 ---

    @GetMapping("/comments")
    public Result<Map<String, Object>> getComments(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        IPage<Comment> result = commentService.getAdminComments(page, size, status);
        return Result.success(Map.of(
                "items", result.getRecords(),
                "total", result.getTotal(),
                "page", result.getCurrent(),
                "totalPages", result.getPages()
        ));
    }

    @PutMapping("/comments/{id}")
    public Result<Void> updateCommentStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || (!status.equals("approved") && !status.equals("rejected") && !status.equals("pending"))) {
            return Result.error(400, "无效的状态值");
        }
        commentService.updateCommentStatus(id, status);
        return Result.success();
    }

    @DeleteMapping("/comments/{id}")
    public Result<Void> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return Result.success();
    }

    // --- 文章管理 ---

    @GetMapping("/articles")
    public Result<Map<String, Object>> getArticles(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        IPage<Article> result = articleService.getAdminArticles(page, size);
        return Result.success(Map.of(
                "items", result.getRecords(),
                "total", result.getTotal(),
                "page", result.getCurrent(),
                "totalPages", result.getPages()
        ));
    }

    @PostMapping("/articles/sync")
    public Result<Void> syncArticle(@RequestBody Map<String, String> body) {
        articleService.syncArticle(
                body.get("title"),
                body.get("slug"),
                body.get("category"),
                body.get("summary")
        );
        return Result.success();
    }

    @GetMapping("/articles/{id}")
    public Result<Article> getArticle(@PathVariable Long id) {
        return Result.success(articleService.getArticleById(id));
    }

    @PostMapping("/articles")
    public Result<Void> createArticle(@RequestBody Article article) {
        articleService.createArticle(article);
        return Result.success();
    }

    @PutMapping("/articles/{id}")
    public Result<Void> updateArticle(@PathVariable Long id, @RequestBody Article article) {
        article.setId(id);
        articleService.updateArticle(article);
        return Result.success();
    }

    @DeleteMapping("/articles/{id}")
    public Result<Void> deleteArticle(@PathVariable Long id) {
        articleService.deleteArticle(id);
        return Result.success();
    }

    @PostMapping("/articles/regenerate")
    public Result<Void> regenerate() {
        articleService.regenerate();
        return Result.success();
    }

    // --- 统计 ---

    @GetMapping("/stats/overview")
    public Result<Map<String, Object>> getOverview() {
        return Result.success(statsService.getOverview());
    }

    @GetMapping("/stats/daily")
    public Result<?> getDailyStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return Result.success(statsService.getDailyStats(start, end));
    }
}
