package com.xihua.blog.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xihua.blog.entity.Article;
import com.xihua.blog.entity.User;
import com.xihua.blog.mapper.ArticleMapper;
import com.xihua.blog.mapper.UserMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserMapper userMapper;
    private final ArticleMapper articleMapper;
    private final PasswordEncoder passwordEncoder;
    private final BlogProperties blogProperties;

    private static final Pattern FRONT_MATTER = Pattern.compile(
            "^---\\s*\\n(.*?)\\n---\\s*\\n", Pattern.DOTALL);
    private static final Pattern KEY_VALUE = Pattern.compile(
            "^(\\w+):\\s*(.+)$", Pattern.MULTILINE);

    public DataInitializer(UserMapper userMapper, ArticleMapper articleMapper,
                           PasswordEncoder passwordEncoder, BlogProperties blogProperties) {
        this.userMapper = userMapper;
        this.articleMapper = articleMapper;
        this.passwordEncoder = passwordEncoder;
        this.blogProperties = blogProperties;
    }

    @Override
    public void run(String... args) {
        initAdminUser();
        syncPostsFromHexo();
    }

    private void initAdminUser() {
        // 清理旧 admin 用户，创建新管理员
        userMapper.delete(new LambdaQueryWrapper<User>().eq(User::getUsername, "admin"));
        // 如果"溪花"已存在则更新密码，否则创建
        User existing = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, "溪花"));
        if (existing != null) {
            existing.setPassword(passwordEncoder.encode("ljx20060528"));
            existing.setNickname("溪花");
            existing.setRole("ADMIN");
            userMapper.updateById(existing);
            System.out.println(">>> 管理员密码已更新: 溪花");
        } else {
            // 删除其他所有用户，只保留溪花
            userMapper.delete(new LambdaQueryWrapper<User>().ne(User::getUsername, "溪花"));
            User admin = new User();
            admin.setUsername("溪花");
            admin.setPassword(passwordEncoder.encode("ljx20060528"));
            admin.setNickname("溪花");
            admin.setRole("ADMIN");
            userMapper.insert(admin);
            System.out.println(">>> 管理员已创建: 溪花");
        }
    }

    private void syncPostsFromHexo() {
        Path postsDir = Paths.get(blogProperties.getSourcePosts());
        if (!Files.isDirectory(postsDir)) {
            System.out.println(">>> source/_posts 目录不存在，跳过文章同步: " + postsDir);
            return;
        }

        try (Stream<Path> files = Files.list(postsDir)) {
            files.filter(p -> p.toString().endsWith(".md")).forEach(this::importPost);
        } catch (IOException e) {
            System.err.println(">>> 读取文章目录失败: " + e.getMessage());
        }
    }

    private void importPost(Path file) {
        try {
            String slug = file.getFileName().toString().replace(".md", "");
            String content = Files.readString(file, StandardCharsets.UTF_8);
            Matcher fm = FRONT_MATTER.matcher(content);
            if (!fm.find()) return;

            String yaml = fm.group(1);
            String title = getValue(yaml, "title", slug);
            String category = getValue(yaml, "categories", "");
            String dateStr = getValue(yaml, "date", "");
            String body = content.substring(fm.end());

            if (articleMapper.selectCount(
                    new LambdaQueryWrapper<Article>().eq(Article::getSlug, slug)) > 0) {
                return; // 已存在，跳过
            }

            Article article = new Article();
            article.setTitle(title);
            article.setSlug(slug);
            article.setCategory(category);
            article.setSummary(body.length() > 200 ? body.substring(0, 200) + "..." : body);
            article.setContent(body);
            article.setStatus("published");

            if (!dateStr.isEmpty()) {
                try {
                    article.setCreatedAt(LocalDateTime.parse(
                            dateStr.trim(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
                } catch (Exception e) {
                    try {
                        article.setCreatedAt(LocalDateTime.parse(
                                dateStr.trim(), DateTimeFormatter.ofPattern("yyyy-MM-dd")));
                    } catch (Exception ignored) {}
                }
            }

            articleMapper.insert(article);
            System.out.println(">>> 已导入文章: " + title + " (" + slug + ")");
        } catch (Exception e) {
            System.err.println(">>> 导入文章失败 " + file.getFileName() + ": " + e.getMessage());
        }
    }

    private String getValue(String yaml, String key, String defaultValue) {
        Matcher m = Pattern.compile("^" + key + ":\\s*(.+)$", Pattern.MULTILINE).matcher(yaml);
        if (m.find()) {
            String val = m.group(1).trim();
            if (val.startsWith("\"") && val.endsWith("\"")) {
                val = val.substring(1, val.length() - 1);
            }
            return val;
        }
        return defaultValue;
    }
}
