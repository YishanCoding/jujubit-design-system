/* JuJuBit dashboard interaction kit. Data is supplied by the caller; no build step. */
(function (global) {
  "use strict";
  const d3 = global.d3;
  const DAY = 86400000;
  const fmt = (n) =>
    n == null || !Number.isFinite(n)
      ? "—"
      : Math.round(n).toLocaleString("zh-CN");
  const pct = (n) =>
    n == null || !Number.isFinite(n) ? "—" : (n * 100).toFixed(1) + "%";
  const iso = (d) => new Date(d).toISOString().slice(0, 10);
  const date = (s) => new Date(s + "T12:00:00Z");
  const add = (s, n) => iso(new Date(date(s).getTime() + n * DAY));
  const short = (s) => s.slice(5);
  const css = (name) =>
    getComputedStyle(
      document.querySelector(".jjb-dash") || document.documentElement,
    )
      .getPropertyValue("--jjb-dash-" + name)
      .trim();
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };
  const sum = (rows, key) =>
    rows.reduce((n, r) => n + (Number.isFinite(r[key]) ? r[key] : 0), 0);
  const visible = (node) => node && !node.hidden;
  const hasD3 = () => {
    if (!d3) throw new Error("JJBDash requires D3 7.8.5");
  };
  const C = (name) => css(name.startsWith("c-") ? name : "c-" + name);
  const color = (item) => css(item.color || "c-search");
  function createState(initial) {
    const value = Object.assign(
      {
        preset: "近 90 天",
        customStart: "",
        customEnd: "",
        granularity: "day",
        views: {},
        chips: {},
      },
      initial,
    );
    const listeners = new Set();
    function update(patch) {
      Object.assign(value, patch);
      listeners.forEach((fn) => fn(value));
      return value;
    }
    function subscribe(fn) {
      listeners.add(fn);
      fn(value);
      return () => listeners.delete(fn);
    }
    return { value, update, subscribe };
  }
  function range(state, dates) {
    const sorted = dates.slice().sort(),
      first = sorted[0],
      last = sorted.at(-1);
    if (!first) return { start: "", end: "", days: 0, label: state.preset };
    let start = first,
      end = last;
    if (state.preset === "上周") {
      const dow = (date(last).getUTCDay() + 6) % 7;
      start = add(last, -dow - 7);
      end = add(start, 6);
    } else if (state.preset === "近两周") start = add(last, -13);
    else if (state.preset === "近 30 天") start = add(last, -29);
    else if (state.preset === "近 90 天") start = add(last, -89);
    else if (state.preset === "自定义") {
      start = state.customStart || last;
      end = state.customEnd || last;
    }
    const days = Math.max(0, Math.round((date(end) - date(start)) / DAY) + 1);
    return {
      start,
      end,
      days,
      label: state.preset,
      text: `选中 ${start} ~ ${end}（${days} 天）`,
    };
  }
  function inRange(rows, r) {
    return rows.filter((row) => row.date >= r.start && row.date <= r.end);
  }
  function aggregate(rows, granularity, keys, mode) {
    if (granularity !== "week")
      return rows.map((row) => ({
        ...row,
        label: short(row.date),
        end: row.date,
      }));
    const groups = new Map();
    rows.forEach((row) => {
      const monday = add(row.date, -((date(row.date).getUTCDay() + 6) % 7));
      if (!groups.has(monday)) groups.set(monday, []);
      groups.get(monday).push(row);
    });
    return [...groups].map(([key, list]) => {
      const out = {
        date: key,
        end: add(key, 6),
        label: `周 ${short(key)} ~ ${short(add(key, 6))}`,
        weekend: false,
      };
      keys.forEach((k) => {
        const nums = list.map((x) => x[k]).filter(Number.isFinite);
        out[k] = nums.length
          ? mode && mode[k] === "mean"
            ? nums.reduce((a, b) => a + b, 0) / nums.length
            : nums.reduce((a, b) => a + b, 0)
          : null;
      });
      return out;
    });
  }
  function dateBar(root, state, dates, badges) {
    root.innerHTML = `<span class="jjb-dash-date-bar__label">时间范围</span><div class="jjb-dash-date-bar__group" aria-label="时间范围"></div><span class="jjb-dash-date-bar__custom" hidden><input class="jjb-dash-date" type="date" aria-label="开始日期"> → <input class="jjb-dash-date" type="date" aria-label="结束日期"></span><span class="jjb-dash-date-bar__label">聚合粒度</span><div class="jjb-dash-date-bar__group" aria-label="聚合粒度"></div><span class="jjb-dash-date-bar__range" data-range-info></span>`;
    const presets = [
      "全周期",
      "上周",
      "近两周",
      "近 30 天",
      "近 90 天",
      "自定义",
    ];
    const pg = root.querySelector('[aria-label="时间范围"]');
    const gg = root.querySelector('[aria-label="聚合粒度"]');
    presets.forEach((p) => {
      const b = el("button", "jjb-dash-pill", p);
      b.type = "button";
      b.addEventListener("click", () => {
        if (p === "自定义") {
          const current = range(state.value, dates);
          state.update({
            preset: p,
            customStart: state.value.customStart || current.start,
            customEnd: state.value.customEnd || current.end,
          });
        } else state.update({ preset: p });
      });
      pg.append(b);
    });
    [
      ["day", "按日"],
      ["week", "按周"],
    ].forEach(([v, t]) => {
      const b = el("button", "jjb-dash-pill", t);
      b.type = "button";
      b.addEventListener("click", () => state.update({ granularity: v }));
      gg.append(b);
    });
    const inputs = root.querySelectorAll("input");
    inputs[0].addEventListener("change", () =>
      state.update({ preset: "自定义", customStart: inputs[0].value }),
    );
    inputs[1].addEventListener("change", () =>
      state.update({ preset: "自定义", customEnd: inputs[1].value }),
    );
    state.subscribe((s) => {
      const r = range(s, dates);
      [...pg.children].forEach((b) =>
        b.setAttribute("aria-pressed", String(b.textContent === s.preset)),
      );
      [...gg.children].forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(
            b.textContent === (s.granularity === "week" ? "按周" : "按日"),
          ),
        ),
      );
      root.querySelector(".jjb-dash-date-bar__custom").hidden =
        s.preset !== "自定义";
      inputs[0].value = s.customStart || r.start;
      inputs[1].value = s.customEnd || r.end;
      root.querySelector("[data-range-info]").innerHTML =
        `选中 <b>${r.start}</b> ~ <b>${r.end}</b>（${r.days} 天）`;
      (badges || []).forEach((b) => {
        b.textContent = `${s.preset} · ${s.granularity === "week" ? "按周" : "按日"} · ${r.days} 天`;
      });
    });
  }
  function chips(root, state, key, items, available, opts = {}) {
    if (!state.value.chips[key])
      state.value.chips[key] = (
        opts.selected || items.filter((x) => !x.disabled).map((x) => x.id)
      ).slice();
    let more = false;
    function draw() {
      const chosen = state.value.chips[key];
      root.replaceChildren();
      items.forEach((item) => {
        const b = el("button", "jjb-dash-chip");
        b.type = "button";
        b.dataset.chip = item.id;
        b.style.setProperty(
          "--jjb-dash-series",
          `var(--jjb-dash-${item.color || "c-search"})`,
        );
        b.innerHTML = '<i class="jjb-dash-chip__dot"></i>';
        b.append(document.createTextNode(item.name));
        const enabled = !item.disabled && available(item.id);
        b.disabled = !enabled;
        if (!enabled) b.title = "当前范围无数据";
        b.setAttribute("aria-pressed", String(chosen.includes(item.id)));
        if (item.detail && !more) b.hidden = true;
        b.addEventListener("click", () => {
          const old = state.value.chips[key];
          let next = old.includes(item.id)
            ? old.filter((x) => x !== item.id)
            : [...old, item.id];
          if (opts.allId && item.id === opts.allId) next = [opts.allId];
          else if (
            opts.allId &&
            next.includes(opts.allId) &&
            item.id !== opts.allId
          )
            next = next.filter((x) => x !== opts.allId);
          if (next.length) {
            state.value.chips[key] = next;
            state.update({ chips: state.value.chips });
          }
        });
        root.append(b);
      });
      const detailCount = items.filter((x) => x.detail).length;
      if (detailCount) {
        const b = el(
          "button",
          "jjb-dash-chip jjb-dash-chip--more",
          more ? "收起细分渠道 ▲" : `细分渠道 ${detailCount} 个 ▼`,
        );
        b.type = "button";
        b.setAttribute("aria-expanded", String(more));
        b.addEventListener("click", () => {
          more = !more;
          draw();
        });
        root.append(b);
      }
    }
    state.subscribe(draw);
    return { redraw: draw };
  }
  function viewToggle(card, state, key) {
    const root = card.querySelector("[data-view-toggle]");
    if (!root) return;
    ["chart", "numbers"].forEach((v, i) => {
      const b = el("button", "", i ? "数字" : "图表");
      b.type = "button";
      b.dataset.view = v;
      b.addEventListener("click", () => {
        state.value.views[key] = v;
        state.update({ views: state.value.views });
      });
      root.append(b);
    });
    state.subscribe((s) => {
      const mode = s.views[key] || "chart";
      root
        .querySelectorAll("button")
        .forEach((b) =>
          b.setAttribute("aria-pressed", String(b.dataset.view === mode)),
        );
      const chart = card.querySelector("[data-chart-view]"),
        numbers = card.querySelector("[data-numbers]");
      if (chart) chart.hidden = mode !== "chart";
      if (numbers) numbers.hidden = mode !== "numbers";
    });
  }
  async function copyImage(button, target) {
    button.disabled = true;
    button.textContent = "复制中…";
    try {
      const canvas = await global.html2canvas(target, {
        scale: 2,
        backgroundColor: css("surface"),
        ignoreElements: (n) => n.hasAttribute("data-no-copy"),
      });
      const blob = await new Promise((done) =>
        canvas.toBlob(done, "image/png"),
      );
      if (!blob || !navigator.clipboard?.write || !global.ClipboardItem)
        throw new Error("clipboard unavailable");
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      button.classList.add("is-success");
      button.textContent = "已复制";
    } catch (e) {
      button.classList.add("is-error");
      button.textContent = "复制失败";
    }
    clearTimeout(button._reset);
    button._reset = setTimeout(() => {
      button.classList.remove("is-success", "is-error");
      button.disabled = false;
      button.textContent = "复制图片";
    }, 1600);
  }
  function infoTip(root = document) {
    const tip = el("div", "jjb-dash-info-float");
    tip.hidden = true;
    tip.setAttribute("role", "tooltip");
    const host = root.matches?.(".jjb-dash")
      ? root
      : root.querySelector(".jjb-dash");
    if (!host) throw new Error("JJBDash.infoTip requires a .jjb-dash root");
    host.append(tip);
    function place(e) {
      tip.style.left =
        Math.max(
          4,
          Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8),
        ) + "px";
      tip.style.top =
        Math.max(
          4,
          Math.min(e.clientY + 14, innerHeight - tip.offsetHeight - 8),
        ) + "px";
    }
    root.addEventListener("pointerover", (e) => {
      const b = e.target.closest("[data-info]");
      if (!b) return;
      tip.innerHTML = b.dataset.info;
      tip.hidden = false;
      place(e);
    });
    root.addEventListener("pointermove", (e) => {
      if (!tip.hidden) place(e);
    });
    root.addEventListener("pointerout", (e) => {
      if (e.target.closest("[data-info]")) tip.hidden = true;
    });
    root.addEventListener("focusin", (e) => {
      if (e.target.matches("[data-info]")) {
        tip.innerHTML = e.target.dataset.info;
        tip.hidden = false;
        const r = e.target.getBoundingClientRect();
        place({ clientX: r.left, clientY: r.bottom });
      }
    });
    root.addEventListener("focusout", () => (tip.hidden = true));
  }
  function table(root, columns, rows, limit = 8) {
    const expanded = root.dataset.expanded === "true";
    root.replaceChildren();
    const scroll = el("div", "jjb-dash-table-wrap"),
      t = el("table", "jjb-dash-table"),
      head = el("thead"),
      body = el("tbody");
    const tr = el("tr");
    columns.forEach((c) => tr.append(el("th", "", c.label)));
    head.append(tr);
    (expanded ? rows : rows.slice(0, limit)).forEach((row) => {
      const tr = el("tr");
      columns.forEach((c) => tr.append(el("td", "", String(c.value(row)))));
      body.append(tr);
    });
    t.append(head, body);
    scroll.append(t);
    root.append(scroll);
    if (rows.length > limit) {
      const b = el(
        "button",
        "jjb-dash-table-more",
        expanded ? "收起" : "展开全部",
      );
      b.type = "button";
      b.dataset.expand = "";
      b.setAttribute("aria-expanded", String(expanded));
      b.addEventListener("click", () => {
        root.dataset.expanded = expanded ? "false" : "true";
        table(root, columns, rows, limit);
      });
      root.append(b);
    }
  }
  function empty(root, message) {
    root.replaceChildren(
      el(
        "div",
        "jjb-dash-empty",
        message || "当前筛选范围没有可展示的示例数据",
      ),
    );
  }
  function axes(svg, rows, w, h, max, opts = {}) {
    const m = { top: 24, right: opts.right ? 58 : 20, bottom: 66, left: 52 };
    const x = d3
      .scalePoint(
        rows.map((r) => r.date),
        [m.left, w - m.right],
      )
      .padding(0.25);
    const y = d3.scaleLinear([0, Math.max(0.0001, max)], [h - m.bottom, m.top]);
    svg
      .append("g")
      .selectAll("line")
      .data(y.ticks(5))
      .join("line")
      .attr("class", "jjb-dash-gridline")
      .attr("x1", m.left)
      .attr("x2", w - m.right)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d));
    svg
      .append("g")
      .attr("class", "jjb-dash-axis")
      .attr("transform", `translate(${m.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(opts.yFormat || null));
    const ticks =
      rows.length > 16
        ? rows
            .filter((_, i) => i % Math.ceil(rows.length / 12) === 0)
            .map((r) => r.date)
        : rows.map((r) => r.date);
    svg
      .append("g")
      .attr("class", "jjb-dash-axis")
      .attr("transform", `translate(0,${h - m.bottom})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(ticks)
          .tickFormat((k) => rows.find((r) => r.date === k).label),
      )
      .selectAll("text")
      .attr("transform", "rotate(-35)")
      .style("text-anchor", "end");
    return { x, y, m };
  }
  function crosshair(svg, wrap, cfg) {
    const { rows, x, y, m, w, h, series } = cfg;
    const yOf = cfg.yOf || ((s, v) => y(v));
    if (!rows.length) return;
    wrap
      .querySelectorAll(".jjb-dash-tip,.jjb-dash-pin")
      .forEach((x) => x.remove());
    const focus = svg
      .append("g")
      .attr("class", "jjb-dash-crosshair")
      .style("display", "none");
    const line = focus
      .append("line")
      .attr("y1", m.top)
      .attr("y2", h - m.bottom)
      .attr("stroke", css("border-strong"))
      .attr("stroke-dasharray", "4,3");
    const dots = focus.append("g");
    const tip = el("div", "jjb-dash-tip");
    tip.hidden = true;
    wrap.append(tip);
    const pins = new Map();
    const entries = (row) =>
      series
        .map((s) => ({ s, value: row[s.key] }))
        .filter((x) => Number.isFinite(x.value));
    function content(row) {
      const es = entries(row);
      const h = el("strong", "", row.label + (row.weekend ? " · 周末" : ""));
      const box = el("div");
      box.append(h);
      es.forEach(({ s, value }) => {
        const line = el("div", "jjb-dash-tip-row");
        const sw = el("i", "jjb-dash-tip-swatch");
        sw.style.background = color(s);
        line.append(
          sw,
          el("span", "", s.name),
          el("strong", "", s.format ? s.format(value) : fmt(value)),
        );
        box.append(line);
      });
      if (es.length === 1 && es[0].s.detail)
        box.append(el("small", "jjb-dash-tip__sub", es[0].s.detail(row)));
      box.append(el("small", "jjb-dash-tip__sub", "示例数据"));
      return box.innerHTML;
    }
    function markers(row, cls) {
      const g = svg.append("g").attr("class", cls);
      g.append("line")
        .attr("x1", x(row.date))
        .attr("x2", x(row.date))
        .attr("y1", m.top)
        .attr("y2", h - m.bottom)
        .attr("stroke", css("border-strong"))
        .attr("stroke-dasharray", "4,3");
      g.selectAll("circle")
        .data(entries(row))
        .join("circle")
        .attr("cx", x(row.date))
        .attr("cy", (e) => yOf(e.s, e.value))
        .attr("r", 4)
        .attr("fill", (e) => color(e.s))
        .attr("stroke", css("surface"))
        .attr("stroke-width", 1.4);
      return g;
    }
    function show(row, e) {
      focus.style("display", null);
      line.attr("x1", x(row.date)).attr("x2", x(row.date));
      dots.selectAll("*").remove();
      dots
        .selectAll("circle")
        .data(entries(row))
        .join("circle")
        .attr("cx", x(row.date))
        .attr("cy", (d) => yOf(d.s, d.value))
        .attr("r", 4)
        .attr("fill", (d) => color(d.s))
        .attr("stroke", css("surface"))
        .attr("stroke-width", 1.4);
      tip.innerHTML = content(row);
      tip.hidden = false;
      const b = wrap.getBoundingClientRect();
      tip.style.left =
        Math.max(
          4,
          Math.min(
            e.clientX - b.left + 14,
            wrap.clientWidth - tip.offsetWidth - 4,
          ),
        ) + "px";
      tip.style.top =
        Math.max(
          4,
          Math.min(
            e.clientY - b.top + 12,
            wrap.clientHeight - tip.offsetHeight - 4,
          ),
        ) + "px";
    }
    const overlay = svg
      .append("rect")
      .attr("class", "jjb-dash-overlay")
      .attr("x", m.left)
      .attr("y", m.top)
      .attr("width", w - m.left - m.right)
      .attr("height", h - m.top - m.bottom)
      .attr("fill", "transparent");
    function nearest(e) {
      const mx = d3.pointer(e, overlay.node())[0];
      return rows.reduce(
        (best, r) =>
          Math.abs(x(r.date) - mx) < Math.abs(x(best.date) - mx) ? r : best,
        rows[0],
      );
    }
    overlay
      .on("pointermove", (e) => show(nearest(e), e))
      .on("pointerleave", () => {
        focus.style("display", "none");
        tip.hidden = true;
      })
      .on("click", (e) => {
        const row = nearest(e),
          key = row.date;
        if (pins.has(key)) {
          const old = pins.get(key);
          old.card.remove();
          old.g.remove();
          pins.delete(key);
          return;
        }
        const g = markers(row, "jjb-dash-pin-marker"),
          card = el("div", "jjb-dash-pin");
        card.innerHTML = `<button type="button" class="jjb-dash-pin__close" data-no-copy aria-label="关闭固定提示">×</button>${content(row)}`;
        wrap.append(card);
        const used = new Set([...pins.values()].map((pin) => pin.slot));
        const columns = Math.max(1, Math.floor((wrap.clientWidth - 8) / 268));
        const bounds = wrap.getBoundingClientRect();
        const clickX = e.clientX - bounds.left;
        const clickY = e.clientY - bounds.top;
        let slot = 0;
        while (slot < columns * 4) {
          const left = Math.min(4 + (slot % columns) * 268, wrap.clientWidth - card.offsetWidth - 4);
          const top = Math.min(4 + Math.floor(slot / columns) * (card.offsetHeight + 8), wrap.clientHeight - card.offsetHeight - 4);
          const coversClick = clickX >= left - 8 && clickX <= left + card.offsetWidth + 8 && clickY >= top - 8 && clickY <= top + card.offsetHeight + 8;
          if (!used.has(slot) && !coversClick) break;
          slot++;
        }
        while (used.has(slot)) slot++;
        const column = slot % columns;
        const rowIndex = Math.floor(slot / columns);
        card.style.left =
          Math.min(4 + column * 268, wrap.clientWidth - card.offsetWidth - 4) + "px";
        card.style.top =
          Math.max(4, Math.min(4 + rowIndex * (card.offsetHeight + 8), wrap.clientHeight - card.offsetHeight - 4)) + "px";
        function close(ev) {
          ev.stopPropagation();
          card.remove();
          g.remove();
          pins.delete(key);
        }
        card.querySelector("button").addEventListener("click", close);
        card.addEventListener("dblclick", close);
        pins.set(key, { card, g, slot });
      });
  }
  function chartSetup(root, rows, max, opts = {}) {
    hasD3();
    root.replaceChildren();
    if (!rows.length) {
      empty(root);
      return null;
    }
    const wrap = el("div", "jjb-dash-chart-wrap");
    const svg = d3
      .select(wrap)
      .append("svg")
      .attr("role", "img")
      .attr("aria-label", opts.label || "示例数据图表");
    const w = Math.max(840, root.clientWidth || 840),
      h = 336;
    svg.attr("viewBox", `0 0 ${w} ${h}`);
    root.append(wrap);
    const scales = axes(svg, rows, w, h, max, opts);
    return { wrap, svg, w, h, ...scales };
  }
  function lineChart(root, rows, series) {
    const vals = rows
      .flatMap((r) => series.map((s) => r[s.key]))
      .filter(Number.isFinite);
    const ctx = chartSetup(root, rows, d3.max(vals) || 1, {
      yFormat: series.length && series.every((s) => s.format === pct) ? pct : null,
    });
    if (!ctx) return;
    const { svg, x, y, m, w, h, wrap } = ctx;
    series.forEach((s) => {
      const points = rows.map((r) => ({ date: r.date, value: r[s.key] }));
      svg
        .append("path")
        .datum(points)
        .attr(
          "class",
          "jjb-dash-line" + (s.dashed ? " jjb-dash-line--dashed" : ""),
        )
        .style("--jjb-dash-series", `var(--jjb-dash-${s.color})`)
        .attr("stroke", color(s))
        .attr(
          "d",
          d3
            .line()
            .defined((d) => Number.isFinite(d.value))
            .x((d) => x(d.date))
            .y((d) => y(d.value))
            .curve(d3.curveMonotoneX),
        );
    });
    crosshair(svg, wrap, { rows, x, y, m, w, h, series });
  }
  function barLineChart(root, rows, bars, lines) {
    const all = [...bars, ...lines],
      max =
        d3.max(
          rows.flatMap((r) => all.map((s) => r[s.key]).filter(Number.isFinite)),
        ) || 1;
    const ctx = chartSetup(root, rows, max, { right: true });
    if (!ctx) return;
    const { svg, x, y, m, w, h, wrap } = ctx;
    const lineMax =
      d3.max(
        rows.flatMap((r) => lines.map((s) => r[s.key]).filter(Number.isFinite)),
      ) || 1;
    const yRight = d3.scaleLinear([0, lineMax], [h - m.bottom, m.top]);
    svg
      .append("g")
      .attr("class", "jjb-dash-axis")
      .attr("transform", `translate(${w - m.right},0)`)
      .call(d3.axisRight(yRight).ticks(5));
    const bw = Math.max(
      3,
      Math.min(26, ((w - m.left - m.right) / rows.length) * 0.55),
    );
    bars.forEach((s) =>
      svg
        .append("g")
        .selectAll("rect")
        .data(rows.filter((r) => Number.isFinite(r[s.key])))
        .join("rect")
        .attr("class", "jjb-dash-bar-mark")
        .attr("x", (r) => x(r.date) - bw / 2)
        .attr("y", (r) => y(r[s.key]))
        .attr("width", bw)
        .attr("height", (r) => h - m.bottom - y(r[s.key]))
        .style("--jjb-dash-series", `var(--jjb-dash-${s.color})`)
        .attr("fill", color(s)),
    );
    lines.forEach((s) =>
      svg
        .append("path")
        .datum(rows)
        .attr("class", "jjb-dash-line")
        .style("--jjb-dash-series", `var(--jjb-dash-${s.color})`)
        .attr("stroke", color(s))
        .attr(
          "d",
          d3
            .line()
            .defined((r) => Number.isFinite(r[s.key]))
            .x((r) => x(r.date))
            .y((r) => yRight(r[s.key]))
            .curve(d3.curveMonotoneX),
        ),
    );
    crosshair(svg, wrap, {
      rows,
      x,
      y,
      m,
      w,
      h,
      series: all,
      yOf: (s, v) => (lines.includes(s) ? yRight(v) : y(v)),
    });
  }
  function stackedBarChart(root, rows, series) {
    const max =
      d3.max(rows, (r) => series.reduce((n, s) => n + (r[s.key] || 0), 0)) || 1;
    const ctx = chartSetup(root, rows, max);
    if (!ctx) return;
    const { svg, x, y, m, w, h, wrap } = ctx;
    rows
      .filter((r) => r.weekend)
      .forEach((r) =>
        svg
          .append("rect")
          .attr("class", "jjb-dash-weekend")
          .attr("x", x(r.date) - 13)
          .attr("y", m.top)
          .attr("width", 26)
          .attr("height", h - m.top - m.bottom),
      );
    const bw = Math.max(
      4,
      Math.min(26, ((w - m.left - m.right) / rows.length) * 0.6),
    );
    rows.forEach((r) => {
      let base = 0;
      series.forEach((s) => {
        const v = r[s.key];
        if (Number.isFinite(v)) {
          svg
            .append("rect")
            .attr("x", x(r.date) - bw / 2)
            .attr("y", y(base + v))
            .attr("width", bw)
            .attr("height", y(base) - y(base + v))
            .attr("fill", color(s));
          base += v;
        }
      });
    });
    crosshair(svg, wrap, {
      rows,
      x,
      y: (r) => y(r),
      m,
      w,
      h,
      series: series.map((s) => ({
        ...s,
        detail: (r) => (r.weekend ? "周末 · 示例数据" : "示例数据"),
      })),
    });
  }
  function timelineChart(root, items) {
    hasD3();
    root.replaceChildren();
    if (!items.length) {
      empty(root);
      return;
    }
    const wrap = el("div", "jjb-dash-chart-wrap jjb-dash-timeline-wrap");
    root.append(wrap);
    const w = Math.max(840, root.clientWidth || 840),
      h = Math.max(220, items.length * 56 + 45);
    const svg = d3.select(wrap).append("svg").attr("viewBox", `0 0 ${w} ${h}`);
    const max =
      d3.max(items, (d) => d.stages.reduce((n, s) => n + s.hours, 0)) || 1;
    const x = d3.scaleLinear([0, max], [130, w - 130]);
    const pins = new Map();
    const stageHtml = (item, stage) =>
      `<strong>${item.name} · ${stage.name} ${stage.hours}h</strong><br>` +
      item.stages.map((part) => `${part.name} ${part.hours}h`).join(" · ") +
      `<br>拒${item.rejects || 0} · 示例数据`;
    items.forEach((item, i) => {
      const y = 30 + i * 56;
      svg
        .append("text")
        .attr("x", 8)
        .attr("y", y + 19)
        .text(item.name);
      let at = 0;
      item.stages.forEach((stage) => {
        const startHour = at;
        const rect = svg
          .append("rect")
          .attr("class", "jjb-dash-timeline-segment")
          .attr("x", x(at))
          .attr("y", y)
          .attr("width", Math.max(1, x(at + stage.hours) - x(at)))
          .attr("height", 26)
          .attr("fill", css(stage.color || "blue"));
        rect
          .on("pointermove", (e) => {
            tip.hidden = false;
            tip.innerHTML = stageHtml(item, stage);
            placeFloating(tip, e);
            const px = d3.pointer(e, svg.node())[0];
            hoverLine.attr("x1", px).attr("x2", px).style("display", null);
          })
          .on("pointerleave", () => {
            tip.hidden = true;
            hoverLine.style("display", "none");
          })
          .on("click", (e) => {
            e.stopPropagation();
            const key = item.name + ":" + stage.name;
            if (pins.has(key)) {
              pins.get(key).card.remove();
              pins.get(key).marker.remove();
              pins.delete(key);
              return;
            }
            const marker = svg.append("line")
              .attr("class", "jjb-dash-timeline-pin-line")
              .attr("x1", x(startHour + stage.hours / 2))
              .attr("x2", x(startHour + stage.hours / 2))
              .attr("y1", y - 3).attr("y2", y + 29);
            const card = el("div", "jjb-dash-pin");
            card.innerHTML = `<button type="button" class="jjb-dash-pin__close" data-no-copy aria-label="关闭固定提示">×</button>${stageHtml(item, stage)}`;
            wrap.append(card);
            const used = new Set([...pins.values()].map((pin) => pin.slot));
            let slot = 0;
            while (used.has(slot)) slot++;
            const columns = Math.max(1, Math.floor((wrap.clientWidth - 8) / 268));
            card.style.left = Math.max(4, Math.min(4 + (slot % columns) * 268, wrap.clientWidth - card.offsetWidth - 4)) + "px";
            card.style.top = Math.max(4, Math.min(4 + Math.floor(slot / columns) * (card.offsetHeight + 8), wrap.clientHeight - card.offsetHeight - 4)) + "px";
            function close(ev) { ev.stopPropagation(); card.remove(); marker.remove(); pins.delete(key); }
            card.querySelector("button").addEventListener("click", close);
            card.addEventListener("dblclick", close);
            pins.set(key, { card, marker, slot });
          });
        at += stage.hours;
      });
      svg
        .append("text")
        .attr("class", "jjb-dash-timeline-tail")
        .attr("x", Math.min(w - 120, x(at) + 8))
        .attr("y", y + 19)
        .text(`${at}h · 拒${item.rejects || 0}`);
    });
    const tip = el("div", "jjb-dash-tip");
    tip.hidden = true;
    wrap.append(tip);
    const hoverLine = svg.append("line")
      .attr("class", "jjb-dash-timeline-hover-line")
      .attr("y1", 24).attr("y2", h - 20).style("display", "none");
  }
  function placeFloating(node, e) {
    const b = node.parentElement.getBoundingClientRect();
    node.style.left =
      Math.max(
        4,
        Math.min(
          e.clientX - b.left + 12,
          node.parentElement.clientWidth - node.offsetWidth - 4,
        ),
      ) + "px";
    node.style.top =
      Math.max(
        4,
        Math.min(
          e.clientY - b.top + 8,
          node.parentElement.clientHeight - node.offsetHeight - 4,
        ),
      ) + "px";
  }
  function sankey(root, nodes, links) {
    hasD3();
    root.replaceChildren();
    if (!links.length) {
      empty(root);
      return;
    }
    if (!d3.sankey) throw new Error("JJBDash requires d3-sankey 0.12.3");
    const wrap = el("div", "jjb-dash-chart-wrap jjb-dash-sankey-wrap");
    root.append(wrap);
    const w = Math.max(840, root.clientWidth || 840),
      h = 440;
    const svg = d3.select(wrap).append("svg").attr("viewBox", `0 0 ${w} ${h}`);
    const graph = d3
      .sankey()
      .nodeId((d) => d.id)
      .nodeWidth(16)
      .nodePadding(14)
      .nodeAlign((d) => d.layer)
      .extent([
        [24, 42],
        [w - 28, h - 28],
      ])({
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({ ...l })),
    });
    const defs = svg.append("defs");
    const bg = svg
      .append("rect")
      .attr("class", "jjb-dash-sankey-bg")
      .attr("width", w)
      .attr("height", h)
      .attr("fill", "transparent");
    ["来源", "产品页", "渠道下载", "总下载"].forEach((t, i) =>
      svg
        .append("text")
        .attr("class", "jjb-dash-sankey-layer")
        .attr("x", 24 + (i * (w - 50)) / 3)
        .attr("y", 22)
        .text(t),
    );
    const tip = el("div", "jjb-dash-tip jjb-dash-sankey-tip");
    tip.hidden = true;
    wrap.append(tip);
    let locked = null;
    const linkEls = [],
      nodeEls = [];
    function chainFor(nd) {
      const ls = new Set(),
        ns = new Set([nd.index]);
      function visit(node, dir, seen) {
        if (seen.has(node.index)) return;
        seen.add(node.index);
        graph.links.forEach((l, i) => {
          if (
            (dir === "out" && l.source.index === node.index) ||
            (dir === "in" && l.target.index === node.index)
          ) {
            ls.add(i);
            ns.add(l.source.index);
            ns.add(l.target.index);
            visit(dir === "out" ? l.target : l.source, dir, seen);
          }
        });
      }
      visit(nd, "in", new Set());
      visit(nd, "out", new Set());
      return { ls, ns };
    }
    function paint(path) {
      linkEls.forEach((p, i) =>
        p.style("opacity", !path ? 0.48 : path.ls.has(i) ? 1 : 0.06),
      );
      nodeEls.forEach((p, i) =>
        p.style("opacity", !path || path.ns.has(i) ? 1 : 0.22),
      );
    }
    function showTip(html, e) {
      tip.innerHTML = html;
      tip.hidden = false;
      placeFloating(tip, e);
    }
    function details(nd) {
      const flow = (title, list, other) => {
        const total = d3.sum(list, (l) => l.value);
        const head = `<div class="jjb-dash-flow-row"><span>${title}</span><span>数量</span><span>占比</span><span>转化率</span></div>`;
        const rows = list
          .slice(0, 6)
          .map(
            (l) =>
              `<div class="jjb-dash-flow-row"><span>${other === "in" ? l.source.name : l.target.name}</span><span>${fmt(l.value)}</span><span>${pct(l.value / total)}</span><span>${l.denom ? pct(l.value / l.denom) : "—"}</span></div>`,
          )
          .join("");
        return list.length
          ? head +
              rows +
              (list.length > 6
                ? `<small>省略 ${list.length - 6} 条</small>`
                : "")
          : "";
      };
      const ins = graph.links
          .filter((l) => l.target.index === nd.index)
          .sort((a, b) => b.value - a.value),
        outs = graph.links
          .filter((l) => l.source.index === nd.index)
          .sort((a, b) => b.value - a.value);
      return `<strong>${nd.name}</strong><br>总量 ${fmt(nd.value)} · 转化率 ${ins.length && outs.length ? pct(d3.sum(outs, (l) => l.value) / d3.sum(ins, (l) => l.value)) : "—"}${flow("← 流入", ins, "in")}${flow("→ 流出", outs, "out")}`;
    }
    graph.links.forEach((l, i) => {
      const id = "jjb-flow-" + i + "-" + Math.floor(w);
      const g = defs
        .append("linearGradient")
        .attr("id", id)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", l.source.x1)
        .attr("x2", l.target.x0);
      g.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", css(l.source.color));
      g.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", css(l.target.color));
      const p = svg
        .append("path")
        .attr("class", "jjb-dash-sankey-link")
        .attr("d", d3.sankeyLinkHorizontal()(l))
        .attr("stroke", `url(#${id})`)
        .attr("stroke-width", Math.max(1, l.width))
        .attr("fill", "none")
        .style("opacity", 0.48);
      p.on("pointermove", (e) => {
        if (!locked)
          paint({
            ls: new Set([i]),
            ns: new Set([l.source.index, l.target.index]),
          });
        showTip(
          `<strong>${l.source.name} → ${l.target.name}</strong><br>数量 ${fmt(l.value)} · 占比 ${pct(l.value / l.source.value)} · 转化率 ${l.denom ? pct(l.value / l.denom) : "—"}`,
          e,
        );
      })
        .on("pointerleave", () => {
          paint(locked);
          tip.hidden = true;
        })
        .on("click", (e) => {
          e.stopPropagation();
          locked = {
            ls: new Set([i]),
            ns: new Set([l.source.index, l.target.index]),
          };
          paint(locked);
        });
      linkEls.push(p);
    });
    graph.nodes.forEach((n) => {
      const group = svg.append("g").attr("class", "jjb-dash-sankey-node");
      group
        .append("rect")
        .attr("x", n.x0)
        .attr("y", n.y0)
        .attr("width", n.x1 - n.x0)
        .attr("height", Math.max(1, n.y1 - n.y0))
        .attr("fill", css(n.color));
      if (n.group) {
        group
          .append("rect")
          .attr("class", "jjb-dash-sankey-group")
          .attr("x", n.x0 - 6)
          .attr("y", n.y0 - 6)
          .attr("width", n.x1 - n.x0 + 12)
          .attr("height", Math.max(12, n.y1 - n.y0 + 12));
        group
          .append("text")
          .attr("class", "jjb-dash-sankey-group-label")
          .attr("x", n.x0 + 20)
          .attr("y", n.y0 - 2)
          .text(n.group);
      }
      group
        .append("text")
        .attr("x", n.x0 < w / 2 ? n.x1 + 5 : n.x0 - 5)
        .attr("y", (n.y0 + n.y1) / 2)
        .attr("text-anchor", n.x0 < w / 2 ? "start" : "end")
        .text(n.name);
      group
        .on("pointermove", (e) => {
          const p = chainFor(n);
          if (!locked) paint(p);
          showTip(details(n), e);
        })
        .on("pointerleave", () => {
          paint(locked);
          tip.hidden = true;
        })
        .on("click", (e) => {
          e.stopPropagation();
          locked = chainFor(n);
          paint(locked);
          tip.hidden = true;
        });
      nodeEls.push(group);
    });
    bg.on("click", () => {
      locked = null;
      paint(null);
      tip.hidden = true;
    });
  }
  function legend(root, series, type = "line") {
    root.replaceChildren();
    series.forEach((s) => {
      const span = el("span", "jjb-dash-legend__item");
      span.style.setProperty(
        "--jjb-dash-series",
        `var(--jjb-dash-${s.color || "c-search"})`,
      );
      span.innerHTML = `<i class="jjb-dash-legend__${type === "bar" ? "swatch" : "line"}${s.dashed ? " jjb-dash-legend__line--dashed" : ""}"></i>`;
      span.append(document.createTextNode(s.name));
      root.append(span);
    });
  }
  function sampleData(seed = 4319) {
    let x = seed >>> 0;
    const rand = () => {
      x = (Math.imul(1664525, x) + 1013904223) >>> 0;
      return x / 4294967296;
    };
    const start = "2026-06-01";
    return Array.from({ length: 120 }, (_, i) => {
      const d = add(start, i),
        weekend = [0, 6].includes(date(d).getUTCDay());
      const base = 80 + Math.round(rand() * 40) + (weekend ? -16 : 0);
      return {
        date: d,
        weekend,
        impressions: base * 11,
        views: base * 7,
        downloads: base * 2,
        search: Math.round(base * 0.72),
        asa: Math.round(base * 0.34),
        browse: Math.round(base * 0.26),
        appref: Math.round(base * 0.14),
        web: Math.round(base * 0.12),
        instagram: Math.round(base * 0.09),
        facebook: Math.round(base * 0.07),
        tiktok: Math.round(base * 0.06),
        v1: i < 70 ? +(rand() * 0.035).toFixed(4) : null,
        v2: i > 30 ? +(rand() * 0.025).toFixed(4) : null,
        v3: null,
        star1: Math.round(rand() * 2),
        star2: Math.round(rand() * 3),
        star3: Math.round(rand() * 4),
        star4: Math.round(rand() * 5),
        star5: Math.round(rand() * 10),
        invalid: i % 17 === 0 ? null : Math.round(base * 0.16),
      };
    });
  }
  global.JJBDash = {
    createState,
    range,
    inRange,
    aggregate,
    dateBar,
    chips,
    viewToggle,
    copyImage,
    infoTip,
    crosshair,
    lineChart,
    barLineChart,
    stackedBarChart,
    timelineChart,
    sankey,
    table,
    legend,
    empty,
    sampleData,
    fmt,
    pct,
    C,
  };
})(window);
