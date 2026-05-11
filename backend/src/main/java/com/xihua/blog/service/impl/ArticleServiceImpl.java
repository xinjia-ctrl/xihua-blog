package com.xihua.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.xihua.blog.config.BlogProperties;
import com.xihua.blog.entity.Article;
import com.xihua.blog.mapper.ArticleMapper;
import com.xihua.blog.service.ArticleService;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

@Service
public class ArticleServiceImpl implements ArticleService {

    private final ArticleMapper articleMapper;
    private final BlogProperties blogProperties;

    public ArticleServiceImpl(ArticleMapper articleMapper, BlogProperties blogProperties) {
        this.articleMapper = articleMapper;
        this.blogProperties = blogProperties;
    }

    @Override
    public IPage<Article> getAdminArticles(int page, int size) {
        return articleMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Article>()
                        .select(Article.class, info -> !info.getColumn().equals("content"))
                        .orderByDesc(Article::getCreatedAt));
    }

    @Override
    public Article getArticleById(Long id) {
        return articleMapper.selectById(id);
    }

    @Override
    public void createArticle(Article article) {
        article.setCreatedAt(null);
        article.setUpdatedAt(null);
        if (article.getStatus() == null) article.setStatus("published");
        articleMapper.insert(article);
        writeMdFile(article);
    }

    @Override
    public void updateArticle(Article article) {
        article.setUpdatedAt(null);
        articleMapper.updateById(article);
        Article full = articleMapper.selectById(article.getId());
        if (full != null) writeMdFile(full);
    }

    @Override
    public void deleteArticle(Long id) {
        Article article = articleMapper.selectById(id);
        if (article != null) {
            deleteMdFile(article);
            articleMapper.deleteById(id);
        }
    }

    @Override
    public void syncArticle(String title, String slug, String category, String tags, String summary) {
        Article existing = articleMapper.selectOne(
                new LambdaQueryWrapper<Article>().eq(Article::getSlug, slug));
        if (existing != null) {
            existing.setTitle(title);
            existing.setCategory(category);
            existing.setTags(tags);
            existing.setSummary(summary);
            articleMapper.updateById(existing);
        } else {
            Article article = new Article();
            article.setTitle(title);
            article.setSlug(slug);
            article.setCategory(category);
            article.setTags(tags);
            article.setSummary(summary);
            article.setStatus("published");
            articleMapper.insert(article);
        }
    }

    @Override
    public long getArticleCount() {
        return articleMapper.selectCount(null);
    }

    private void validateSlug(String slug) {
        if (slug == null || slug.isBlank()) {
            throw new IllegalArgumentException("slug 不能为空");
        }
        if (!slug.matches("[a-zA-Z0-9_\\-]+")) {
            throw new IllegalArgumentException("slug 只能包含字母、数字、下划线和连字符");
        }
    }

    private void writeMdFile(Article article) {
        try {
            validateSlug(article.getSlug());
            Path dir = Paths.get(blogProperties.getSourcePosts());
            Files.createDirectories(dir);
            String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            StringBuilder md = new StringBuilder();
            md.append("---\n");
            md.append("title: ").append(article.getTitle()).append("\n");
            md.append("date: ").append(date).append("\n");
            if (article.getCategory() != null && !article.getCategory().isBlank()) {
                md.append("categories: ").append(article.getCategory()).append("\n");
            }
            if (article.getTags() != null && !article.getTags().isBlank()) {
                md.append("tags: [").append(article.getTags()).append("]\n");
            }
            md.append("---\n\n");
            if (article.getContent() != null) {
                md.append(article.getContent());
            }
            Path file = dir.resolve(article.getSlug() + ".md");
            Files.writeString(file, md.toString(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("写入文章文件失败: " + e.getMessage(), e);
        }
    }

    private void deleteMdFile(Article article) {
        try {
            validateSlug(article.getSlug());
            Path file = Paths.get(blogProperties.getSourcePosts(), article.getSlug() + ".md");
            Files.deleteIfExists(file);
        } catch (IOException e) {
            throw new RuntimeException("删除文章文件失败: " + e.getMessage(), e);
        }
    }

    @Override
    public void regenerate() {
        try {
            Path sourcePosts = Paths.get(blogProperties.getSourcePosts());
            Path dir = sourcePosts.getParent();
            if (dir == null) throw new RuntimeException("无法确定博客根目录");
            dir = dir.getParent(); // source/_posts -> source -> 博客根目录
            ProcessBuilder pb = new ProcessBuilder();
            pb.command("npx", "hexo", "generate");
            pb.directory(dir.toFile());
            pb.redirectErrorStream(true);
            Process process = pb.start();
            boolean finished = process.waitFor(60, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new RuntimeException("hexo generate 超时（60秒）");
            }
            if (process.exitValue() != 0) {
                String out = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                throw new RuntimeException("hexo generate 失败: " + out);
            }
        } catch (IOException e) {
            throw new RuntimeException("重新生成失败: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("重新生成被中断", e);
        }
    }
}
