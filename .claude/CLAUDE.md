## CLAUDE.md
- 不要阅读我的.env文件，把新增一些配置信息放到.env.example文件中
- 文生图与图生图接口均已配置，后续开发调用第三方接口时，参考 buildExternalRequestConfig方法 和 externalHttpClient 方法，他们均已配置 proxy: false, 这个很重要，如果不配置本地代理在60秒请求时直接断开请求！
## 项目概述
 
**项目名称** artImg Pro - Ai 图片处理工具 服务端  
**当前版本**：v 0.0.1 
**项目状态**：生产环境运行，正在开发v0.0.1新功能
 
**业务目标**：为用户提供方便便利的图片处理工具
**核心价值**：简单易用、实时协作、数据安全
 
## 技术栈
**后端**：
- express + typescript 5.6 
- mySql 数据库

 
## 开发指令
- npm run dev
 
## 架构和约束
- 不要阅读我的.env文件，把新增一些配置信息放到.env.example文件中
- 文生图与图生图接口均已配置，后续开发调用第三方接口时，参考 buildExternalRequestConfig方法 和 externalHttpClient 方法，他们均已配置 proxy: false, 这个很重要，如果不配置本地代理在60秒请求时直接断开请求！
- 所有组件必须使用TypeScript
- 组件文件采用PascalCase命名
- 所有对话必须使用中文交流
- 功能开发完成后自测
- 功能开发完成后优化代码
- 注释写全
- 调优代码，删除冗余代码
- 后端服务地址：http://localhost:3000
## 当前任务
[tasks]