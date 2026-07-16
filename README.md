# 回合桌：多人计时与物理骰子

适用于桌游和 D&D 的单页工具：

- 计时器与骰子是同页并列的独立工具，状态和操作互不影响
- 支持 2–8 名玩家独立设置名称与总时长
- 按玩家顺序循环计时，可暂停、指定当前玩家并自动跳过超时玩家
- 支持 d4、d6、d8、d10、d12、d20 与 d% 骰子
- 使用 3D 刚体物理模拟投掷；网络依赖不可用时自动切换为本地安全随机数
- d% 会同时投掷百分骰与 d10，并按双零为 100 的规则计算

## 启动

```bash
cd "/Users/jason/Developer/Web Publisher/chess"
python3 -m http.server 8000 --bind 0.0.0.0
```

手机访问：`http://<你的电脑局域网IP>:8000`

## 使用说明

1. 设置玩家数量、名称、各自总秒数与首位玩家，然后开始对局。
2. 点击“开始计时”，再点击当前玩家区域或“下一位”结束回合。
3. 玩家时间归零后会被自动跳过，只剩一位玩家时结束对局。
4. 点击计时区右上角设置按钮可重设对局。
5. 选择骰子类型，点击 3D 骰子区域或“抛骰子”进行投掷。

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
