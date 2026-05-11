package com.xihua.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.xihua.blog.entity.Comment;
import com.xihua.blog.mapper.CommentMapper;
import com.xihua.blog.service.CommentService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class CommentServiceImpl implements CommentService {

    private final CommentMapper commentMapper;

    public CommentServiceImpl(CommentMapper commentMapper) {
        this.commentMapper = commentMapper;
    }

    @Override
    public IPage<Comment> getCommentsByArticle(String articleId, int page, int size) {
        return commentMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Comment>()
                        .eq(Comment::getArticleId, articleId)
                        .eq(Comment::getStatus, "approved")
                        .orderByAsc(Comment::getCreatedAt));
    }

    @Override
    public Comment createComment(String articleId, String author, String email, String content, Long parentId, String ip) {
        // 幂等性检查：同一用户对同一文章 60 秒内提交相同内容视为重复
        Comment existing = commentMapper.selectOne(
                new LambdaQueryWrapper<Comment>()
                        .eq(Comment::getArticleId, articleId)
                        .eq(Comment::getAuthor, author)
                        .eq(Comment::getContent, content)
                        .ge(Comment::getCreatedAt, LocalDateTime.now().minusSeconds(60))
                        .last("LIMIT 1"));
        if (existing != null) {
            throw new IllegalArgumentException("请勿重复提交评论");
        }

        Comment comment = new Comment();
        comment.setArticleId(articleId);
        comment.setAuthor(author);
        comment.setEmail(email);
        comment.setContent(content);
        comment.setParentId(parentId);
        comment.setIp(ip);
        comment.setStatus("pending");
        commentMapper.insert(comment);
        return comment;
    }

    @Override
    public IPage<Comment> getAdminComments(int page, int size, String status) {
        LambdaQueryWrapper<Comment> wrapper = new LambdaQueryWrapper<>();
        if (status != null && !status.isEmpty()) {
            wrapper.eq(Comment::getStatus, status);
        }
        wrapper.orderByDesc(Comment::getCreatedAt);
        return commentMapper.selectPage(new Page<>(page, size), wrapper);
    }

    @Override
    public void updateCommentStatus(Long id, String status) {
        Comment comment = commentMapper.selectById(id);
        if (comment != null) {
            comment.setStatus(status);
            commentMapper.updateById(comment);
        }
    }

    @Override
    public void deleteComment(Long id) {
        commentMapper.deleteById(id);
    }

    @Override
    public long getCommentCount() {
        return commentMapper.selectCount(null);
    }
}
