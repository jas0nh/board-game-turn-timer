# 回合桌：多人计时与物理骰子

适用于桌游和 D&D 的单页工具：

- 计时器与骰子是同页并列的独立工具，状态和操作互不影响
- 通过主页 Tab 在回合计时与物理骰子两个子版块之间切换
- 支持 2–8 名玩家独立设置名称与总时长
- 双人对局使用上下相对、上方旋转 180° 的桌面计时布局；3 人以上使用轮转布局
- 按玩家顺序循环计时，可暂停、指定当前玩家并自动跳过超时玩家
- 支持 d4、d6、d8、d10、d12、d20 与 d% 骰子
- 使用高清 3D 刚体物理模拟投掷；网络依赖不可用时自动切换为本地安全随机数
- d% 会同时投掷百分骰与 d10，并按双零为 100 的规则计算
- 每种骰子独立维护本次页面会话的出数直方图；d% 按十个数值区间展示
- 简单随机数子版块支持设置整数上下限，并维护当前区间的结果历史与分布直方图

## 启动

```bash
cd "/Users/jason/Developer/Web Publisher/chess"
python3 -m http.server 8000 --bind 0.0.0.0
```

手机访问：`http://<你的电脑局域网IP>:8000`

## 使用说明

1. 使用顶部 Tab 进入“回合计时”或“物理骰子”。
2. 计时器中设置玩家数量、名称、各自总秒数与首位玩家，然后开始对局。
3. 双人模式点击自己的计时区域结束回合；多人模式点击当前玩家区域或“下一位”。
4. 玩家时间归零后会被自动跳过，只剩一位玩家时结束对局。
5. 骰子中选择类型，点击 3D 桌面或“抛骰子”进行投掷，并在下方查看出数分布。
6. 随机数中设置上下限后点击结果区域或“生成随机数”；修改区间会重置该区间的统计。

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
