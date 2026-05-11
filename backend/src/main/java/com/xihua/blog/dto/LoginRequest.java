package com.xihua.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "用户名不能为空")
    @Size(max = 50, message = "用户名最长50位")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(max = 100, message = "密码最长100位")
    private String password;
}
