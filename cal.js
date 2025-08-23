(function () {
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
  
    
    const PRESENCE = window.PRESENCE || {
      // 'YYYY-MM-DD': ['Naam', 'Naam 2'],
      // '2025-08-01': ['Tristan', 'Martine'],
    };
  
   // render
    function createDayCard(dateUTC, todayKey) {
      const key = ymdAms(dateUTC);
      const names = PRESENCE[key] || [];
  
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
        for (const n of names) {
          const div = document.createElement("div");
          div.className = "person";
          div.textContent = n;
          body.appendChild(div);
        }
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
  
    function renderWeek(container, offset) {
      const monday = startOfWeekMondayUTC(addDaysUTC(amsTodayAsUTC(), offset * 7));
      const todayKey = ymdAms(amsTodayAsUTC());
  
      const wrapper = document.createElement("div");
      wrapper.className = "week";
  
      for (let i = 0; i < 7; i++) {
        const d = addDaysUTC(monday, i);
        wrapper.appendChild(createDayCard(d, todayKey));
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
      const first = controls.find((el) => el.getAttribute("data-week-offset") === "0");
      if (first) first.classList.add("is-active");
    }
  
    
    const mountNode = document.getElementById("root") || document.querySelector(".home_cal");
    if (!mountNode) return;
  
    let currentOffset = 0;
    renderWeek(mountNode, currentOffset);
    setupControls((off) => {
      currentOffset = off;
      renderWeek(mountNode, currentOffset);
    });
  })();
  