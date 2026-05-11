package com.xihua.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("xh_comment")
public class Comment {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String articleId;
    private String author;
    private String email;
    private String content;
    private Long parentId;
    private String status;
    private String ip;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
