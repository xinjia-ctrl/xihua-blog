package com.xihua.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CommentRequest {
    @NotBlank(message = "文章ID不能为空")
    private String articleId;

    private String email;

    @NotBlank(message = "评论内容不能为空")
    @Size(max = 2000, message = "评论最长2000字")
    private String content;

    private Long parentId;
}
