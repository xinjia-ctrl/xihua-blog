package com.xihua.blog.service;

import com.xihua.blog.entity.User;

public interface UserService {
    User login(String username, String password);
    User register(String username, String password, String nickname);
    User getByUsername(String username);
}
