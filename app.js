const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const MIN_SECONDS = 10;
const MAX_SECONDS = 7200;

const diceDefinitions = {
  d4: { label: '四面骰', notation: '1d4', sides: 4 },
  d6: { label: '六面骰', notation: '1d6', sides: 6 },
  d8: { label: '八面骰', notation: '1d8', sides: 8 },
  d10: { label: '十面骰', notation: '1d10', sides: 10 },
  d12: { label: '十二面骰', notation: '1d12', sides: 12 },
  d20: { label: '二十面骰', notation: '1d20', sides: 20 },
  d100: { label: '百分骰', notation: ['1d10', '1d10'], sides: 100 },
};

const elements = {
  toolTabs: document.querySelector('.tool-tabs'),
  timerTab: document.querySelector('#timerTab'),
  diceTab: document.querySelector('#diceTab'),
  randomTab: document.querySelector('#randomTab'),
  timerPanel: document.querySelector('#timerPanel'),
  dicePanel: document.querySelector('#dicePanel'),
  randomPanel: document.querySelector('#randomPanel'),
  timerSetup: document.querySelector('#timerSetup'),
  timerGame: document.querySelector('#timerGame'),
  timerSettingsBtn: document.querySelector('#timerSettingsBtn'),
  playerCount: document.querySelector('#playerCount'),
  removePlayerBtn: document.querySelector('#removePlayerBtn'),
  addPlayerBtn: document.querySelector('#addPlayerBtn'),
  playersEditor: document.querySelector('#playersEditor'),
  startPlayerSelect: document.querySelector('#startPlayerSelect'),
  startGameBtn: document.querySelector('#startGameBtn'),
  duelTimer: document.querySelector('#duelTimer'),
  duelPlayers: [document.querySelector('#duelPlayer0'), document.querySelector('#duelPlayer1')],
  duelNames: [document.querySelector('#duelName0'), document.querySelector('#duelName1')],
  duelStatuses: [document.querySelector('#duelStatus0'), document.querySelector('#duelStatus1')],
  duelTimes: [document.querySelector('#duelTime0'), document.querySelector('#duelTime1')],
  duelRound: document.querySelector('#duelRound'),
  duelPauseBtn: document.querySelector('#duelPauseBtn'),
  multiTimer: document.querySelector('#multiTimer'),
  activePlayerCard: document.querySelector('#activePlayerCard'),
  activePosition: document.querySelector('#activePosition'),
  liveIndicator: document.querySelector('#liveIndicator'),
  activeName: document.querySelector('#activeName'),
  activeTime: document.querySelector('#activeTime'),
  playerStrip: document.querySelector('#playerStrip'),
  pauseBtn: document.querySelector('#pauseBtn'),
  nextTurnBtn: document.querySelector('#nextTurnBtn'),
  timerStatus: document.querySelector('#timerStatus'),
  diceSelector: document.querySelector('#diceSelector'),
  diceStage: document.querySelector('#diceStage'),
  diceLoading: document.querySelector('#diceLoading'),
  fallbackDie: document.querySelector('#fallbackDie'),
  diceResult: document.querySelector('#diceResult'),
  rollLabel: document.querySelector('#rollLabel'),
  rollDetail: document.querySelector('#rollDetail'),
  rollBtn: document.querySelector('#rollBtn'),
  clearHistoryBtn: document.querySelector('#clearHistoryBtn'),
  rollHistory: document.querySelector('#rollHistory'),
  clearStatsBtn: document.querySelector('#clearStatsBtn'),
  histogramSummary: document.querySelector('#histogramSummary'),
  histogram: document.querySelector('#histogram'),
  randomMin: document.querySelector('#randomMin'),
  randomMax: document.querySelector('#randomMax'),
  randomResult: document.querySelector('#randomResult'),
  randomStage: document.querySelector('#randomStage'),
  randomStageValue: document.querySelector('#randomStageValue'),
  randomRangeLabel: document.querySelector('#randomRangeLabel'),
  generateRandomBtn: document.querySelector('#generateRandomBtn'),
  randomHistory: document.querySelector('#randomHistory'),
  clearRandomHistoryBtn: document.querySelector('#clearRandomHistoryBtn'),
  randomHistogramSummary: document.querySelector('#randomHistogramSummary'),
  randomHistogram: document.querySelector('#randomHistogram'),
  clearRandomStatsBtn: document.querySelector('#clearRandomStatsBtn'),
};

const timerState = {
  players: createPlayers(2),
  activeIndex: 0,
  round: 1,
  started: false,
  running: false,
  gameOver: false,
  lastTick: null,
  frameId: null,
};

const diceState = {
  selected: 'd6',
  box: null,
  ready: false,
  initializing: false,
  rolling: false,
  history: [],
  stats: Object.fromEntries(
    Object.entries(diceDefinitions).map(([type, definition]) => [type, Array(definition.sides + 1).fill(0)]),
  ),
};

const randomState = {
  min: 1,
  max: 100,
  counts: new Map(),
  history: [],
};

function createPlayers(count, existing = []) {
  return Array.from({ length: count }, (_, index) => {
    const previous = existing[index];
    return previous ?? {
      id: crypto.randomUUID?.() ?? `player-${Date.now()}-${index}`,
      name: `玩家 ${index + 1}`,
      initialSeconds: 300,
      remaining: 300,
      eliminated: false,
    };
  });
}

function clampDuration(value) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return 300;
  return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, parsed));
}

function formatTime(value) {
  const seconds = Math.max(0, Math.ceil(value));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function activateTool(tool, updateHash = true) {
  const activeTool = ['timer', 'dice', 'random'].includes(tool) ? tool : 'timer';
  const tools = [
    { name: 'timer', tab: elements.timerTab, panel: elements.timerPanel },
    { name: 'dice', tab: elements.diceTab, panel: elements.dicePanel },
    { name: 'random', tab: elements.randomTab, panel: elements.randomPanel },
  ];
  tools.forEach(({ name, tab, panel }) => {
    const active = name === activeTool;
    panel.hidden = !active;
    tab.classList.toggle('selected', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  if (updateHash) history.replaceState(null, '', `#${activeTool}`);
  if (activeTool === 'dice') {
    if (!diceState.ready && !diceState.initializing) initializeDiceBox();
    requestAnimationFrame(resizeDiceCanvas);
  }
}

function syncPlayersFromEditor() {
  const rows = elements.playersEditor.querySelectorAll('.player-editor');
  rows.forEach((row, index) => {
    const nameInput = row.querySelector('[data-field="name"]');
    const timeInput = row.querySelector('[data-field="time"]');
    timerState.players[index].name = nameInput.value.trim() || `玩家 ${index + 1}`;
    timerState.players[index].initialSeconds = clampDuration(timeInput.value);
  });
}

function renderPlayerEditor() {
  elements.playerCount.textContent = String(timerState.players.length);
  elements.removePlayerBtn.disabled = timerState.players.length <= MIN_PLAYERS;
  elements.addPlayerBtn.disabled = timerState.players.length >= MAX_PLAYERS;

  elements.playersEditor.innerHTML = timerState.players
    .map((player, index) => `
      <div class="player-editor">
        <span class="player-number">${index + 1}</span>
        <input
          data-field="name"
          type="text"
          maxlength="16"
          value="${escapeHtml(player.name)}"
          aria-label="玩家 ${index + 1} 名称"
        />
        <label class="duration-control">
          <input
            data-field="time"
            type="number"
            inputmode="numeric"
            min="${MIN_SECONDS}"
            max="${MAX_SECONDS}"
            step="10"
            value="${player.initialSeconds}"
            aria-label="${escapeHtml(player.name)}总秒数"
          />
          秒
        </label>
      </div>
    `)
    .join('');

  renderStartPlayerOptions();
}

function renderStartPlayerOptions() {
  const selected = Math.min(Number(elements.startPlayerSelect.value) || 0, timerState.players.length - 1);
  elements.startPlayerSelect.innerHTML = timerState.players
    .map((player, index) => `<option value="${index}">${escapeHtml(player.name)}</option>`)
    .join('');
  elements.startPlayerSelect.value = String(selected);
}

function setPlayerCount(nextCount) {
  syncPlayersFromEditor();
  const count = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, nextCount));
  timerState.players = createPlayers(count, timerState.players);
  renderPlayerEditor();
}

function renderDuelTimer() {
  const winnerIndex = timerState.gameOver ? timerState.activeIndex : -1;
  elements.duelRound.textContent = timerState.gameOver
    ? `${timerState.players[winnerIndex].name} 获胜`
    : `第 ${timerState.round} 回合`;

  timerState.players.forEach((player, index) => {
    const isActive = index === timerState.activeIndex;
    const button = elements.duelPlayers[index];
    elements.duelNames[index].textContent = player.name;
    elements.duelTimes[index].textContent = formatTime(player.remaining);
    button.classList.toggle('active', isActive && !timerState.gameOver);
    button.classList.toggle('eliminated', player.eliminated);
    button.classList.toggle('winner', index === winnerIndex);
    button.disabled = !timerState.running || !isActive || timerState.gameOver;

    if (player.eliminated) {
      elements.duelStatuses[index].textContent = '超时';
    } else if (timerState.gameOver && index === winnerIndex) {
      elements.duelStatuses[index].textContent = '获胜';
    } else if (!timerState.started) {
      elements.duelStatuses[index].textContent = isActive ? '先手' : '等待';
    } else if (!timerState.running) {
      elements.duelStatuses[index].textContent = isActive ? '已暂停' : '等待';
    } else {
      elements.duelStatuses[index].textContent = isActive ? '计时中' : '等待';
    }
  });

  elements.duelPauseBtn.disabled = timerState.gameOver;
  elements.duelPauseBtn.textContent = timerState.gameOver
    ? '对局结束'
    : !timerState.started
      ? '开始计时'
      : timerState.running
        ? '暂停'
        : '继续计时';
}

function renderTimer() {
  const active = timerState.players[timerState.activeIndex];
  if (!active) return;

  const isDuel = timerState.players.length === 2;
  elements.duelTimer.hidden = !isDuel;
  elements.multiTimer.hidden = isDuel;
  if (isDuel) {
    renderDuelTimer();
    return;
  }

  elements.activeName.textContent = active.name;
  elements.activeTime.textContent = formatTime(active.remaining);
  elements.activePosition.textContent = `玩家 ${timerState.activeIndex + 1} · 第 ${timerState.round} 回合`;
  elements.activePlayerCard.classList.toggle('paused', timerState.started && !timerState.running && !timerState.gameOver);
  elements.activePlayerCard.classList.toggle('game-over', timerState.gameOver);

  if (timerState.gameOver) {
    elements.liveIndicator.textContent = '对局结束';
    elements.pauseBtn.textContent = '对局结束';
    elements.pauseBtn.disabled = true;
    elements.nextTurnBtn.disabled = true;
    elements.timerStatus.textContent = `${active.name} 获胜`;
  } else if (!timerState.started) {
    elements.liveIndicator.textContent = '待开始';
    elements.pauseBtn.textContent = '开始计时';
    elements.pauseBtn.disabled = false;
    elements.nextTurnBtn.disabled = true;
    elements.timerStatus.textContent = `首位玩家：${active.name}`;
  } else if (!timerState.running) {
    elements.liveIndicator.textContent = '已暂停';
    elements.pauseBtn.textContent = '继续计时';
    elements.pauseBtn.disabled = false;
    elements.nextTurnBtn.disabled = true;
    elements.timerStatus.textContent = '计时已暂停';
  } else {
    elements.liveIndicator.textContent = '计时中';
    elements.pauseBtn.textContent = '暂停';
    elements.pauseBtn.disabled = false;
    elements.nextTurnBtn.disabled = false;
    elements.timerStatus.textContent = `轮到 ${active.name}`;
  }

  elements.playerStrip.innerHTML = timerState.players
    .map((player, index) => `
      <button
        type="button"
        class="player-mini ${index === timerState.activeIndex ? 'active' : ''} ${player.eliminated ? 'eliminated' : ''}"
        data-player-index="${index}"
        ${player.eliminated || timerState.gameOver ? 'disabled' : ''}
        aria-label="切换至 ${escapeHtml(player.name)}"
      >
        <span>${escapeHtml(player.name)}${player.eliminated ? ' · 超时' : ''}</span>
        <strong>${formatTime(player.remaining)}</strong>
      </button>
    `)
    .join('');
}

function stopTimerLoop() {
  if (timerState.frameId !== null) {
    cancelAnimationFrame(timerState.frameId);
    timerState.frameId = null;
  }
  timerState.lastTick = null;
}

function alivePlayers() {
  return timerState.players.filter((player) => !player.eliminated);
}

function findNextAliveIndex(fromIndex) {
  for (let offset = 1; offset <= timerState.players.length; offset += 1) {
    const index = (fromIndex + offset) % timerState.players.length;
    if (!timerState.players[index].eliminated) return index;
  }
  return fromIndex;
}

function completeTurn(reason = 'manual') {
  if (!timerState.running || timerState.gameOver) return;
  const previousIndex = timerState.activeIndex;
  const nextIndex = findNextAliveIndex(previousIndex);

  if (nextIndex <= previousIndex) timerState.round += 1;
  timerState.activeIndex = nextIndex;
  timerState.lastTick = performance.now();

  if (reason === 'timeout') {
    elements.timerStatus.textContent = `${timerState.players[previousIndex].name} 超时，已跳过`;
  }
  renderTimer();
}

function timerTick(now) {
  if (!timerState.running || timerState.gameOver) return;
  if (timerState.lastTick === null) timerState.lastTick = now;

  const elapsed = Math.min((now - timerState.lastTick) / 1000, 1);
  timerState.lastTick = now;
  const active = timerState.players[timerState.activeIndex];
  active.remaining = Math.max(0, active.remaining - elapsed);

  if (active.remaining <= 0) {
    active.eliminated = true;
    if (alivePlayers().length <= 1) {
      const winner = alivePlayers()[0] ?? active;
      timerState.activeIndex = timerState.players.indexOf(winner);
      timerState.running = false;
      timerState.gameOver = true;
      stopTimerLoop();
      renderTimer();
      return;
    }
    completeTurn('timeout');
  }

  renderTimer();
  timerState.frameId = requestAnimationFrame(timerTick);
}

function startOrPauseTimer() {
  if (timerState.gameOver) return;

  if (!timerState.started) {
    timerState.started = true;
    timerState.running = true;
    timerState.lastTick = performance.now();
    timerState.frameId = requestAnimationFrame(timerTick);
  } else if (timerState.running) {
    timerState.running = false;
    stopTimerLoop();
  } else {
    timerState.running = true;
    timerState.lastTick = performance.now();
    timerState.frameId = requestAnimationFrame(timerTick);
  }
  renderTimer();
}

function beginGame() {
  syncPlayersFromEditor();
  timerState.players.forEach((player) => {
    player.remaining = player.initialSeconds;
    player.eliminated = false;
  });
  timerState.activeIndex = Number(elements.startPlayerSelect.value) || 0;
  timerState.round = 1;
  timerState.started = false;
  timerState.running = false;
  timerState.gameOver = false;
  stopTimerLoop();
  elements.timerSetup.hidden = true;
  elements.timerGame.hidden = false;
  renderTimer();
}

function returnToSettings() {
  stopTimerLoop();
  timerState.started = false;
  timerState.running = false;
  timerState.gameOver = false;
  elements.timerGame.hidden = true;
  elements.timerSetup.hidden = false;
  renderPlayerEditor();
}

function selectPlayer(index) {
  if (!timerState.started || !timerState.running || timerState.gameOver) return;
  if (timerState.players[index]?.eliminated || index === timerState.activeIndex) return;
  timerState.activeIndex = index;
  timerState.lastTick = performance.now();
  renderTimer();
}

function selectedDiceDefinition() {
  return diceDefinitions[diceState.selected];
}

function setSelectedDie(type) {
  if (!diceDefinitions[type] || diceState.rolling) return;
  const changed = diceState.selected !== type;
  diceState.selected = type;
  const definition = selectedDiceDefinition();
  elements.diceSelector.querySelectorAll('[data-die]').forEach((button) => {
    const selected = button.dataset.die === type;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-checked', String(selected));
  });
  elements.rollLabel.textContent = definition.label;
  elements.rollDetail.textContent = type === 'd100'
    ? '百分骰 + d10 联投；双零计为 100'
    : `投掷 1 颗 ${definition.label}`;
  if (changed) {
    diceState.box?.clear();
    elements.diceResult.textContent = '—';
  }
  renderHistogram();
}

function histogramBins(type) {
  const counts = diceState.stats[type];
  if (type === 'd100') {
    return Array.from({ length: 10 }, (_, index) => {
      const start = (index * 10) + 1;
      const end = start + 9;
      return {
        label: `${start}–${end}`,
        count: counts.slice(start, end + 1).reduce((sum, count) => sum + count, 0),
      };
    });
  }
  return Array.from({ length: diceDefinitions[type].sides }, (_, index) => ({
    label: String(index + 1),
    count: counts[index + 1],
  }));
}

function renderHistogram() {
  const type = diceState.selected;
  const displayType = type === 'd100' ? 'd%' : type;
  const bins = histogramBins(type);
  const total = bins.reduce((sum, bin) => sum + bin.count, 0);
  const maxCount = Math.max(1, ...bins.map((bin) => bin.count));
  elements.histogramSummary.textContent = `${displayType} · ${total} 次投掷`;
  elements.histogram.setAttribute('aria-label', `${displayType} 出数分布，共 ${total} 次投掷`);
  elements.histogram.style.gridTemplateColumns = `repeat(${bins.length}, minmax(0, 1fr))`;
  elements.histogram.innerHTML = bins
    .map((bin) => {
      const percentage = total ? (bin.count / total) * 100 : 0;
      const height = bin.count ? Math.max(4, (bin.count / maxCount) * 100) : 0;
      return `
        <div class="histogram-bar" title="${escapeHtml(bin.label)}：${bin.count} 次（${percentage.toFixed(1)}%）">
          <div class="histogram-track">
            <div class="histogram-fill" style="height: ${height}%">
              <span>${bin.count ? `${percentage.toFixed(0)}%` : ''}</span>
            </div>
          </div>
          <span class="histogram-label">${escapeHtml(bin.label)}</span>
        </div>
      `;
    })
    .join('');
}

function recordDiceResult(type, value) {
  const safeValue = Math.round(Number(value));
  if (safeValue >= 1 && safeValue < diceState.stats[type].length) {
    diceState.stats[type][safeValue] += 1;
  }
  renderHistogram();
}

function clampRandomBound(value, fallback) {
  const parsed = Math.round(Number(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1000000, Math.max(-1000000, parsed));
}

function syncRandomRange() {
  let min = clampRandomBound(elements.randomMin.value, randomState.min);
  let max = clampRandomBound(elements.randomMax.value, randomState.max);
  if (min > max) [min, max] = [max, min];
  elements.randomMin.value = String(min);
  elements.randomMax.value = String(max);

  const changed = min !== randomState.min || max !== randomState.max;
  randomState.min = min;
  randomState.max = max;
  elements.randomRangeLabel.textContent = `${min}–${max}`;
  if (changed) {
    randomState.counts.clear();
    randomState.history = [];
    elements.randomResult.textContent = '—';
    elements.randomStageValue.textContent = '—';
    renderRandomHistory();
  }
  renderRandomHistogram();
}

function randomHistogramBins() {
  const range = randomState.max - randomState.min + 1;
  const binSize = range <= 20 ? 1 : Math.ceil(range / 20);
  const bins = [];
  for (let start = randomState.min; start <= randomState.max; start += binSize) {
    const end = Math.min(randomState.max, start + binSize - 1);
    let count = 0;
    randomState.counts.forEach((valueCount, value) => {
      if (value >= start && value <= end) count += valueCount;
    });
    bins.push({ label: start === end ? String(start) : `${start}–${end}`, count });
  }
  return bins;
}

function renderRandomHistogram() {
  const bins = randomHistogramBins();
  const total = bins.reduce((sum, bin) => sum + bin.count, 0);
  const maxCount = Math.max(1, ...bins.map((bin) => bin.count));
  const rangeLabel = `${randomState.min}–${randomState.max}`;
  elements.randomHistogramSummary.textContent = `${rangeLabel} · ${total} 次生成`;
  elements.randomHistogram.setAttribute('aria-label', `${rangeLabel} 随机数分布，共 ${total} 次生成`);
  elements.randomHistogram.style.gridTemplateColumns = `repeat(${bins.length}, minmax(0, 1fr))`;
  elements.randomHistogram.innerHTML = bins
    .map((bin) => {
      const percentage = total ? (bin.count / total) * 100 : 0;
      const height = bin.count ? Math.max(4, (bin.count / maxCount) * 100) : 0;
      return `
        <div class="histogram-bar" title="${escapeHtml(bin.label)}：${bin.count} 次（${percentage.toFixed(1)}%）">
          <div class="histogram-track">
            <div class="histogram-fill" style="height: ${height}%">
              <span>${bin.count ? `${percentage.toFixed(0)}%` : ''}</span>
            </div>
          </div>
          <span class="histogram-label">${escapeHtml(bin.label)}</span>
        </div>
      `;
    })
    .join('');
}

function renderRandomHistory() {
  if (!randomState.history.length) {
    elements.randomHistory.innerHTML = '<li class="empty-history">还没有随机数记录</li>';
    return;
  }
  elements.randomHistory.innerHTML = randomState.history
    .map((value) => `
      <li>
        <span class="history-type">随机数</span>
        <strong class="history-value">${value}</strong>
      </li>
    `)
    .join('');
}

function generateRandomNumber() {
  syncRandomRange();
  const range = randomState.max - randomState.min + 1;
  const value = randomState.min + randomInteger(range) - 1;
  randomState.counts.set(value, (randomState.counts.get(value) ?? 0) + 1);
  randomState.history.unshift(value);
  randomState.history = randomState.history.slice(0, 10);
  elements.randomResult.textContent = String(value);
  elements.randomStageValue.textContent = String(value);
  elements.randomStage.classList.remove('generating');
  void elements.randomStage.offsetWidth;
  elements.randomStage.classList.add('generating');
  renderRandomHistory();
  renderRandomHistogram();
}

function randomInteger(max) {
  if (crypto.getRandomValues) {
    const range = 0x100000000;
    const limit = range - (range % max);
    const value = new Uint32Array(1);
    do crypto.getRandomValues(value); while (value[0] >= limit);
    return (value[0] % max) + 1;
  }
  return Math.floor(Math.random() * max) + 1;
}

function fallbackResult(type) {
  if (type === 'd100') {
    const tens = randomInteger(10) % 10;
    const ones = randomInteger(10) % 10;
    return {
      value: tens === 0 && ones === 0 ? 100 : (tens * 10) + ones,
      detail: `${tens * 10 || '00'} + ${ones}`,
    };
  }
  return { value: randomInteger(diceDefinitions[type].sides), detail: '' };
}

function flattenRollResults(input, output = [], seen = new Set()) {
  if (!input || typeof input !== 'object' || seen.has(input)) return output;
  seen.add(input);
  if (Number.isFinite(input.value) && (input.sides || input.type)) {
    output.push({
      value: Number(input.value),
      sides: Number(input.sides) || Number(String(input.type).replace(/\D/g, '')) || 0,
      type: String(input.type ?? ''),
    });
    return output;
  }
  Object.values(input).forEach((value) => flattenRollResults(value, output, seen));
  return output;
}

function physicalResult(type, rawResults) {
  const rolls = flattenRollResults(rawResults);
  if (type === 'd100') {
    const percentileRolls = rolls.filter((roll) => roll.sides === 10 || /d10/i.test(roll.type));
    const [tensRoll, onesRoll] = percentileRolls;
    if (!tensRoll || !onesRoll) return fallbackResult(type);
    const tens = (tensRoll.value % 10) * 10;
    const ones = onesRoll.value % 10;
    return {
      value: tens === 0 && ones === 0 ? 100 : tens + ones,
      detail: `${String(tens).padStart(2, '0')} + ${ones}`,
    };
  }
  const roll = rolls.find((item) => item.sides === diceDefinitions[type].sides) ?? rolls[0];
  return roll ? { value: roll.value, detail: '' } : fallbackResult(type);
}

function addRollHistory(type, result) {
  diceState.history.unshift({
    type: type === 'd100' ? 'd%' : type,
    value: result.value,
    detail: result.detail,
  });
  diceState.history = diceState.history.slice(0, 6);
  recordDiceResult(type, result.value);
  renderRollHistory();
}

function renderRollHistory() {
  if (!diceState.history.length) {
    elements.rollHistory.innerHTML = '<li class="empty-history">还没有投掷记录</li>';
    return;
  }
  elements.rollHistory.innerHTML = diceState.history
    .map((roll) => `
      <li title="${escapeHtml(roll.detail || `${roll.type} = ${roll.value}`)}">
        <span class="history-type">${escapeHtml(roll.type)}</span>
        <strong class="history-value">${roll.value}</strong>
      </li>
    `)
    .join('');
}

async function rollDice() {
  if (diceState.rolling) return;
  diceState.rolling = true;
  elements.rollBtn.disabled = true;
  elements.rollBtn.textContent = '投掷中…';
  elements.diceResult.textContent = '…';

  const type = diceState.selected;
  let result;

  try {
    if (diceState.ready && diceState.box) {
      const rawResults = await diceState.box.roll(diceDefinitions[type].notation);
      result = physicalResult(type, rawResults);
      sharpenDiceCanvas();
    } else {
      elements.fallbackDie.hidden = false;
      elements.fallbackDie.classList.remove('rolling');
      void elements.fallbackDie.offsetWidth;
      elements.fallbackDie.classList.add('rolling');
      await new Promise((resolve) => setTimeout(resolve, 760));
      result = fallbackResult(type);
      elements.fallbackDie.textContent = String(result.value);
    }
  } catch (error) {
    console.warn('物理骰子投掷失败，已使用本地随机数。', error);
    result = fallbackResult(type);
    elements.fallbackDie.hidden = false;
    elements.fallbackDie.textContent = String(result.value);
  }

  elements.diceResult.textContent = String(result.value);
  elements.rollDetail.textContent = result.detail || `本次 ${type} 结果：${result.value}`;
  addRollHistory(type, result);
  diceState.rolling = false;
  elements.rollBtn.disabled = false;
  elements.rollBtn.textContent = '抛骰子';
}

function sharpenDiceCanvas() {
  const canvas = elements.diceStage.querySelector('canvas');
  if (!canvas) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2.5);
  const width = Math.round(elements.diceStage.clientWidth * ratio);
  const height = Math.round(elements.diceStage.clientHeight * ratio);
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
}

function resizeDiceCanvas() {
  if (!diceState.ready || !diceState.box || elements.dicePanel.hidden) return;
  diceState.box.resizeWorld();
  requestAnimationFrame(sharpenDiceCanvas);
}

async function initializeDiceBox() {
  if (diceState.initializing || diceState.ready) return;
  diceState.initializing = true;
  try {
    const module = await import('https://unpkg.com/@3d-dice/dice-box@1.1.4/dist/dice-box.es.min.js');
    const DiceBox = module.default;
    const box = new DiceBox({
      container: '#diceStage',
      assetPath: 'assets/',
      origin: 'https://unpkg.com/@3d-dice/dice-box@1.1.4/dist/',
      offscreen: false,
      theme: 'default',
      themeColor: '#c94736',
      scale: 8.5,
      gravity: 1.15,
      mass: 1,
      friction: 0.8,
      restitution: 0.28,
      spinForce: 6,
      throwForce: 5,
    });
    await box.init();
    diceState.box = box;
    diceState.ready = true;
    elements.diceLoading.hidden = true;
    resizeDiceCanvas();
    await box.roll('1d6');
    sharpenDiceCanvas();
    elements.diceResult.textContent = '—';
  } catch (error) {
    console.warn('3D 骰子不可用，已启用本地随机动画。', error);
    elements.diceLoading.textContent = '轻量随机模式';
    setTimeout(() => {
      elements.diceLoading.hidden = true;
      elements.fallbackDie.hidden = false;
    }, 800);
  } finally {
    diceState.initializing = false;
  }
}

elements.removePlayerBtn.addEventListener('click', () => setPlayerCount(timerState.players.length - 1));
elements.addPlayerBtn.addEventListener('click', () => setPlayerCount(timerState.players.length + 1));
elements.playersEditor.addEventListener('input', () => {
  syncPlayersFromEditor();
  renderStartPlayerOptions();
});
elements.startGameBtn.addEventListener('click', beginGame);
elements.timerSettingsBtn.addEventListener('click', returnToSettings);
elements.duelPauseBtn.addEventListener('click', startOrPauseTimer);
elements.duelPlayers.forEach((button, index) => {
  button.addEventListener('click', () => {
    if (timerState.activeIndex === index) completeTurn('manual');
  });
});
elements.pauseBtn.addEventListener('click', startOrPauseTimer);
elements.nextTurnBtn.addEventListener('click', () => completeTurn('manual'));
elements.activePlayerCard.addEventListener('click', () => completeTurn('manual'));
elements.activePlayerCard.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    completeTurn('manual');
  }
});
elements.playerStrip.addEventListener('click', (event) => {
  const button = event.target.closest('[data-player-index]');
  if (button) selectPlayer(Number(button.dataset.playerIndex));
});

elements.diceSelector.addEventListener('click', (event) => {
  const button = event.target.closest('[data-die]');
  if (button) setSelectedDie(button.dataset.die);
});
elements.rollBtn.addEventListener('click', rollDice);
elements.diceStage.addEventListener('click', rollDice);
elements.clearHistoryBtn.addEventListener('click', () => {
  diceState.history = [];
  elements.diceResult.textContent = '—';
  renderRollHistory();
});
elements.clearStatsBtn.addEventListener('click', () => {
  diceState.stats[diceState.selected].fill(0);
  renderHistogram();
});
elements.generateRandomBtn.addEventListener('click', generateRandomNumber);
elements.randomStage.addEventListener('click', generateRandomNumber);
elements.clearRandomHistoryBtn.addEventListener('click', () => {
  randomState.history = [];
  renderRandomHistory();
});
elements.clearRandomStatsBtn.addEventListener('click', () => {
  randomState.counts.clear();
  renderRandomHistogram();
});

elements.toolTabs.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-tool]');
  if (tab) activateTool(tab.dataset.tool);
});

elements.toolTabs.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  const tools = ['timer', 'dice', 'random'];
  const currentTool = tools.find((tool) => !elements[`${tool}Panel`].hidden) ?? 'timer';
  const direction = event.key === 'ArrowRight' ? 1 : -1;
  const nextTool = tools[(tools.indexOf(currentTool) + direction + tools.length) % tools.length];
  activateTool(nextTool);
  elements[`${nextTool}Tab`].focus();
});

window.addEventListener('hashchange', () => activateTool(location.hash.slice(1), false));
window.addEventListener('resize', resizeDiceCanvas);

document.addEventListener('visibilitychange', () => {
  if (document.hidden && timerState.running) startOrPauseTimer();
});

renderPlayerEditor();
setSelectedDie('d6');
renderRandomHistogram();
activateTool(location.hash.slice(1), false);
