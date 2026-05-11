package com.xihua.blog.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.xihua.blog.entity.Article;

public interface ArticleService {
    IPage<Article> getAdminArticles(int page, int size);
    Article getArticleById(Long id);
    void createArticle(Article article);
    void updateArticle(Article article);
    void deleteArticle(Long id);
    void regenerate();
    void syncArticle(String title, String slug, String category, String tags, String summary);
    long getArticleCount();
}
