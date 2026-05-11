package com.xihua.blog.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.xihua.blog.common.Result;
import com.xihua.blog.dto.CommentRequest;
import com.xihua.blog.entity.Comment;
import com.xihua.blog.service.CommentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    public Result<Map<String, Object>> list(
            @RequestParam String article,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        IPage<Comment> result = commentService.getCommentsByArticle(article, page, size);
        return Result.success(Map.of(
                "items", result.getRecords(),
                "total", result.getTotal(),
                "page", result.getCurrent(),
                "totalPages", result.getPages()
        ));
    }

    @PostMapping
    public Result<Comment> create(@Valid @RequestBody CommentRequest request,
                                   HttpServletRequest httpRequest) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        String ip = httpRequest.getRemoteAddr();
        Comment comment = commentService.createComment(
                request.getArticleId(),
                username,
                request.getEmail(),
                request.getContent(),
                request.getParentId(),
                ip
        );
        return Result.success(comment);
    }
}
