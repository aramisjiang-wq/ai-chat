/**
 * DeepSeek AI 对话助手 - 配置管理模块
 * 处理配置的加载、保存、验证和默认值管理
 */

class ConfigManager {
    constructor() {
        // 默认配置
        this.defaultConfig = {
            apiKey: '',
            apiUrl: 'https://api.deepseek.com/v1',
            model: 'deepseek-chat',
            temperature: 0.7,
            maxTokens: 2000,
            systemPrompt: '你是一个有用的AI助手，能够回答各种问题并提供帮助。请用中文回答。',
            theme: 'dark',
            language: 'zh-CN',
            autoSave: true,
            maxHistoryLength: 40,
            streamResponse: true,
            showTimestamp: true,
            enableNotifications: true
        };
        
        // 当前配置
        this.config = { ...this.defaultConfig };
        
        // 配置存储键名
        this.storageKey = 'ai-chat-config';
        
        // 配置变更监听器
        this.listeners = [];
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化配置管理器
     */
    init() {
        this.loadConfig();
        this.validateConfig();
        
        console.log('⚙️ Config Manager initialized');
    }
    
    /**
     * 加载配置
     */
    loadConfig() {
        try {
            const savedConfig = localStorage.getItem(this.storageKey);
            if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);
                
                // 合并配置，确保新增的默认配置项不会丢失
                this.config = { ...this.defaultConfig, ...parsedConfig };
                
                console.log('✅ Configuration loaded from localStorage');
            } else {
                console.log('📝 Using default configuration');
            }
        } catch (error) {
            console.error('❌ Failed to load configuration:', error);
            this.config = { ...this.defaultConfig };
            this.showError('配置加载失败，使用默认配置');
        }
    }
    
    /**
     * 保存配置
     */
    saveConfig() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.config));
            console.log('✅ Configuration saved to localStorage');
            return true;
        } catch (error) {
            console.error('❌ Failed to save configuration:', error);
            this.showError('配置保存失败');
            return false;
        }
    }
    
    /**
     * 验证配置
     */
    validateConfig() {
        const errors = [];
        
        // 验证 API URL
        if (this.config.apiUrl && !this.isValidUrl(this.config.apiUrl)) {
            errors.push('API URL 格式无效');
            this.config.apiUrl = this.defaultConfig.apiUrl;
        }
        
        // 验证温度值
        if (this.config.temperature < 0 || this.config.temperature > 2) {
            errors.push('温度值必须在 0-2 之间');
            this.config.temperature = this.defaultConfig.temperature;
        }
        
        // 验证最大令牌数
        if (this.config.maxTokens < 1 || this.config.maxTokens > 8000) {
            errors.push('最大令牌数必须在 1-8000 之间');
            this.config.maxTokens = this.defaultConfig.maxTokens;
        }
        
        // 验证历史长度
        if (this.config.maxHistoryLength < 0 || this.config.maxHistoryLength > 100) {
            errors.push('历史长度必须在 0-100 之间');
            this.config.maxHistoryLength = this.defaultConfig.maxHistoryLength;
        }
        
        if (errors.length > 0) {
            console.warn('⚠️ Configuration validation errors:', errors);
            this.showError(`配置验证失败: ${errors.join(', ')}`);
            this.saveConfig(); // 保存修正后的配置
        }
        
        return errors.length === 0;
    }
    
    /**
     * 获取配置值
     */
    get(key) {
        return this.config[key];
    }
    
    /**
     * 设置配置值
     */
    set(key, value) {
        const oldValue = this.config[key];
        this.config[key] = value;
        
        // 触发变更事件
        this.notifyListeners(key, value, oldValue);
        
        // 自动保存
        if (this.config.autoSave) {
            this.saveConfig();
        }
    }
    
    /**
     * 批量设置配置
     */
    setMultiple(configObject) {
        const changes = [];
        
        for (const [key, value] of Object.entries(configObject)) {
            const oldValue = this.config[key];
            this.config[key] = value;
            changes.push({ key, value, oldValue });
        }
        
        // 验证配置
        this.validateConfig();
        
        // 触发变更事件
        changes.forEach(({ key, value, oldValue }) => {
            this.notifyListeners(key, value, oldValue);
        });
        
        // 自动保存
        if (this.config.autoSave) {
            this.saveConfig();
        }
        
        return true;
    }
    
    /**
     * 重置配置
     */
    reset() {
        const oldConfig = { ...this.config };
        this.config = { ...this.defaultConfig };
        
        // 保存重置后的配置
        this.saveConfig();
        
        // 触发变更事件
        for (const key of Object.keys(this.defaultConfig)) {
            this.notifyListeners(key, this.config[key], oldConfig[key]);
        }
        
        console.log('🔄 Configuration reset to defaults');
        return true;
    }
    
    /**
     * 导出配置
     */
    export() {
        const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            config: { ...this.config }
        };
        
        // 移除敏感信息
        delete exportData.config.apiKey;
        
        return JSON.stringify(exportData, null, 2);
    }
    
    /**
     * 导入配置
     */
    import(configData) {
        try {
            const data = typeof configData === 'string' ? JSON.parse(configData) : configData;
            
            if (!data.config) {
                throw new Error('无效的配置数据格式');
            }
            
            // 合并配置（保留当前的 API 密钥）
            const currentApiKey = this.config.apiKey;
            this.config = { ...this.defaultConfig, ...data.config };
            this.config.apiKey = currentApiKey;
            
            // 验证配置
            this.validateConfig();
            
            // 保存配置
            this.saveConfig();
            
            console.log('📥 Configuration imported successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to import configuration:', error);
            this.showError(`配置导入失败: ${error.message}`);
            return false;
        }
    }
    
    /**
     * 获取所有配置
     */
    getAll() {
        return { ...this.config };
    }
    
    /**
     * 检查 API 配置是否完整
     */
    isApiConfigured() {
        return !!(this.config.apiKey && this.config.apiUrl && this.config.model);
    }
    
    /**
     * 获取 API 配置
     */
    getApiConfig() {
        return {
            apiKey: this.config.apiKey,
            apiUrl: this.config.apiUrl,
            model: this.config.model,
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens,
            systemPrompt: this.config.systemPrompt,
            streamResponse: this.config.streamResponse
        };
    }
    
    /**
     * 添加配置变更监听器
     */
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    /**
     * 移除配置变更监听器
     */
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }
    
    /**
     * 通知监听器配置变更
     */
    notifyListeners(key, newValue, oldValue) {
        this.listeners.forEach(callback => {
            try {
                callback(key, newValue, oldValue);
            } catch (error) {
                console.error('❌ Error in config listener:', error);
            }
        });
    }
    
    /**
     * 验证 URL 格式
     */
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    /**
     * 显示错误信息
     */
    showError(message) {
        // 如果存在全局通知系统，使用它
        if (window.aiChat && window.aiChat.showNotification) {
            window.aiChat.showNotification(message, 'error');
        } else {
            console.error(message);
        }
    }
    
    /**
     * 获取配置模式（开发/生产）
     */
    getMode() {
        return this.config.apiKey.includes('test') || this.config.apiUrl.includes('localhost') ? 'development' : 'production';
    }
    
    /**
     * 检查功能是否启用
     */
    isFeatureEnabled(feature) {
        const featureMap = {
            'stream': this.config.streamResponse,
            'notifications': this.config.enableNotifications,
            'timestamp': this.config.showTimestamp,
            'autosave': this.config.autoSave
        };
        
        return featureMap[feature] !== undefined ? featureMap[feature] : false;
    }
    
    /**
     * 获取主题配置
     */
    getTheme() {
        return this.config.theme || 'dark';
    }
    
    /**
     * 设置主题
     */
    setTheme(theme) {
        if (['dark', 'light', 'auto'].includes(theme)) {
            this.set('theme', theme);
            this.applyTheme(theme);
        }
    }
    
    /**
     * 应用主题
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    }
}

// 创建全局配置管理器实例
window.configManager = new ConfigManager();

// 导出配置管理器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigManager;
}