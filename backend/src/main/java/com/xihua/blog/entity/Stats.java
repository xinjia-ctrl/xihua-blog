package com.xihua.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDate;

@Data
@TableName("xh_stat")
public class Stats {
    @TableId(type = IdType.AUTO)
    private Long id;
    private LocalDate statDate;
    private Long pageViews;
    private Long uniqueVisitors;
}
