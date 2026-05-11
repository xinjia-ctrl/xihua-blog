package com.xihua.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("xh_article")
public class Article {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String title;
    private String slug;
    private String category;
    private String tags;
    private String summary;
    private String content;
    private String status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
