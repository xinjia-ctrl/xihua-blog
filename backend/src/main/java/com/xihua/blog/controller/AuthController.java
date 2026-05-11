package com.xihua.blog.controller;

import com.xihua.blog.common.JwtUtil;
import com.xihua.blog.common.Result;
import com.xihua.blog.dto.LoginRequest;
import com.xihua.blog.dto.RegisterRequest;
import com.xihua.blog.entity.User;
import com.xihua.blog.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        User user = userService.login(request.getUsername(), request.getPassword());
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
        return Result.success(Map.of(
                "token", token,
                "username", user.getUsername(),
                "nickname", user.getNickname() != null ? user.getNickname() : user.getUsername(),
                "role", user.getRole()
        ));
    }

    @PostMapping("/register")
    public Result<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.register(request.getUsername(), request.getPassword(), request.getNickname());
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
        return Result.success(Map.of(
                "token", token,
                "username", user.getUsername(),
                "nickname", user.getNickname(),
                "role", user.getRole()
        ));
    }

    @GetMapping("/me")
    public Result<Map<String, Object>> me(@RequestAttribute(value = "username", required = false) String username) {
        if (username == null) {
            return Result.unauthorized("未登录");
        }
        User user = userService.getByUsername(username);
        if (user == null) {
            return Result.unauthorized("用户不存在");
        }
        return Result.success(Map.of(
                "username", user.getUsername(),
                "nickname", user.getNickname(),
                "avatar", user.getAvatar() != null ? user.getAvatar() : "",
                "role", user.getRole()
        ));
    }
}
