package com.xihua.blog.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.xihua.blog.entity.Comment;

import java.util.List;

public interface CommentService {
    IPage<Comment> getCommentsByArticle(String articleId, int page, int size);
    Comment createComment(String articleId, String author, String email, String content, Long parentId, String ip);
    IPage<Comment> getAdminComments(int page, int size, String status);
    void updateCommentStatus(Long id, String status);
    void deleteComment(Long id);
    long getCommentCount();
}
