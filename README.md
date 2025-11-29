# Sora2API UI

一个现代化的 Web 界面，用于与 Sora 视频生成 API 和 Gemini AI API 进行交互。

## 快速开始

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 pnpm >= 8.0.0

### 环境安装

#### 1. 安装 Node.js

**Windows 系统：**
1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS（长期支持）版本
3. 运行安装程序，按照向导完成安装
4. 验证安装：
```bash
node --version
npm --version
```

**macOS 系统：**

使用 Homebrew：
```bash
brew install node
```

或从 [Node.js 官网](https://nodejs.org/) 下载安装包

**Linux 系统：**

Ubuntu/Debian：
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

CentOS/RHEL：
```bash
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo yum install -y nodejs
```

#### 2. 安装 pnpm（可选，推荐）

pnpm 是一个更快、更节省磁盘空间的包管理器：

```bash
npm install -g pnpm
```

验证安装：
```bash
pnpm --version
```

### 项目安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd Sora2api_UI
```

2. **安装依赖**
```bash
npm install
# 或使用 pnpm
pnpm install
```

3. **启动开发服务器**
```bash
npm run dev
# 或使用 pnpm
pnpm dev
```

应用将在 `http://localhost:5173` 启动（或其他可用端口）。

4. **配置 API 设置**

首次使用时，请访问应用的 **设置页面**，填写以下信息：

#### Sora API 配置

- **Sora API URL**：你的 Sora API 服务器**基础地址**
  
  **重要提示：** 只需填写基础地址，**不要**包含 `/v1` 或其他路径部分
  
  正确示例：
  ```
  http://your-server:8000
  https://api.example.com
  ```
  
  错误示例：
  ```
  http://your-server:8000/v1
  http://your-server:8000/v1/chat/completions
  ```
  
  系统会自动在请求时添加正确的路径（如 `/v1/models`、`/v1/chat/completions` 等）

- **Sora API Key**：你的 Sora API 密钥（格式：`sk-...`）

#### Gemini API 配置

- **Gemini API URL**：你的 Gemini API 服务器地址
  
  **重要提示：** Gemini API（生图模型）需要包含 `/v1beta` 路径
  
  正确示例：
  ```
  http://your-server:3001/proxy/gemini_share/v1beta
  https://api.example.com/v1beta
  ```
  
  错误示例：
  ```
  http://your-server:3001
  http://your-server:3001/proxy/gemini_share
  ```

- **Gemini API Key**：你的 Gemini API 密钥

这些配置会被安全地保存在浏览器的本地存储中（localStorage），不会上传到任何服务器。

## 构建生产版本

```bash
npm run build
# 或使用 pnpm
pnpm build
```

构建产物将输出到 `dist` 目录。

## 语言切换

应用支持中文和英文两种语言：

- 默认语言：中文
- 切换方式：点击左侧边栏底部的语言按钮
- 语言选择会自动保存，下次访问时保持

## 功能特性

- **视频生成**：支持 5 种生成模式
  - 文本生成视频
  - 图片生成视频
  - 视频混音
  - 创建角色
  - 角色生成视频
- **图片生成**：通过 Gemini API 生成图像
- **提示词生成**：AI 辅助生成创意提示词
- **任务管理**：批量处理和管理生成任务
- **数据统计**：实时查看生成统计和使用情况
- **视频预览**：在线预览和下载生成的视频
- **模型管理**：获取并查看可用的 API 模型列表

## 安全说明

- 所有 API 配置仅保存在用户浏览器本地
- 不会上传到任何第三方服务器
- 代码中无硬编码的敏感信息
- 在公共设备使用后，请清除浏览器数据
- 定期更换你的 API 密钥以确保安全

## 常见问题

### 端口被占用

如果 5173 端口被占用，Vite 会自动使用下一个可用端口。你也可以手动指定端口：

```bash
npm run dev -- --port 3000
```

### 依赖安装失败

如果使用 npm 安装依赖时遇到问题，可以尝试：

1. 清除 npm 缓存：
```bash
npm cache clean --force
```

2. 删除 `node_modules` 和 `package-lock.json`，重新安装：
```bash
rm -rf node_modules package-lock.json
npm install
```

3. 或者使用 pnpm：
```bash
pnpm install
```

### API 连接失败

请检查：
1. API URL 格式是否正确
2. API Key 是否有效
3. 网络连接是否正常
4. 服务器是否可访问

## 许可证

本项目采用 Apache License 2.0 许可证 - 详见 [LICENSE](LICENSE) 文件

---

**安全提醒**：请勿在公开场合（如 GitHub Issues、论坛、截图等）分享你的 API 密钥！
