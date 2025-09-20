# AI对话助手 - 极客风格CLI版本

🤖 基于DeepSeek API的智能对话系统，采用极客风格的命令行界面，支持流式响应和多轮对话。

## ✨ 特性

- 🎨 **极客风格界面**: ASCII艺术横幅、彩色输出、炫酷提示符
- ⚡ **流式响应**: 实时显示AI回复，提供流畅的对话体验
- 🔄 **多轮对话**: 智能记忆上下文，支持连续对话
- 🛡️ **错误处理**: 优雅的异常处理和用户友好的错误提示
- ⚙️ **灵活配置**: 支持自定义API配置和系统提示词
- 🎯 **简洁高效**: 最小依赖，单文件运行

## 🚀 快速开始

### 1. 环境要求

- Python 3.8+
- 有效的DeepSeek API密钥

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置API密钥

编辑 `.env` 文件，设置你的DeepSeek API密钥：

```env
DEEPSEEK_API_KEY=your_actual_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

### 4. 运行程序

```bash
python chat.py
```

## 📁 项目结构

```
ai-chat-assistant/
├── chat.py              # 主程序文件
├── requirements.txt     # Python依赖
├── .env                # API配置文件
├── systemprompt.md     # 系统提示词
├── PRD.md              # 产品需求文档
└── README.md           # 项目说明
```

## 🎮 使用指南

### 基本对话

直接输入问题，AI会实时回答：

```
┌─[USER]─[14:30:25]
└─➤ 你好，请介绍一下自己

┌─[DEEPSEEK]─[14:30:26]
└─➤ 你好！我是基于DeepSeek的AI助手...
```

### 特殊命令

| 命令 | 功能 |
|------|------|
| `/help` | 显示帮助信息 |
| `/clear` | 清空对话历史和屏幕 |
| `/quit` 或 `/exit` | 退出程序 |

### 使用技巧

- 💡 问题越具体，回答越准确
- 🎭 可以要求AI扮演特定角色
- 📝 支持代码、数学、创意等各类问题
- 🔄 AI会记住对话上下文，支持连续提问

## ⚙️ 配置说明

### 环境变量 (.env)

```env
# DeepSeek API配置
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx    # 必填：你的API密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1  # 可选：API基础URL
```

### 系统提示词 (systemprompt.md)

可以编辑 `systemprompt.md` 文件来自定义AI的行为和角色：

```markdown
# 系统提示词

你是一个专业的AI助手，具有以下特点：
- 友好、耐心、专业
- 能够提供准确、有用的信息
- 支持多种语言交流
- 擅长解决各类问题
```

## 🛠️ 技术实现

### 核心技术栈

- **Python 3.8+**: 主要开发语言
- **requests**: HTTP请求库，用于API调用
- **python-dotenv**: 环境变量管理
- **DeepSeek API**: AI对话服务

### 架构设计

```
用户输入 → 命令解析 → API调用 → 流式响应 → 界面显示
    ↓           ↓          ↓          ↓          ↓
  验证输入   → 构建消息 → HTTP请求 → 实时解析 → 彩色输出
```

### 关键特性实现

1. **流式响应**: 使用Server-Sent Events (SSE)协议实时接收AI回复
2. **彩色输出**: 基于ANSI转义序列实现终端彩色显示
3. **对话管理**: 智能管理对话历史，自动限制长度避免内存溢出
4. **错误处理**: 多层异常捕获，提供用户友好的错误信息

## 🔧 开发指南

### 本地开发

1. 克隆项目
2. 安装依赖：`pip install -r requirements.txt`
3. 配置API密钥
4. 运行：`python chat.py`

### 自定义扩展

#### 添加新命令

在 `chat()` 方法中添加新的命令处理逻辑：

```python
elif user_input.lower() == '/your_command':
    # 你的命令逻辑
    return True
```

#### 修改界面样式

编辑 `Colors` 类来自定义颜色方案：

```python
class Colors:
    # 添加新颜色
    YOUR_COLOR = '\033[38;5;208m'  # 橙色
```

#### 扩展API功能

修改 `call_api()` 方法来支持更多API参数：

```python
data = {
    'model': 'deepseek-chat',
    'messages': messages,
    'stream': True,
    'temperature': 0.7,
    'max_tokens': 2000,
    # 添加新参数
    'top_p': 0.9,
    'frequency_penalty': 0.1
}
```

## 🐛 故障排除

### 常见问题

1. **API密钥错误**
   - 检查 `.env` 文件中的API密钥是否正确
   - 确认API密钥有效且有足够余额

2. **网络连接问题**
   - 检查网络连接
   - 确认API服务器地址正确

3. **依赖安装失败**
   - 升级pip：`pip install --upgrade pip`
   - 使用国内镜像：`pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt`

4. **编码问题**
   - 确保终端支持UTF-8编码
   - Windows用户可能需要设置：`chcp 65001`

### 调试模式

可以在代码中添加调试信息：

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🤝 贡献

欢迎提交Issue和Pull Request！

### 贡献指南

1. Fork 项目
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -am 'Add some feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交Pull Request

## 📞 支持

- 📧 邮箱：your-email@example.com
- 💬 Issues：[GitHub Issues](https://github.com/your-repo/ai-chat-assistant/issues)
- 📖 文档：[项目Wiki](https://github.com/your-repo/ai-chat-assistant/wiki)

## 🎯 路线图

- [ ] 支持更多AI模型
- [ ] 添加对话导出功能
- [ ] 实现插件系统
- [ ] 支持语音输入输出
- [ ] 添加Web界面版本
- [ ] 支持多用户会话管理

---

⭐ 如果这个项目对你有帮助，请给个Star支持一下！