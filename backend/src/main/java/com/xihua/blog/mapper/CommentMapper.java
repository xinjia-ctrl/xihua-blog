package com.xihua.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xihua.blog.entity.Comment;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CommentMapper extends BaseMapper<Comment> {
}
