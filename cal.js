function _amsCivilParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat("nl-NL", {
      timeZone: "Europe/Amsterdam",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    return {
      y: +parts.find(p => p.type === "year").value,
      m: +parts.find(p => p.type === "month").value,
      d: +parts.find(p => p.type === "day").value,
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
    // 0..6 (Sun..Sat) -> 0..6 (Mon=0)
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
    return `${parts.find(p=>p.type==="year").value}-${parts.find(p=>p.type==="month").value}-${parts.find(p=>p.type==="day").value}`;
  }
  function headingAms(d) {
    
    return new Intl.DateTimeFormat("nl-NL", {
      timeZone: "Europe/Amsterdam",
      weekday: "long",
      day: "numeric",
      month: "short",
    }).format(d).toUpperCase();
  }
  
 
  const PRESENCE = {
    // 'YYYY-MM-DD': ['Naam', 'Naam2']
    // voorbeeld:
    // '2025-08-01': ['Tristan', 'Martine'],
  };
  
  
  function DayCard({ dateUTC }) {
    const dateKey = ymdAms(dateUTC);
    const names = PRESENCE[dateKey] || [];
  
    return (
      <section className="day-card" data-date={dateKey}>
        <h2 className="day-title">{headingAms(dateUTC)}</h2>
        <div className="day-body">
          {names.length ? (
            names.map(n => <div key={n}>{n}</div>)
          ) : (
            <div className="empty">Niemand is aanwezig vandaag :(</div>
          )}
        </div>
      </section>
    );
  }
  
  function Week({ offset = 0 }) {
    const monday = startOfWeekMondayUTC(addDaysUTC(amsTodayAsUTC(), offset * 7));
    const days = Array.from({ length: 7 }, (_, i) => addDaysUTC(monday, i));
    return (
      <div className="week">
        {days.map(d => <DayCard key={ymdAms(d)} dateUTC={d} />)}
      </div>
    );
  }
  
  function App() {
    const [offset, setOffset] = React.useState(0); 
  
    //html controls
    React.useEffect(() => {
      const cur = document.querySelector(".controls .current");
      const nxt = document.querySelector(".controls .next");
      
      const onCur = () => setOffset(0);
      const onNxt = () => setOffset(1);

      cur?.addEventListener("click", onCur);
      nxt?.addEventListener("click", onNxt);
      
      return () => {
        cur?.removeEventListener("click", onCur);
        nxt?.removeEventListener("click", onNxt);
      };
    }, []);
  
    return <Week offset={offset} />;
  }
  
  const mountNode =
    document.getElementById("root") || document.querySelector(".home_cal");
  ReactDOM.createRoot(mountNode).render(<App />);