package com.xihua.blog.controller;

import com.xihua.blog.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/")
    public Result<String> health() {
        return Result.success("xihua-blog API is running");
    }
}
