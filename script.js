/**
 * DeepSeek AI 对话助手 - JavaScript 核心功能
 * 实现 API 调用、流式响应、配置管理等功能
 */

class AIChat {
    constructor() {
        // 配置参数
        this.config = {
            apiKey: '',
            apiUrl: 'https://api.deepseek.com/v1',
            model: 'deepseek-chat',
            temperature: 0.7,
            maxTokens: 2000,
            systemPrompt: '你是一个有用的AI助手，能够回答各种问题并提供帮助。请用中文回答。'
        };
        
        // 对话历史
        this.conversationHistory = [];
        
        // 状态管理
        this.isConnected = false;
        this.isTyping = false;
        
        // DOM 元素
        this.elements = {};
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化应用
     */
    init() {
        this.initElements();
        this.initEventListeners();
        this.initMatrixBackground();
        this.loadConfig();
        this.updateWelcomeTime();
        this.updateStatus();
        
        console.log('🤖 AI Chat Assistant initialized');
    }
    
    /**
     * 初始化 DOM 元素引用
     */
    initElements() {
        this.elements = {
            // 主要元素
            messageInput: document.getElementById('message-input'),
            sendBtn: document.getElementById('send-btn'),
            chatMessages: document.getElementById('chat-messages'),
            charCount: document.getElementById('char-count'),
            typingIndicator: document.getElementById('typing-indicator'),
            
            // 状态指示器
            statusDot: document.getElementById('status-dot'),
            statusText: document.getElementById('status-text'),
            
            // 按钮
            configBtn: document.getElementById('config-btn'),
            clearBtn: document.getElementById('clear-btn'),
            exportBtn: document.getElementById('export-btn'),
            
            // 配置模态框
            configModal: document.getElementById('config-modal'),
            closeConfig: document.getElementById('close-config'),
            saveConfig: document.getElementById('save-config'),
            resetConfig: document.getElementById('reset-config'),
            
            // 配置表单
            apiKey: document.getElementById('api-key'),
            apiUrl: document.getElementById('api-url'),
            modelName: document.getElementById('model-name'),
            temperature: document.getElementById('temperature'),
            temperatureValue: document.getElementById('temperature-value'),
            maxTokens: document.getElementById('max-tokens'),
            systemPrompt: document.getElementById('system-prompt'),
            
            // 其他
            loadingOverlay: document.getElementById('loading-overlay'),
            notificationContainer: document.getElementById('notification-container'),
            welcomeTime: document.getElementById('welcome-time')
        };
    }
    
    /**
     * 初始化事件监听器
     */
    initEventListeners() {
        // 发送消息
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // 输入框事件
        this.elements.messageInput.addEventListener('input', (e) => {
            this.updateCharCount();
            this.autoResize(e.target);
            this.updateSendButton();
        });
        
        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // 头部按钮
        this.elements.configBtn.addEventListener('click', () => this.showConfigModal());
        this.elements.clearBtn.addEventListener('click', () => this.clearChat());
        this.elements.exportBtn.addEventListener('click', () => this.exportChat());
        
        // 配置模态框
        this.elements.closeConfig.addEventListener('click', () => this.hideConfigModal());
        this.elements.saveConfig.addEventListener('click', () => this.saveConfiguration());
        this.elements.resetConfig.addEventListener('click', () => this.resetConfiguration());
        
        // 配置表单
        this.elements.temperature.addEventListener('input', (e) => {
            this.elements.temperatureValue.textContent = e.target.value;
        });
        
        // 模态框外部点击关闭
        this.elements.configModal.addEventListener('click', (e) => {
            if (e.target === this.elements.configModal) {
                this.hideConfigModal();
            }
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideConfigModal();
            }
        });
    }
    
    /**
     * 初始化矩阵背景动画
     */
    initMatrixBackground() {
        const canvas = document.getElementById('matrix-canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置画布大小
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // 矩阵字符
        const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        const charArray = chars.split('');
        
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = [];
        
        // 初始化雨滴
        for (let i = 0; i < columns; i++) {
            drops[i] = 1;
        }
        
        // 绘制函数
        const draw = () => {
            ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#00ff41';
            ctx.font = `${fontSize}px monospace`;
            
            for (let i = 0; i < drops.length; i++) {
                const text = charArray[Math.floor(Math.random() * charArray.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };
        
        // 启动动画
        setInterval(draw, 50);
    }
    
    /**
     * 加载配置
     */
    loadConfig() {
        try {
            const savedConfig = localStorage.getItem('ai-chat-config');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                this.config = { ...this.config, ...config };
            }
            
            // 更新表单
            this.updateConfigForm();
            
            // 检查 API 密钥
            if (this.config.apiKey) {
                this.testConnection();
            }
        } catch (error) {
            console.error('加载配置失败:', error);
            this.showNotification('配置加载失败', 'error');
        }
    }
    
    /**
     * 保存配置
     */
    saveConfig() {
        try {
            localStorage.setItem('ai-chat-config', JSON.stringify(this.config));
        } catch (error) {
            console.error('保存配置失败:', error);
            this.showNotification('配置保存失败', 'error');
        }
    }
    
    /**
     * 更新配置表单
     */
    updateConfigForm() {
        this.elements.apiKey.value = this.config.apiKey;
        this.elements.apiUrl.value = this.config.apiUrl;
        this.elements.modelName.value = this.config.model;
        this.elements.temperature.value = this.config.temperature;
        this.elements.temperatureValue.textContent = this.config.temperature;
        this.elements.maxTokens.value = this.config.maxTokens;
        this.elements.systemPrompt.value = this.config.systemPrompt;
    }
    
    /**
     * 测试连接
     */
    async testConnection() {
        if (!this.config.apiKey) {
            this.isConnected = false;
            this.updateStatus();
            return;
        }
        
        try {
            const response = await fetch(`${this.config.apiUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            this.isConnected = response.ok;
        } catch (error) {
            console.error('连接测试失败:', error);
            this.isConnected = false;
        }
        
        this.updateStatus();
    }
    
    /**
     * 更新状态显示
     */
    updateStatus() {
        if (this.isConnected) {
            this.elements.statusDot.classList.add('online');
            this.elements.statusText.textContent = '在线';
        } else {
            this.elements.statusDot.classList.remove('online');
            this.elements.statusText.textContent = '离线';
        }
    }
    
    /**
     * 更新欢迎时间
     */
    updateWelcomeTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-CN', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        this.elements.welcomeTime.textContent = timeString;
    }
    
    /**
     * 更新字符计数
     */
    updateCharCount() {
        const count = this.elements.messageInput.value.length;
        this.elements.charCount.textContent = count;
    }
    
    /**
     * 自动调整输入框高度
     */
    autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    
    /**
     * 更新发送按钮状态
     */
    updateSendButton() {
        const hasText = this.elements.messageInput.value.trim().length > 0;
        const canSend = hasText && this.isConnected && !this.isTyping;
        this.elements.sendBtn.disabled = !canSend;
    }
    
    /**
     * 发送消息
     */
    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message || !this.isConnected || this.isTyping) {
            return;
        }
        
        // 清空输入框
        this.elements.messageInput.value = '';
        this.updateCharCount();
        this.updateSendButton();
        this.autoResize(this.elements.messageInput);
        
        // 添加用户消息
        this.addMessage('user', message);
        
        // 开始 AI 响应
        await this.getAIResponse(message);
    }
    
    /**
     * 获取 AI 响应
     */
    async getAIResponse(userMessage) {
        this.isTyping = true;
        this.updateSendButton();
        this.showTypingIndicator();
        
        try {
            // 构建消息历史
            const messages = [];
            
            // 添加系统提示词
            if (this.config.systemPrompt) {
                messages.push({
                    role: 'system',
                    content: this.config.systemPrompt
                });
            }
            
            // 添加对话历史（最近10轮）
            const recentHistory = this.conversationHistory.slice(-20);
            messages.push(...recentHistory);
            
            // 添加当前用户消息
            messages.push({
                role: 'user',
                content: userMessage
            });
            
            // 调用 API
            const response = await fetch(`${this.config.apiUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: messages,
                    stream: true,
                    temperature: parseFloat(this.config.temperature),
                    max_tokens: parseInt(this.config.maxTokens)
                })
            });
            
            if (!response.ok) {
                throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
            }
            
            // 处理流式响应
            await this.handleStreamResponse(response, userMessage);
            
        } catch (error) {
            console.error('AI 响应失败:', error);
            this.addMessage('system', `❌ 错误: ${error.message}`);
            this.showNotification('AI 响应失败', 'error');
        } finally {
            this.isTyping = false;
            this.updateSendButton();
            this.hideTypingIndicator();
        }
    }
    
    /**
     * 处理流式响应
     */
    async handleStreamResponse(response, userMessage) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';
        
        // 创建 AI 消息元素
        const messageElement = this.createMessageElement('ai', '');
        this.elements.chatMessages.appendChild(messageElement);
        const contentElement = messageElement.querySelector('.message-content');
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        
                        if (data === '[DONE]') {
                            break;
                        }
                        
                        try {
                            const json = JSON.parse(data);
                            const delta = json.choices?.[0]?.delta;
                            
                            if (delta?.content) {
                                aiResponse += delta.content;
                                contentElement.innerHTML = this.formatMessage(aiResponse);
                                this.scrollToBottom();
                            }
                        } catch (e) {
                            // 忽略 JSON 解析错误
                        }
                    }
                }
            }
            
            // 保存到对话历史
            if (aiResponse) {
                this.conversationHistory.push(
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: aiResponse }
                );
                
                // 限制历史长度
                if (this.conversationHistory.length > 40) {
                    this.conversationHistory = this.conversationHistory.slice(-40);
                }
            }
            
        } catch (error) {
            console.error('流式响应处理失败:', error);
            contentElement.innerHTML = '❌ 响应处理失败';
        }
    }
    
    /**
     * 添加消息
     */
    addMessage(sender, content) {
        const messageElement = this.createMessageElement(sender, content);
        this.elements.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }
    
    /**
     * 创建消息元素
     */
    createMessageElement(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-CN', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const senderName = {
            'user': 'USER',
            'ai': 'DEEPSEEK',
            'system': 'SYSTEM'
        }[sender] || sender.toUpperCase();
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${senderName}</span>
                <span class="message-time">${timeString}</span>
            </div>
            <div class="message-content">${this.formatMessage(content)}</div>
        `;
        
        return messageDiv;
    }
    
    /**
     * 格式化消息内容
     */
    formatMessage(content) {
        if (!content) return '';
        
        // 简单的 Markdown 支持
        let formatted = content
            // 代码块
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            // 行内代码
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // 粗体
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // 斜体
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // 链接
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            // 换行
            .replace(/\n/g, '<br>');
        
        return formatted;
    }
    
    /**
     * 滚动到底部
     */
    scrollToBottom() {
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }
    
    /**
     * 显示输入指示器
     */
    showTypingIndicator() {
        this.elements.typingIndicator.style.display = 'block';
    }
    
    /**
     * 隐藏输入指示器
     */
    hideTypingIndicator() {
        this.elements.typingIndicator.style.display = 'none';
    }
    
    /**
     * 显示配置模态框
     */
    showConfigModal() {
        this.elements.configModal.classList.add('show');
        this.updateConfigForm();
    }
    
    /**
     * 隐藏配置模态框
     */
    hideConfigModal() {
        this.elements.configModal.classList.remove('show');
    }
    
    /**
     * 保存配置
     */
    saveConfiguration() {
        // 获取表单数据
        this.config.apiKey = this.elements.apiKey.value.trim();
        this.config.apiUrl = this.elements.apiUrl.value.trim();
        this.config.model = this.elements.modelName.value;
        this.config.temperature = parseFloat(this.elements.temperature.value);
        this.config.maxTokens = parseInt(this.elements.maxTokens.value);
        this.config.systemPrompt = this.elements.systemPrompt.value.trim();
        
        // 验证配置
        if (!this.config.apiKey) {
            this.showNotification('请输入 API 密钥', 'warning');
            return;
        }
        
        if (!this.config.apiUrl) {
            this.showNotification('请输入 API URL', 'warning');
            return;
        }
        
        // 保存配置
        this.saveConfig();
        this.hideConfigModal();
        this.showNotification('配置已保存', 'success');
        
        // 测试连接
        this.testConnection();
    }
    
    /**
     * 重置配置
     */
    resetConfiguration() {
        if (confirm('确定要重置所有配置吗？')) {
            this.config = {
                apiKey: '',
                apiUrl: 'https://api.deepseek.com/v1',
                model: 'deepseek-chat',
                temperature: 0.7,
                maxTokens: 2000,
                systemPrompt: '你是一个有用的AI助手，能够回答各种问题并提供帮助。请用中文回答。'
            };
            
            this.updateConfigForm();
            this.saveConfig();
            this.showNotification('配置已重置', 'info');
            this.testConnection();
        }
    }
    
    /**
     * 清空对话
     */
    clearChat() {
        if (confirm('确定要清空所有对话记录吗？')) {
            // 保留系统欢迎消息
            const systemMessage = this.elements.chatMessages.querySelector('.system-message');
            this.elements.chatMessages.innerHTML = '';
            if (systemMessage) {
                this.elements.chatMessages.appendChild(systemMessage);
            }
            
            // 清空对话历史
            this.conversationHistory = [];
            
            this.showNotification('对话已清空', 'info');
        }
    }
    
    /**
     * 导出对话
     */
    exportChat() {
        if (this.conversationHistory.length === 0) {
            this.showNotification('没有对话记录可导出', 'warning');
            return;
        }
        
        // 生成导出内容
        let exportContent = `# DeepSeek AI 对话记录\n\n`;
        exportContent += `导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
        exportContent += `---\n\n`;
        
        for (let i = 0; i < this.conversationHistory.length; i += 2) {
            const userMsg = this.conversationHistory[i];
            const aiMsg = this.conversationHistory[i + 1];
            
            if (userMsg && aiMsg) {
                exportContent += `## 对话 ${Math.floor(i / 2) + 1}\n\n`;
                exportContent += `**用户:** ${userMsg.content}\n\n`;
                exportContent += `**AI:** ${aiMsg.content}\n\n`;
                exportContent += `---\n\n`;
            }
        }
        
        // 下载文件
        const blob = new Blob([exportContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-chat-${new Date().toISOString().slice(0, 10)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('对话记录已导出', 'success');
    }
    
    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; padding: 0; margin-left: 10px;">&times;</button>
            </div>
        `;
        
        this.elements.notificationContainer.appendChild(notification);
        
        // 自动移除
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.aiChat = new AIChat();
});