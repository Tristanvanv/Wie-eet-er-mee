(async function () {
  "use strict";

  function _amsCivilParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat("nl-NL", {
      timeZone: "Europe/Amsterdam",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    return {
      y: +parts.find((p) => p.type === "year").value,
      m: +parts.find((p) => p.type === "month").value,
      d: +parts.find((p) => p.type === "day").value,
    };
  }
  function _utcNoonFromCivil({ y, m, d }) {
    return new Date(Date.UTC(y, m - 1, d, 12));
  }
  function amsTodayAsUTC() {
    return _utcNoonFromCivil(_amsCivilParts(new Date()));
  }
  function addDaysUTC(date, days) {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + days);
    return d;
  }
  function startOfWeekMondayUTC(date) {
    // 0..6 (Sun..Sat) => 0..6 (Mon=0)
    const dowMon0 = (date.getUTCDay() + 6) % 7;
    return addDaysUTC(date, -dowMon0);
  }
  function ymdAms(d) {
    const parts = new Intl.DateTimeFormat("nl-NL", {
      timeZone: "Europe/Amsterdam",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    return (
      parts.find((p) => p.type === "year").value +
      "-" +
      parts.find((p) => p.type === "month").value +
      "-" +
      parts.find((p) => p.type === "day").value
    );
  }
  function headingAms(d) {
    return new Intl.DateTimeFormat("nl-NL", {
      timeZone: "Europe/Amsterdam",
      weekday: "long",
      day: "numeric",
      month: "short",
    })
      .format(d)
      .toUpperCase();
  }

  const param = new URLSearchParams(location.search);
  const HOUSEHOLD = (param.get("household") || "").toLowerCase();

  const DATA_URL = 'https://attendenceprogram.onrender.com';

  async function loadPresence() {
    const cacheKey = "presence-cache";
    try {
      const res = await fetch(DATA_URL, { cache: "no-store" });
      const data = await res.json();
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    } catch {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
      throw new Error(
        "Kan data/presence.json niet laden en geen cache beschikbaar."
      );
    }
  }

  const DATA = await loadPresence();

  // Validatie
  const mount =
    document.querySelector(".home_cal") || document.getElementById("root");

  if (!HOUSEHOLD || !DATA.households || !DATA.households[HOUSEHOLD]) {
    const ids = Object.keys(DATA.households || {});

    if (mount) {
      mount.innerHTML = `
      <div class="error">
        <h2>Onbekend huishouden</h2>
        ${
          ids.length
            ? `<p>Kies een van de beschikbare opties:</p>
               <ul class="options">
                 ${ids
                   .map(
                     (id) =>
                       `<li><a href="calendar.html?household=${id}">${
                         DATA.households[id]?.name || id
                       }</a></li>`
                   )
                   .join("")}
               </ul>`
            : `<p>Er zijn nog geen households in <code>presence.json</code>.</p>`
        }
      </div>`;
    }
    return;
  }

  // render
  function createDayCard(dateUTC, todayKey, DATA, focusId, offset) {
    const key = ymdAms(dateUTC);
    const dow = ((dateUTC.getUTCDay() + 6) % 7) + 1;
    const offKey = String(offset ?? 0);         // "0" or "1"

    const presentIds =
      (DATA.schedule?.byOffset?.[offKey]?.[dow]?.[focusId]) || [];
      DATA.schedule?.weekday?.[dow]?.[focusId] ||
      [];
    const names = presentIds.map(id => DATA.people?.[id]?.name || id);

    const section = document.createElement("section");
    section.className = "day-card";
    section.dataset.date = key;
    if (key === todayKey) section.classList.add("is-today");

    const h2 = document.createElement("h2");
    h2.className = "day-title";
    h2.textContent = headingAms(dateUTC);

    const body = document.createElement("div");
    body.className = "day-body";

    if (names.length) {
      presentIds.forEach((id, idx) => {
        const div = document.createElement("div");
        const label = names[idx];
        div.className = "person";
        div.textContent = label;
        body.appendChild(div);
      });
    } else {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "Niemand is aanwezig vandaag :(";
      body.appendChild(empty);
    }

    section.appendChild(h2);
    section.appendChild(body);
    return section;
  }

  function renderWeek(container, offset, DATA, focusId) {
    const monday = startOfWeekMondayUTC(
      addDaysUTC(amsTodayAsUTC(), offset * 7)
    );
    const todayKey = ymdAms(amsTodayAsUTC());

    const wrapper = document.createElement("div");
    wrapper.className = "week";

    for (let i = 0; i < 7; i++) {
      const d = addDaysUTC(monday, i);
      wrapper.appendChild(createDayCard(d, todayKey, DATA, focusId, offset));
    }

    //replace
    container.innerHTML = "";
    container.appendChild(wrapper);
  }

  //controls
  function setupControls(onOffsetChange) {
    const container = document.querySelector(".controls");
    if (!container) return;

    let controls = Array.from(container.querySelectorAll("[data-week-offset]"));
    if (controls.length === 0) {
      const cur = container.querySelector(".current");
      const nxt = container.querySelector(".next");
      if (cur) cur.setAttribute("data-week-offset", "0");
      if (nxt) nxt.setAttribute("data-week-offset", "1");
      controls = Array.from(container.querySelectorAll("[data-week-offset]"));
    }

    const markActive = (btn) => {
      controls.forEach((el) => el.classList.toggle("is-active", el === btn));
    };

    const onClick = (e) => {
      const btn = e.target.closest("[data-week-offset]");
      if (!btn || !container.contains(btn)) return;
      const off = Number(btn.getAttribute("data-week-offset") || 0);
      onOffsetChange(off);
      markActive(btn);
    };

    const onKey = (e) => {
      const btn = e.target.closest("[data-week-offset]");
      if (!btn) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
      }
    };

    container.addEventListener("click", onClick);
    container.addEventListener("keydown", onKey);
    controls.forEach((el) => {
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
    });

    // init: activeeer “Deze week”
    const first = controls.find(
      (el) => el.getAttribute("data-week-offset") === "0"
    );
    if (first) first.classList.add("is-active");
  }

  const mountNode =
    document.getElementById("root") || document.querySelector(".home_cal");
  if (!mountNode) return;

  let currentOffset = 0;
  renderWeek(mountNode, currentOffset, DATA, HOUSEHOLD);

  setupControls((off) => {
    currentOffset = off;
    renderWeek(mountNode, currentOffset, DATA, HOUSEHOLD);
  });
})();
