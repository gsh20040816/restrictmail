# RestrictMail

限制白名单邮箱注册的Hydro插件。

## 功能

- 限制只有指定白名单域名的邮箱可以注册账户
- 提供管理界面添加/删除白名单域名
- 支持多语言（中文/英文）

## 安装

```bash
yarn add @gshgsh/restrictmail
# 或
hydrooj addon add @gshgsh/restrictmail
```

## 使用方法

1. 安装插件后，请确保系统开启了邮箱注册功能
2. 访问 `/manage/whitelist` 管理邮箱白名单
3. 添加允许注册的邮箱域名（如：example.com）
4. 只有白名单中的邮箱域名才能注册账户

## 注意事项

- 需要管理员权限才能管理白名单
- 插件生效后，非白名单域名的用户将无法注册账户
- 此插件不影响已注册用户
