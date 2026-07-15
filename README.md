# 回合制通用计时器（手机网页）

双人回合计时模块，支持两屏流程：
- 第 1 屏：设置每方总时长（秒）
- 第 2 屏：进入全屏计时界面（上下对称），便于手机放在两人中间

## 启动

```bash
cd /Users/jason/Developer/Chess
python3 -m http.server 8000 --bind 0.0.0.0
```

手机访问：`http://<你的电脑局域网IP>:8000`

## 使用说明

1. 进入主页后先设置 A 方和 B 方的时间，然后点击“进入计时”。
2. 计时界面为全屏主屏，按回合切换按钮或开始/暂停控制。
3. 任意一方时间归零后，另一方胜利提示。
4. “重置并返回设置”回到第 1 屏，适合重新开始。
5. 页面刷新后会重置到设置页，不会保留旧对局时间。 

## Cloudflare Pages

通过 GitHub 导入部署时使用以下设置：

- Framework preset: `None`
- Build command: 留空
- Build output directory: `/`
- Root directory: `/`

本项目包含 `wrangler.jsonc`，可用于本地 Cloudflare Pages 预览：

```bash
pnpm dlx wrangler pages dev .
```

如需直接上传部署：

```bash
pnpm dlx wrangler pages deploy . --project-name board-game-turn-timer
```
