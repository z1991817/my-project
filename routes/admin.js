const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");

// ==========================================
// 1. 解决网络问题：配置全局代理 (针对 undici)
// ==========================================
const { setGlobalDispatcher, ProxyAgent } = require('undici');

// 请将 'http://127.0.0.1:7890' 替换为你本地科学上网工具的代理地址和端口
// (例如 Clash 通常是 7890，v2ray 通常是 10809)
const proxyAgent = new ProxyAgent('http://127.0.0.1:7897'); 
setGlobalDispatcher(proxyAgent);

// ==========================================
// 2. 初始化 AI 客户端 (强烈建议使用环境变量)
// ==========================================
// 示例：在终端中运行 `export GEMINI_API_KEY="你的新密钥"` 然后启动项目
const apiKey = process.env.GEMINI_API_KEY; 
const ai = new GoogleGenAI({ apiKey: apiKey });

// ==========================================
// 3. 优化 Express 路由：将 AI 调用放在请求处理函数内
// ==========================================
/* GET admin dashboard. */
router.get('/', async function(req, res, next) {
  try {
    // 当用户访问该路由时，再触发 AI 请求
    const response = await ai.models.generateContent({
      // 请确保模型名称拼写正确，如果报错找不到模型，可尝试 "gemini-2.5-flash"
      model: "gemini-3-flash-preview", 
      contents: "你是什么模型？请简单介绍一下自己。",
    });
    
    console.log("AI 回复:", response.text);
    
    // 你可以将 AI 的回复传递给前端模板
    // res.render('admin/index', { 
    //   title: 'Admin Dashboard', 
    //   aiGreeting: response.text 
    // });

    res.json({
            code: 200,
            message: '返回成功！',
            data: {
                response: response.text
            }
        });


  } catch (error) {
    console.error("调用 Google API 失败:", error);
    res.status(500).send("服务器内部错误：AI 调用失败");
  }
});

module.exports = router;