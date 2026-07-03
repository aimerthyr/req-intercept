# Request Interceptor

一个功能强大的浏览器扩展，用于拦截、修改、延迟和映射 HTTP 请求和响应。

[![Release](https://img.shields.io/github/v/release/aimerthyr/req-intercept)](https://github.com/aimerthyr/req-intercept/releases)
[![License](https://img.shields.io/github/license/aimerthyr/req-intercept)](./LICENSE)

## ✨ 功能特性

- 🔄 **请求拦截** - 拦截和修改 HTTP 请求
- 📝 **响应修改** - 修改 API 响应内容
- ⏱️ **请求延迟** - 模拟网络延迟
- 🔀 **URL 映射** - 将请求重定向到其他 URL
- 🎯 **灵活匹配** - 支持通配符和正则表达式
- 💾 **规则管理** - 导入/导出规则配置
- 🎨 **现代 UI** - 基于 Vue 3 + Ant Design Vue
- 🔥 **实时更新** - 规则变更立即生效

## 📦 安装

### Chrome/Edge

1. 从 [Releases](https://github.com/aimerthyr/req-intercept/releases) 下载 `extension.zip`
2. 解压到本地目录
3. 打开 `chrome://extensions/`
4. 启用"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择解压后的 `extension` 目录

### Firefox

1. 从 [Releases](https://github.com/aimerthyr/req-intercept/releases) 下载 `extension.xpi`
2. 打开 `about:addons`
3. 点击齿轮图标 → "从文件安装附加组件"
4. 选择下载的 `.xpi` 文件

## 🚀 使用指南

### 1. 启用扩展

点击工具栏图标，在弹出窗口顶部切换全局开关。

### 2. 创建规则

1. 点击"设置"按钮进入规则管理页面
2. 点击"添加规则"
3. 配置规则：
   - **规则名称**：便于识别的名称
   - **URL 模式**：使用通配符（`*api.example.com*`）或正则表达式
   - **拦截动作**：选择操作类型

### 3. 拦截动作类型

| 动作 | 说明 | 使用场景 |
|:---|:---|:---|
| **阻止请求** | 直接阻止请求发送 | 屏蔽广告、跟踪脚本 |
| **延迟请求** | 延迟指定毫秒后发送 | 模拟慢速网络 |
| **重定向** | 将请求重定向到新 URL | 切换 API 环境 |
| **修改请求头** | 修改请求 Headers | 添加认证信息 |
| **修改请求体** | 修改 POST/PUT 请求体 | 测试不同请求参数 |
| **修改响应头** | 修改响应 Headers | 跨域、缓存控制 |
| **修改响应体** | 修改 API 响应内容 | Mock 数据、测试异常 |

### 4. URL 模式示例

```
通配符模式:
  *://api.example.com/*          匹配所有协议
  https://*.example.com/api/*    匹配所有子域名
  *://*/user/*                   匹配所有域名的 user 路径

正则表达式模式:
  ^https://api\.example\.com/v[0-9]+/.*
  ^https://.*\.example\.com/api/.*
```

## 🛠️ 开发

### 环境要求

- Node.js >= 18
- pnpm >= 9

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# Chrome/Edge 开发
pnpm run dev

# Firefox 开发
pnpm run dev-firefox
```

### 构建

```bash
# 生产构建
pnpm run build

# 打包扩展
pnpm run pack

# 快捷命令（构建 + 打包）
pnpm run release
```

### 本地测试

```bash
# 在 Chrome 中运行
pnpm run start:chromium

# 在 Firefox 中运行
pnpm run start:firefox
```
