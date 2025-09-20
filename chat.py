#!/usr/bin/env python3
"""
AI对话助手 - 极客风格CLI版本
基于DeepSeek API的流式响应对话助手
"""

import os
import sys
import json
import time
import requests
from typing import List, Dict, Optional
from dotenv import load_dotenv

# 颜色定义 - 极客风格
class Colors:
    RESET = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    
    # 基础颜色
    BLACK = '\033[30m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'
    
    # 亮色
    BRIGHT_BLACK = '\033[90m'
    BRIGHT_RED = '\033[91m'
    BRIGHT_GREEN = '\033[92m'
    BRIGHT_YELLOW = '\033[93m'
    BRIGHT_BLUE = '\033[94m'
    BRIGHT_MAGENTA = '\033[95m'
    BRIGHT_CYAN = '\033[96m'
    BRIGHT_WHITE = '\033[97m'
    
    # 背景色
    BG_BLACK = '\033[40m'
    BG_RED = '\033[41m'
    BG_GREEN = '\033[42m'
    BG_YELLOW = '\033[43m'
    BG_BLUE = '\033[44m'
    BG_MAGENTA = '\033[45m'
    BG_CYAN = '\033[46m'
    BG_WHITE = '\033[47m'

class AIChat:
    def __init__(self):
        """初始化AI对话助手"""
        self.conversation_history: List[Dict[str, str]] = []
        self.api_key: Optional[str] = None
        self.base_url: Optional[str] = None
        self.system_prompt: str = ""
        self.load_config()
        
    def load_config(self):
        """加载配置文件"""
        try:
            # 加载.env文件
            load_dotenv()
            self.api_key = os.getenv('DEEPSEEK_API_KEY')
            self.base_url = os.getenv('DEEPSEEK_BASE_URL', 'https://api.deepseek.com/v1')
            
            # 加载系统提示词
            try:
                with open('systemprompt.md', 'r', encoding='utf-8') as f:
                    self.system_prompt = f.read().strip()
            except FileNotFoundError:
                self.system_prompt = "你是一个有用的AI助手，能够回答各种问题并提供帮助。"
                
            # 验证API密钥
            if not self.api_key or self.api_key == 'your_deepseek_api_key_here':
                self.print_error("⚠️  请在.env文件中设置有效的DEEPSEEK_API_KEY")
                sys.exit(1)
                
        except Exception as e:
            self.print_error(f"配置加载失败: {e}")
            sys.exit(1)
    
    def print_banner(self):
        """显示极客风格的欢迎横幅"""
        banner = f"""
{Colors.BRIGHT_CYAN}╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  {Colors.BRIGHT_GREEN}██████╗ ███████╗███████╗██████╗ ███████╗███████╗██╗  ██╗{Colors.BRIGHT_CYAN}  ║
║  {Colors.BRIGHT_GREEN}██╔══██╗██╔════╝██╔════╝██╔══██╗██╔════╝██╔════╝██║ ██╔╝{Colors.BRIGHT_CYAN}  ║
║  {Colors.BRIGHT_GREEN}██║  ██║█████╗  █████╗  ██████╔╝███████╗█████╗  █████╔╝ {Colors.BRIGHT_CYAN}  ║
║  {Colors.BRIGHT_GREEN}██║  ██║██╔══╝  ██╔══╝  ██╔═══╝ ╚════██║██╔══╝  ██╔═██╗ {Colors.BRIGHT_CYAN}  ║
║  {Colors.BRIGHT_GREEN}██████╔╝███████╗███████╗██║     ███████║███████╗██║  ██╗{Colors.BRIGHT_CYAN}  ║
║  {Colors.BRIGHT_GREEN}╚═════╝ ╚══════╝╚══════╝╚═╝     ╚══════╝╚══════╝╚═╝  ╚═╝{Colors.BRIGHT_CYAN}  ║
║                                                              ║
║  {Colors.BRIGHT_YELLOW}🤖 AI对话助手 v1.0 - 极客版{Colors.BRIGHT_CYAN}                          ║
║  {Colors.BRIGHT_MAGENTA}💬 基于DeepSeek API的智能对话系统{Colors.BRIGHT_CYAN}                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝{Colors.RESET}

{Colors.BRIGHT_WHITE}🚀 系统状态:{Colors.RESET}
{Colors.GREEN}  ✓ API连接: {self.base_url}{Colors.RESET}
{Colors.GREEN}  ✓ 系统提示词: 已加载{Colors.RESET}
{Colors.GREEN}  ✓ 流式响应: 启用{Colors.RESET}

{Colors.BRIGHT_YELLOW}📝 可用命令:{Colors.RESET}
{Colors.CYAN}  • /help    - 显示帮助信息{Colors.RESET}
{Colors.CYAN}  • /clear   - 清空对话历史{Colors.RESET}
{Colors.CYAN}  • /quit    - 退出程序{Colors.RESET}
{Colors.CYAN}  • /exit    - 退出程序{Colors.RESET}

{Colors.DIM}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.RESET}
"""
        print(banner)
    
    def print_prompt(self):
        """显示输入提示符"""
        print(f"\n{Colors.BRIGHT_BLUE}┌─[{Colors.BRIGHT_GREEN}USER{Colors.BRIGHT_BLUE}]─[{Colors.BRIGHT_YELLOW}{time.strftime('%H:%M:%S')}{Colors.BRIGHT_BLUE}]")
        print(f"└─➤ {Colors.BRIGHT_WHITE}", end="")
    
    def print_ai_response_header(self):
        """显示AI响应头部"""
        print(f"\n{Colors.BRIGHT_MAGENTA}┌─[{Colors.BRIGHT_CYAN}DEEPSEEK{Colors.BRIGHT_MAGENTA}]─[{Colors.BRIGHT_YELLOW}{time.strftime('%H:%M:%S')}{Colors.BRIGHT_MAGENTA}]")
        print(f"└─➤ {Colors.BRIGHT_WHITE}", end="")
    
    def print_error(self, message: str):
        """打印错误信息"""
        print(f"\n{Colors.BRIGHT_RED}❌ 错误: {message}{Colors.RESET}")
    
    def print_warning(self, message: str):
        """打印警告信息"""
        print(f"\n{Colors.BRIGHT_YELLOW}⚠️  警告: {message}{Colors.RESET}")
    
    def print_success(self, message: str):
        """打印成功信息"""
        print(f"\n{Colors.BRIGHT_GREEN}✅ {message}{Colors.RESET}")
    
    def print_info(self, message: str):
        """打印信息"""
        print(f"\n{Colors.BRIGHT_CYAN}ℹ️  {message}{Colors.RESET}")
    
    def clear_screen(self):
        """清屏"""
        os.system('clear' if os.name == 'posix' else 'cls')
    
    def show_help(self):
        """显示帮助信息"""
        help_text = f"""
{Colors.BRIGHT_CYAN}╔══════════════════════════════════════════════════════════════╗
║                        {Colors.BRIGHT_YELLOW}帮助信息{Colors.BRIGHT_CYAN}                           ║
╚══════════════════════════════════════════════════════════════╝{Colors.RESET}

{Colors.BRIGHT_WHITE}🎯 基本使用:{Colors.RESET}
{Colors.GREEN}  • 直接输入问题，AI会实时回答{Colors.RESET}
{Colors.GREEN}  • 支持多轮对话，AI会记住上下文{Colors.RESET}
{Colors.GREEN}  • 支持中文和英文交互{Colors.RESET}

{Colors.BRIGHT_WHITE}⚡ 特殊命令:{Colors.RESET}
{Colors.CYAN}  /help     显示此帮助信息{Colors.RESET}
{Colors.CYAN}  /clear    清空对话历史和屏幕{Colors.RESET}
{Colors.CYAN}  /quit     优雅退出程序{Colors.RESET}
{Colors.CYAN}  /exit     优雅退出程序{Colors.RESET}

{Colors.BRIGHT_WHITE}🔧 配置文件:{Colors.RESET}
{Colors.YELLOW}  .env              API密钥配置{Colors.RESET}
{Colors.YELLOW}  systemprompt.md   系统提示词{Colors.RESET}

{Colors.BRIGHT_WHITE}💡 使用技巧:{Colors.RESET}
{Colors.MAGENTA}  • 问题越具体，回答越准确{Colors.RESET}
{Colors.MAGENTA}  • 可以要求AI扮演特定角色{Colors.RESET}
{Colors.MAGENTA}  • 支持代码、数学、创意等各类问题{Colors.RESET}

{Colors.DIM}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.RESET}
"""
        print(help_text)
    
    def call_api(self, messages: List[Dict[str, str]]) -> Optional[requests.Response]:
        """调用DeepSeek API"""
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'model': 'deepseek-chat',
            'messages': messages,
            'stream': True,
            'temperature': 0.7,
            'max_tokens': 2000
        }
        
        try:
            response = requests.post(
                f'{self.base_url}/chat/completions',
                headers=headers,
                json=data,
                stream=True,
                timeout=30
            )
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as e:
            self.print_error(f"API调用失败: {e}")
            return None
    
    def stream_response(self, response: requests.Response) -> str:
        """处理流式响应"""
        full_response = ""
        
        try:
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        data = line[6:]  # 移除 'data: ' 前缀
                        
                        if data == '[DONE]':
                            break
                        
                        try:
                            json_data = json.loads(data)
                            if 'choices' in json_data and len(json_data['choices']) > 0:
                                delta = json_data['choices'][0].get('delta', {})
                                content = delta.get('content', '')
                                
                                if content:
                                    print(content, end='', flush=True)
                                    full_response += content
                                    time.sleep(0.01)  # 控制显示速度
                        except json.JSONDecodeError:
                            continue
                            
        except Exception as e:
            self.print_error(f"响应处理失败: {e}")
        
        print()  # 换行
        return full_response
    
    def chat(self, user_input: str) -> bool:
        """处理用户输入并获取AI响应"""
        # 处理特殊命令
        if user_input.lower() in ['/quit', '/exit']:
            return False
        elif user_input.lower() == '/help':
            self.show_help()
            return True
        elif user_input.lower() == '/clear':
            self.clear_screen()
            self.conversation_history.clear()
            self.print_banner()
            self.print_success("对话历史已清空")
            return True
        
        # 构建消息列表
        messages = []
        
        # 添加系统提示词
        if self.system_prompt:
            messages.append({
                "role": "system",
                "content": self.system_prompt
            })
        
        # 添加对话历史
        messages.extend(self.conversation_history)
        
        # 添加当前用户输入
        messages.append({
            "role": "user",
            "content": user_input
        })
        
        # 调用API
        response = self.call_api(messages)
        if not response:
            return True
        
        # 显示AI响应头部
        self.print_ai_response_header()
        
        # 处理流式响应
        ai_response = self.stream_response(response)
        
        if ai_response:
            # 保存到对话历史
            self.conversation_history.append({
                "role": "user",
                "content": user_input
            })
            self.conversation_history.append({
                "role": "assistant",
                "content": ai_response
            })
            
            # 限制对话历史长度（保持最近10轮对话）
            if len(self.conversation_history) > 20:
                self.conversation_history = self.conversation_history[-20:]
        
        return True
    
    def run(self):
        """运行主程序"""
        try:
            # 清屏并显示欢迎信息
            self.clear_screen()
            self.print_banner()
            
            # 主循环
            while True:
                try:
                    self.print_prompt()
                    user_input = input().strip()
                    
                    if not user_input:
                        self.print_warning("请输入有效内容")
                        continue
                    
                    # 处理用户输入
                    if not self.chat(user_input):
                        break
                        
                except KeyboardInterrupt:
                    print(f"\n\n{Colors.BRIGHT_YELLOW}🔄 检测到Ctrl+C，正在退出...{Colors.RESET}")
                    break
                except EOFError:
                    print(f"\n\n{Colors.BRIGHT_YELLOW}🔄 检测到EOF，正在退出...{Colors.RESET}")
                    break
                    
        except Exception as e:
            self.print_error(f"程序运行出错: {e}")
        finally:
            self.print_goodbye()
    
    def print_goodbye(self):
        """显示退出信息"""
        goodbye = f"""
{Colors.BRIGHT_MAGENTA}╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  {Colors.BRIGHT_CYAN}👋 感谢使用 AI对话助手！{Colors.BRIGHT_MAGENTA}                              ║
║                                                              ║
║  {Colors.BRIGHT_GREEN}🎯 本次对话轮数: {len(self.conversation_history)//2}{Colors.BRIGHT_MAGENTA}                              ║
║  {Colors.BRIGHT_YELLOW}⭐ 期待下次再见！{Colors.BRIGHT_MAGENTA}                                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝{Colors.RESET}

{Colors.BRIGHT_WHITE}🔗 项目信息:{Colors.RESET}
{Colors.CYAN}  GitHub: https://github.com/your-repo/ai-chat-assistant{Colors.RESET}
{Colors.CYAN}  文档: README.md{Colors.RESET}

{Colors.DIM}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.RESET}
"""
        print(goodbye)

def main():
    """主函数"""
    try:
        chat = AIChat()
        chat.run()
    except Exception as e:
        print(f"{Colors.BRIGHT_RED}❌ 程序启动失败: {e}{Colors.RESET}")
        sys.exit(1)

if __name__ == "__main__":
    main()