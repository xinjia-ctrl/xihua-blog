package com.xihua.blog.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "blog")
public class BlogProperties {
    private String sourcePosts;

    public String getSourcePosts() {
        return sourcePosts;
    }

    public void setSourcePosts(String sourcePosts) {
        this.sourcePosts = sourcePosts;
    }
}
