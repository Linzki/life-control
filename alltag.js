// © 2026 TinyRoom Studio. Alltag: Aufgaben, Plan, Anleitungen und Zielwege.
// Erzeugt von bauen.py.
"use strict";
function createAlltag(host) {
// © 2026 TinyRoom Studio. Zielwege: Fragen, Möglichkeiten, Dauer und Spielkarte.

// Alle Stunden- und Wochenwerte sind grobe Richtwerte (Annahmen), keine Garantie.
const num = (value, fallback = 0) => {
  const n = parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};
const q = (id, label, extra = {}) => ({ id, label, type: "number", ...extra });
const choice = (id, label, options) => ({ id, label, type: "choice", options });
const deadline = q("date", "Bis wann willst du es schaffen? (darfst du leer lassen)", { type: "date", optional: true });
const weekly = (label = "Wie viele Stunden pro Woche hast du realistisch dafür?") => q("hours", label, { min: 0.5, max: 40, value: 3 });
const phase = (title, share, ...steps) => ({ title, share, steps });

const QUESTS = {
  exam: { name: "Prüfung oder Schulfach", match: /prüfung|test|klausur|schularbeit|note|mathe|deutsch|englisch|matura|abitur|abschluss/i,
    questions: [choice("level", "Wie gut kennst du den Stoff schon?", { most: "Das meiste kenne ich", gaps: "Ich habe Lücken", new: "Fast alles ist neu" }),
      weekly(), deadline],
    routes(a) {
      const base = { most: 12, gaps: 25, new: 45 }[a.level] || 25;
      const phases = [phase("Überblick holen", .1, "Prüfungsstoff aufschreiben", "Unterlagen sammeln", "Einfach und schwer markieren"),
        phase("Lücken schließen", .4, "Erstes schweres Thema verstehen", "Zweites schweres Thema verstehen", "Offene Fragen stellen"),
        phase("Üben", .3, "Übungsaufgaben lösen", "Fehler ansehen und wiederholen", "Zusammenfassung auf eine Seite"),
        phase("Probeprüfung", .15, "Eine alte Prüfung mit Zeit rechnen", "Schwachstellen nacharbeiten"),
        phase("Endspurt", .05, "Zusammenfassung ansehen", "Tasche packen und früh schlafen")];
      return [{ id: "self", name: "Selbstständig lernen", text: "Kostet nichts, braucht eigenen Antrieb.", hours: base, phases },
        { id: "group", name: "Mit Lerngruppe", text: "Feste Treffen helfen beim Dranbleiben.", hours: base, phases },
        { id: "tutor", name: "Mit Nachhilfe", text: "Gezielte Hilfe bei Lücken, kostet meist Geld.", hours: base * .85, phases }];
    } },
  language: { name: "Sprache lernen", match: /sprache|italienisch|französisch|spanisch|englisch lernen|deutsch lernen|b1|b2|a2/i,
    questions: [choice("now", "Wo stehst du?", { 0: "Ganz am Anfang", 90: "A1 – erste Sätze", 190: "A2 – einfache Gespräche", 375: "B1 – ich komme zurecht" }),
      choice("target", "Wohin willst du?", { 190: "A2", 375: "B1", 550: "B2" }), weekly(), deadline],
    check: a => num(a.target) <= num(a.now) ? "Dein Zielniveau muss über deinem jetzigen liegen." : "",
    routes(a) {
      const hours = num(a.target, 375) - num(a.now);
      const phases = [phase("Start", .1, "Material oder Kurs aussuchen", "Feste Lernzeiten eintragen"),
        phase("Wortschatz", .25, "Alltagswörter lernen", "Kurze Sätze bilden"),
        phase("Grammatik", .25, "Zeiten üben", "Eigene Texte schreiben"),
        phase("Hören und Sprechen", .3, "Serie oder Podcast in der Sprache", "Mit jemandem sprechen"),
        phase("Niveau prüfen", .1, "Online-Einstufungstest machen", "Schwächen wiederholen")];
      return [{ id: "self", name: "Allein mit App und Medien", text: "Günstig und flexibel, Sprechen kommt leicht zu kurz.", hours: hours * 1.15, phases },
        { id: "course", name: "Sprachkurs", text: "Klare Struktur, meist mit Kosten.", hours, phases },
        { id: "tandem", name: "Kurs und Sprechpartner", text: "Mehr Sprechen, etwas mehr Organisation.", hours: hours * .9, phases }];
    } },
  license: { name: "Führerschein", match: /führerschein|fahrschule|fahren lernen|moped|motorrad/i,
    questions: [q("lessons", "Wie viele Fahrstunden rechnest du ein?", { min: 5, max: 80, value: 25 }),
      q("cost", "Was kostet alles ungefähr? Frag eine Fahrschule (in €)", { min: 0, max: 20000, value: 2000 }),
      q("have", "Wie viel hast du dafür schon, auch Zuschüsse? (€)", { value: 0 }),
      q("monthly", "Wie viel kannst du pro Monat dafür zurücklegen? (€)", { value: 100 }), weekly(), deadline],
    routes(a) {
      const lessons = num(a.lessons, 25), cost = num(a.cost, 2000);
      const phases = [phase("Vorbereiten", .1, "Mindestalter in deinem Land prüfen", "Zwei Fahrschulen vergleichen", "Sehtest und Unterlagen erledigen"),
        phase("Theorie", .35, "Kurs besuchen", "Fragen täglich üben", "Theorieprüfung bestehen"),
        phase("Fahren", .45, "Erste Fahrstunden", "Stadt, Land und Autobahn üben", "Prüfungsfahrt üben"),
        phase("Prüfung", .1, "Termin vereinbaren", "Gut ausgeschlafen hingehen")];
      const hours = 30 + lessons;
      return [{ id: "steady", name: "Nach und nach", text: "Neben Schule oder Arbeit, mit Zeit zum Sparen.", hours, cost, minWeeks: Math.ceil(lessons / 2) + 6, phases },
        { id: "intense", name: "Intensivkurs", text: "Kürzere Ausbildung, wenn das Geld schon da ist. Rechnet hier mit 10 % höheren Kosten.", hours, cost: Math.round(cost * 1.1), minWeeks: 5, phases }];
    } },
  save: { name: "Auf etwas sparen", match: /sparen|kaufen|geld|handy|laptop|konsole|fahrrad|urlaub|reise/i,
    questions: [q("price", "Wie viel kostet es? (€)", { min: 1, value: 300 }), q("have", "Wie viel hast du schon? (€)", { value: 0 }),
      q("monthly", "Wie viel kannst du sicher pro Monat sparen? (€)", { min: 1, value: 30 }),
      q("extra", "Wie viel könntest du zusätzlich verdienen, z. B. mit kleinen Jobs? (€ pro Monat)", { value: 0 }), deadline],
    routes(a) {
      const price = num(a.price), monthly = num(a.monthly), extra = num(a.extra);
      const phases = [phase("Plan machen", .1, "Preis genau prüfen", "Spardose oder Unterkonto anlegen"),
        phase("Erstes Viertel", .25, "Sparbetrag zurücklegen", "Eine unnötige Ausgabe streichen"),
        phase("Halbzeit", .25, "Weiter regelmäßig sparen", "Preise noch einmal vergleichen"),
        phase("Fast da", .3, "Sparbetrag zurücklegen", "Überlegen: Will ich es noch?"),
        phase("Kaufen", .1, "Bestes Angebot wählen", "Beleg aufheben")];
      const list = [{ id: "plain", name: "Regelmäßig sparen", text: "Jeden Monat derselbe Betrag.", cost: price, monthly, phases }];
      if (extra) list.push({ id: "extra", name: "Sparen und dazuverdienen", text: "Schneller, braucht Zeit. Erkundige dich, was in deinem Alter erlaubt ist.", cost: price, monthly: monthly + extra, phases });
      list.push({ id: "used", name: "Gebraucht kaufen", text: "Angenommen: etwa ein Drittel günstiger. Zustand prüfen!", cost: Math.round(price * .67), monthly, phases });
      return list;
    } },
  run: { name: "5 km laufen", match: /laufen|joggen|5 ?km|kondition|fitness|sport/i,
    questions: [choice("now", "Wie weit läufst du jetzt ohne Pause?", { "10.0": "Noch kaum", "8.0": "Etwa 1–2 km", "5.0": "Etwa 3–4 km" }),
      q("days", "Wie oft pro Woche kannst du laufen? (2 bis 4)", { min: 2, max: 4, value: 3 }), deadline],
    routes(a) {
      const weeks = Math.ceil((num(a.now, 10)) * (num(a.days, 3) < 3 ? 1.35 : 1));
      const phases = [phase("Startklar", .1, "Bei Beschwerden vorher ärztlich fragen", "Passende Schuhe", "Feste Lauftage eintragen"),
        phase("Gehen und Laufen", .35, "Abwechselnd 1 Minute laufen, 2 gehen", "Pausentage einhalten"),
        phase("Länger laufen", .35, "10 Minuten am Stück", "20 Minuten am Stück"),
        phase("5 km", .2, "30 Minuten locker laufen", "Deine 5 km!")];
      return [{ id: "plan", name: "Allein mit Laufplan", text: "Langsam steigern, wann du Zeit hast.", weeks, phases },
        { id: "club", name: "Mit Verein oder Laufgruppe", text: "Mehr Motivation durch andere.", weeks, phases }];
    } },
  job: { name: "Ausbildung oder Job finden", match: /job|arbeit|lehre|lehrstelle|lehrplatz|ausbildung|praktikum|bewerb|beruf/i,
    questions: [choice("docs", "Sind Lebenslauf und Anschreiben fertig?", { 0: "Ja", 1: "Teilweise", 2: "Nein" }),
      q("applications", "Wie viele Bewerbungen schaffst du pro Woche?", { min: 1, max: 20, value: 2 }), deadline],
    routes(a) {
      const weeks = num(a.docs, 1) + Math.ceil(15 / num(a.applications, 2)) + 6;
      const phases = [phase("Richtung finden", .15, "Drei Berufe aufschreiben", "Mit jemandem aus dem Beruf sprechen"),
        phase("Unterlagen", .15, "Lebenslauf schreiben", "Anschreiben schreiben", "Gegenlesen lassen"),
        phase("Bewerben", .4, "Passende Stellen sammeln", "Bewerbungen abschicken", "Nachfragen"),
        phase("Gespräche", .25, "Antworten auf typische Fragen üben", "Zum Gespräch gehen"),
        phase("Zusage", .05, "Vertrag in Ruhe prüfen lassen", "Start vorbereiten")];
      return [{ id: "direct", name: "Direkt bewerben", text: "Die Dauer hängt stark von Angebot und Ort ab.", weeks, phases },
        { id: "intern", name: "Erst ein Praktikum", text: "Dauert länger, zeigt dir den Beruf und öffnet Türen.", weeks: weeks + 4, phases },
        { id: "advice", name: "Mit Berufsberatung", text: "Kostenlose Beratungsstellen helfen bei Auswahl und Unterlagen.", weeks, phases }];
    } },
  music: { name: "Instrument lernen", match: /gitarre|klavier|schlagzeug|geige|instrument|singen|musik/i,
    questions: [choice("target", "Was willst du können?", { 20: "Ein erstes Lied", 80: "Mehrere Lieder flüssig", 200: "Sicher vor anderen spielen" }), weekly(), deadline],
    routes(a) {
      const hours = num(a.target, 20);
      const phases = [phase("Start", .1, "Instrument besorgen oder leihen", "Übungszeiten eintragen"),
        phase("Grundlagen", .35, "Haltung und erste Töne", "Einfache Übungen"),
        phase("Erstes Stück", .3, "Lied in Teilen üben", "Teile verbinden"),
        phase("Festigen", .25, "Langsam fehlerfrei spielen", "Jemandem vorspielen")];
      return [{ id: "self", name: "Mit Videos selbst lernen", text: "Günstig, Fehler bemerkt man schwerer.", hours: hours * 1.2, phases },
        { id: "lessons", name: "Mit Unterricht", text: "Rückmeldung hilft, kostet meist Geld.", hours, phases }];
    } },
  own: { name: "Eigenes Ziel", match: null,
    questions: [{ id: "steps", label: "Welche Schritte gehören dazu? Einer pro Zeile (2 bis 8)", type: "lines" },
      q("total", "Wie viele Stunden Arbeit schätzt du insgesamt?", { min: 1, max: 5000, value: 20 }), weekly(), deadline],
    check: a => lines(a.steps).length < 2 ? "Schreib mindestens zwei Schritte, jeden in eine eigene Zeile." : "",
    routes(a) {
      const steps = lines(a.steps);
      const phases = steps.map(s => phase(s, 1 / steps.length, "Anfangen", "Dranbleiben", "Abschließen"));
      return [{ id: "plan", name: "In meinem Tempo", text: "So wie du es eingeschätzt hast.", hours: num(a.total, 20), phases },
        { id: "soft", name: "Mit Luft für schwere Wochen", text: "Rechnet mit nur zwei Dritteln deiner Zeit.", hours: num(a.total, 20) * 1.5, phases }];
    } },
};
function lines(text) { return String(text || "").split("\n").map(s => s.trim().slice(0, 80)).filter(Boolean).slice(0, 8); }
// Ziele rund ums Abnehmen plant die App bewusst nicht.
const BODY_GOAL = /abnehm|gewicht|diät|kalorien|\bkg\b|dünn|schlank|fasten|muskeln aufbauen/i;

// Wie lange dauert ein Weg? Mit 25 % Puffer, weil nicht jede Woche klappt.
function estimate(route, answers) {
  let training = 0;
  if (route.hours) training = route.hours / Math.max(.5, num(answers.hours, 3));
  if (route.weeks) training = route.weeks;
  training = Math.max(training, route.minWeeks || 0);
  let saving = 0;
  if (route.cost !== undefined && ("have" in answers || "price" in answers)) {
    const open = Math.max(0, route.cost - num(answers.have));
    const monthly = route.monthly ?? num(answers.monthly);
    saving = open === 0 ? 0 : monthly > 0 ? open / monthly * 4.35 : Infinity;
  }
  const low = Math.max(1, Math.ceil(Math.max(training, saving)));
  const likely = Math.max(1, Math.ceil(Math.max(training * 1.25, saving * 1.05)));
  const high = Math.max(likely, Math.ceil(Math.max(training * 1.6, saving * 1.2)));
  return { low, likely, high, moneyLimits: saving > training };
}
function span(weeks) {
  if (!Number.isFinite(weeks)) return "ohne Sparbetrag nicht erreichbar";
  if (weeks <= 11) return weeks === 1 ? "1 Woche" : `${weeks} Wochen`;
  if (weeks < 104) return `${Math.round(weeks / 4.35)} Monate`;
  return `${(weeks / 52).toLocaleString("de-DE", { maximumFractionDigits: 1 })} Jahre`;
}
function reality(route, answers) {
  const e = estimate(route, answers), notes = [];
  if (!Number.isFinite(e.likely)) return ["Ohne Geld zum Zurücklegen geht dieser Weg nicht auf. Ändere deine Angaben."];
  if (e.moneyLimits) notes.push("Hier bestimmt das Geld das Tempo, nicht deine Zeit.");
  if (num(answers.hours) > 20) notes.push("Über 20 Stunden pro Woche halten die wenigsten durch. Rechne lieber mit weniger.");
  if (answers.date) {
    const left = Math.floor((new Date(answers.date + "T12:00") - Date.now()) / 6048e5);
    if (left < e.low) notes.push(`Bis zu deinem Datum sind es etwa ${Math.max(0, left)} Wochen. Das ist sehr knapp – verschiebe das Datum, nimm mehr Zeit oder ein kleineres Ziel.`);
    else if (left < e.likely) notes.push("Dein Datum ist möglich, aber ohne viel Puffer.");
    else notes.push("Dein Datum passt zu diesem Weg.");
  }
  return notes;
}

// ---------- Oberfläche ----------
let wizard = null, openNode = null;
function currentQuest() {
  const quest = state.quest;
  if (!quest) return null;
  const route = QUESTS[quest.type].routes(quest.answers).find(r => r.id === quest.route);
  if (!route) return null;
  const done = route.phases.map((p, i) => p.steps.filter((_, s) => quest.done.includes(`${i}-${s}`)).length);
  const next = route.phases.findIndex((p, i) => done[i] < p.steps.length);
  return { quest, route, done, next };
}
const points = () => state.xp;

function wizardPage() {
  const back = button("Zurück", () => {
    if (wizard.step === 0) wizard = null; else wizard.step--;
    render(true);
  }, "quiet");
  const a = wizard.answers;
  if (wizard.step === 0) {
    const name = el("input", { maxLength: 80, value: wizard.title, placeholder: "z. B. Führerschein machen" });
    const types = select(Object.fromEntries(Object.entries(QUESTS).map(([k, v]) => [k, v.name])), wizard.type || "own");
    name.addEventListener("input", () => {
      wizard.title = name.value;
      if (!wizard.picked) types.value = wizard.type =
        Object.keys(QUESTS).find(k => QUESTS[k].match?.test(name.value)) || "own";
    });
    types.addEventListener("change", () => { wizard.type = types.value; wizard.picked = true; });
    const warn = el("p", { className: "sub", role: "status" });
    return [back, ...title("Neue Quest", "Was willst du erreichen?"),
      card("", field("Mein Ziel", name), field("Welche Art passt am besten?", types)), warn,
      button("Weiter", () => {
        if (!name.value.trim()) { warn.textContent = "Schreib dein Ziel auf."; return; }
        if (BODY_GOAL.test(name.value)) {
          warn.textContent = "Für Ziele rund um Gewicht und Ernährung macht diese App keinen Plan. Sprich dafür mit einer Ärztin, einem Arzt oder einer Person, der du vertraust.";
          return;
        }
        wizard.title = name.value.trim(); wizard.type = types.value; wizard.step = 1; render(true);
      })];
  }
  const kind = QUESTS[wizard.type], question = kind.questions[wizard.step - 1];
  if (question) {
    let control;
    const warn = el("p", { className: "sub", role: "status" });
    if (question.type === "choice") {
      if (!(question.id in a)) a[question.id] = Object.keys(question.options)[0];
      control = el("div", {}, ...Object.entries(question.options).map(([value, text]) => {
        const b = button(text, () => { a[question.id] = value; render(); }, "btn alt pick");
        b.setAttribute("aria-pressed", String(a[question.id]) === value);
        return b;
      }));
    } else {
      control = question.type === "lines" ? el("textarea", { rows: 6, value: a[question.id] || "" })
        : el("input", { type: question.type, value: a[question.id] ?? question.value ?? "",
          min: question.type === "date" ? dayKey() : question.min ?? 0, max: question.max ?? "", step: "any" });
      control.ariaLabel = question.label;
    }
    return [back, ...title(question.label, `Frage ${wizard.step} von ${kind.questions.length}`),
      el("div", { className: "dots" }, ...kind.questions.map((_, i) => el("i", { className: i < wizard.step ? "on" : "" }))),
      card("", control), warn,
      button("Weiter", () => {
        if (question.type !== "choice") {
          const value = control.value.trim();
          if (question.type === "number") {
            const n = parseFloat(value.replace(",", "."));
            if (!Number.isFinite(n) || n < (question.min ?? 0) || n > (question.max ?? 1e9)) {
              warn.textContent = question.max ? `Bitte eine Zahl von ${question.min ?? 0} bis ${question.max} eingeben.` : `Bitte eine Zahl ab ${question.min ?? 0} eingeben.`; return;
            }
          }
          if (question.type === "lines" && BODY_GOAL.test(value)) { warn.textContent = "Schritte zu Gewicht oder Ernährung plant diese App nicht."; return; }
          a[question.id] = value;
        }
        if (wizard.step === kind.questions.length) {
          const problem = kind.check?.(a);
          if (problem) { warn.textContent = problem; return; }
        }
        wizard.step++; render(true);
      })];
  }
  return [back, ...title("Wähle deinen Weg", wizard.title),
    ...kind.routes(a).map(route => {
      const e = estimate(route, a), possible = Number.isFinite(e.likely);
      return card("", el("h2", { textContent: route.name }), el("p", { textContent: route.text }),
        el("p", { className: "duration", textContent: possible ? `ungefähr ${span(e.likely)}` : span(e.likely) }),
        possible && small(`gut gelaufen ${span(e.low)} · zäh ${span(e.high)}`),
        route.cost !== undefined && small(`Kosten: etwa ${Math.round(route.cost).toLocaleString("de-DE")} €`),
        ...reality(route, a).map(text => el("p", { className: "note", textContent: text })),
        possible && button("Diesen Weg gehen", () => {
          state.quest = { type: wizard.type, title: wizard.title, answers: { ...a }, route: route.id, done: [], created: dayKey() };
          wizard = null; openNode = null; save(); chime(); render(true);
        }));
    }),
    el("p", { className: "sub", textContent: "Die Zeiten sind grobe Schätzungen aus deinen Angaben und festen Richtwerten, keine Garantie." })];
}

function questMap() {
  const now = currentQuest(), level = Math.floor(points() / 100) + 1;
  const bar = el("i"); bar.style.width = points() % 100 + "%";
  const head = card("green", el("div", { className: "hud" }, el("strong", { textContent: `Level ${level}` }), el("span", { textContent: `★ ${points()} Punkte` })),
    el("div", { className: "bar" }, bar));
  if (!now) return [head, card("big", small("Deine Quest"), el("strong", { textContent: "Welches Ziel nimmst du dir vor?" }),
    button("Ziel eingeben", () => { wizard = { step: 0, title: "", type: "", answers: {} }; render(true); }))];
  const { quest, route, done, next } = now, e = estimate(route, quest.answers);
  const total = route.phases.reduce((n, p) => n + p.steps.length, 0), got = done.reduce((a, b) => a + b, 0);
  const end = new Date(fromKey(quest.created).getTime() + e.likely * 6048e5)
    .toLocaleDateString("de-DE", { month: "long", year: "numeric" });
  const progress = el("i"); progress.style.width = got / total * 100 + "%";
  const info = card("", small("Deine Quest"), el("h2", { textContent: quest.title }), small(route.name),
    el("div", { className: "bar" }, progress), small(`${got} von ${total} Schritten`),
    el("p", { className: "duration", textContent: next < 0 ? "Ziel erreicht!" : `Geschätzt: ${span(e.likely)}, etwa bis ${end}` }),
    next >= 0 && small(`Spanne: ${span(e.low)} bis ${span(e.high)} ab Start`),
    ...reality(route, quest.answers).map(text => el("p", { className: "note", textContent: text })));
  if (openNode === null || openNode >= route.phases.length) openNode = Math.max(0, next);
  // Geschätzter Zeitanteil je Station
  const map = el("ol", { className: "map" });
  route.phases.forEach((p, i) => {
    const finished = done[i] === p.steps.length;
    const node = button(finished ? "✓" : String(i + 1), () => { openNode = i; render(); }, "node");
    node.setAttribute("aria-label", `Station ${i + 1}: ${p.title}`);
    node.setAttribute("aria-expanded", i === openNode);
    const li = el("li", { className: [i % 2 ? "right" : "", finished ? "done" : "", i === next ? "here" : ""].join(" ") },
      node, el("div", {}, el("b", { textContent: p.title }),
        small(`${i === next ? "Du bist hier · " : ""}ca. ${span(Math.max(1, Math.round(e.likely * p.share)))}`)));
    map.append(li);
    if (i !== openNode) return;
    map.append(el("li", { className: "open" }, card("lav", el("h3", { textContent: `Station ${i + 1}: ${p.title}` }),
      ...p.steps.map((text, s) => {
        const id = `${i}-${s}`, isDone = quest.done.includes(id);
        const check = button(isDone ? "✓" : "", () => toggleStep(id, i, p), "check");
        check.ariaLabel = isDone ? `${text} wieder offen` : `${text} erledigt`;
        const planned = state.tasks.some(t => t.title === text && !t.done.length);
        return el("div", { className: "item" + (isDone ? " done" : "") }, check, el("span", { className: "title" }, text,
          !isDone && button(planned ? "Steht im Plan" : "In meinen Plan", () => {
            if (planned) return;
            state.tasks.push({ id: newId(), title: text, time: "", repeat: "once", date: dayKey(), guide: "", done: [], skip: [] });
            save(); render();
          }, "quiet skip")));
      }))));
  });
  map.append(el("li", { className: "goal" + (next < 0 ? " done" : "") }, el("span", { className: "node", textContent: "🏆" }),
    el("div", {}, el("b", { textContent: quest.title }), small("Dein Ziel"))));
  return [head, info, map,
    quest.type === "save" && button("Als Sparziel im Geld-Bereich anlegen",
      () => host.addGoal(quest.title, quest.answers.price, quest.answers.have), "btn alt"),
    button("Anderen Weg oder neues Ziel", () => {
      if (!confirm("Neu planen? Die abgehakten Schritte dieser Quest werden zurückgesetzt. Punkte bleiben.")) return;
      wizard = { step: 0, title: quest.title, type: quest.type, picked: true, answers: { ...quest.answers } }; render(true);
    }, "btn alt")];
}
function toggleStep(id, index, p) {
  const quest = state.quest, had = quest.done.includes(id);
  if (had) quest.done = quest.done.filter(x => x !== id); else quest.done.push(id);
  // Punkte je Schritt nur einmal, auch nach erneutem Abhaken oder Neuplanen.
  const award = (key, value) => { if (!state.awarded.includes(key)) { state.awarded.push(key); state.xp += value; } };
  if (!had) {
    award(`${quest.created}-${quest.type}-${id}`, 10);
    const complete = p.steps.every((_, s) => quest.done.includes(`${index}-${s}`));
    if (complete) { award(`${quest.created}-${quest.type}-node${index}`, 20); openNode = null; state.cheer = `Station „${p.title}“ geschafft!`; }
    chime(); burst(26, "Super!");
  }
  save(); render();
}
// Prüft gespeicherte oder geladene Quests.
function cleanQuest(data) {
  if (!Object.hasOwn(QUESTS, data?.type) || typeof data.answers !== "object" || !data.answers) return null;
  const answers = {};
  for (const question of QUESTS[data.type].questions)
    if (question.id in data.answers) answers[question.id] = String(data.answers[question.id]).slice(0, 700);
  if (!QUESTS[data.type].routes(answers).some(r => r.id === data.route)) return null;
  return { type: data.type, title: String(data.title || "Mein Ziel").slice(0, 80), answers, route: String(data.route),
    done: (Array.isArray(data.done) ? data.done : []).filter(x => /^\d-\d$/.test(x)),
    created: /^\d{4}-\d\d-\d\d$/.test(data.created) ? data.created : new Date().toISOString().slice(0, 10) };
}

// ================= Sportplan =================
// Stellt aus Körperdaten, Erfahrung, Ziel, Zeit, Ort, Geräten und Beschwerden einen Wochenplan zusammen.
// Mengen sind Richtwerte (Annahmen). Es gibt bewusst keine Abnehm- oder Diätziele.
const SPORT_OPTIONS = {
  age: { kid: "13–15", teen: "16–17", adult: "18–39", mid: "40–59", senior: "60 oder älter" },
  level: { 1: "Ich fange gerade an", 2: "Ich bewege mich ab und zu", 3: "Ich trainiere regelmäßig" },
  goal: { move: "Mich mehr bewegen", endurance: "Mehr Ausdauer", strength: "Kraft und Muskeln aufbauen",
    flex: "Beweglicher werden", all: "Rundum fit" },
  minutes: { 10: "10 Minuten", 20: "20 Minuten", 30: "30 Minuten", 45: "45 Minuten", 60: "60 Minuten" },
  place: { home: "Zu Hause", out: "Draußen", gym: "Im Fitnessstudio" },
};
const SEXES = { f: "Weiblich", m: "Männlich", x: "Keine Angabe" };
const EQUIPMENT = { dumbbell: "Kurzhanteln", band: "Widerstandsband", bar: "Klimmzugstange", kettlebell: "Kettlebell",
  bench: "Bank oder Stufe", rope: "Springseil", bike: "Heimtrainer (Ergometer)" };
const SPORT_LIMITS = { knee: "Knie", back: "Rücken", shoulder: "Schulter oder Handgelenk", quiet: "Keine Sprünge, leise" };
const SPORT_DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const SPORT_TYPES = { kraft: ["Kraft", "💪"], ausdauer: ["Ausdauer", "🏃"], beweg: ["Beweglichkeit", "🧘"], mix: ["Mix", "⚡"] };
const SPORT_PATTERN = { move: ["mix", "ausdauer", "beweg"], endurance: ["ausdauer", "kraft", "ausdauer", "beweg"],
  strength: ["kraft", "ausdauer", "kraft", "beweg"], flex: ["beweg", "mix", "beweg", "ausdauer"],
  all: ["kraft", "ausdauer", "beweg", "mix"] };

// [Name, So geht's, Bereich, Einheit, Menge, Bewegungsbild, Orte, nicht bei, ab Erfahrung, Gerät]
const ex = (name, how, area, unit, amount, pose, places = "home out gym", avoid = "", min = 1, need = "") =>
  ({ name, how, area, unit, amount, pose, places: places.split(" "), avoid: avoid.split(" "), min, need });
const gear = (need, name, how, area, unit, amount, pose, avoid = "", min = 1) =>
  ex(name, how, area, unit, amount, pose, "home gym", avoid, min, need);
const EXERCISES = [
  ex("Auf der Stelle marschieren", "Knie locker heben, Arme gegengleich mitschwingen.", "warm", "sec", 60, "walk"),
  ex("Schultern und Arme kreisen", "Erst klein, dann groß, vorwärts und rückwärts.", "warm", "sec", 40, "arms", "home out gym", "shoulder"),
  ex("Hüfte kreisen", "Hände an die Hüfte, große ruhige Kreise in beide Richtungen.", "warm", "sec", 40, "stretch"),
  ex("Seitschritte", "Zügig nach links und rechts treten, Knie leicht gebeugt.", "warm", "sec", 45, "walk"),
  ex("Hampelmann", "Locker springen, auf den Fußballen weich landen.", "warm", "sec", 30, "jump", "home out gym", "knee quiet shoulder back"),

  ex("Kniebeugen zum Stuhl", "Po nach hinten schieben, kurz den Stuhl berühren, aufstehen.", "legs", "reps", 10, "squat", "home", "knee"),
  ex("Kniebeugen", "Füße schulterbreit, Brust aufrecht, so tief wie angenehm.", "legs", "reps", 12, "squat", "home out gym", "knee", 2),
  ex("Ausfallschritte rückwärts", "Großer Schritt zurück, beide Knie beugen, hochdrücken, Seite wechseln.", "legs", "reps", 8, "lunge", "home out gym", "knee", 2),
  ex("Beckenheben", "Rückenlage, Füße aufstellen, Po anheben, oben kurz halten.", "legs", "reps", 12, "bridge"),
  ex("Wadenheben", "Langsam auf die Zehenspitzen und zurück. Halt dich fest, wenn nötig.", "legs", "reps", 15, "calf"),
  ex("Beinpresse", "Leichtes Gewicht, Knie nicht ganz durchstrecken.", "legs", "reps", 12, "squat", "gym", "knee"),
  ex("Seitliches Beinheben", "In Seitlage das obere Bein gestreckt langsam heben und senken.", "legs", "reps", 10, "bridge", "home gym"),
  gear("dumbbell", "Kniebeuge mit Hantel vor der Brust", "Hantel mit beiden Händen halten, tief beugen, Rücken lang.", "legs", "reps", 10, "squat", "knee", 2),
  gear("dumbbell", "Kreuzheben mit Hanteln", "Knie leicht gebeugt, Hüfte nach hinten, Rücken gerade, wieder aufrichten.", "legs", "reps", 10, "hinge", "back", 2),
  gear("kettlebell", "Kreuzheben mit Kettlebell", "Kugel zwischen den Füßen, Rücken gerade, aus Beinen und Hüfte heben.", "legs", "reps", 10, "hinge", "back"),
  gear("kettlebell", "Kettlebell-Schwung", "Schwung kommt aus der Hüfte, Arme führen nur. Erst mit leichtem Gewicht.", "legs", "reps", 12, "hinge", "back shoulder quiet", 3),
  gear("band", "Seitschritte mit Band", "Band um die Beine, leicht in die Hocke, kleine Schritte zur Seite.", "legs", "reps", 12, "squat", "knee"),
  gear("bench", "Aufsteigen auf eine Stufe", "Ganzen Fuß aufsetzen, hochdrücken, kontrolliert zurück, Seite wechseln.", "legs", "reps", 10, "lunge", "knee"),

  ex("Wand-Liegestütze", "Hände an die Wand, Körper gerade wie ein Brett, Arme beugen.", "push", "reps", 10, "push", "home", "shoulder"),
  ex("Liegestütze an Bank oder Tisch", "Stabile Kante greifen, Körper gerade, Brust Richtung Kante.", "push", "reps", 8, "push", "home out", "shoulder", 2),
  ex("Liegestütze", "Am Boden, Bauch fest. Bei Bedarf auf den Knien.", "push", "reps", 8, "push", "home out gym", "shoulder", 3),
  ex("Brustpresse am Gerät", "Leichtes Gewicht, ruhig drücken und langsam zurück.", "push", "reps", 12, "press", "gym", "shoulder"),
  gear("dumbbell", "Schulterdrücken mit Hanteln", "Hanteln neben den Schultern, gerade nach oben drücken, Bauch fest.", "push", "reps", 10, "press", "shoulder"),
  gear("dumbbell", "Bodendrücken mit Hanteln", "Rückenlage, Oberarme berühren den Boden, nach oben drücken.", "push", "reps", 10, "press", "shoulder"),
  gear("band", "Brustdrücken mit Band", "Band hinter dem Rücken, Arme nach vorn strecken, langsam zurück.", "push", "reps", 12, "press", "shoulder"),
  gear("bench", "Trizeps-Stütz an der Bank", "Hände an die Kante, Ellbogen nach hinten beugen. Bank darf nicht rutschen.", "push", "reps", 8, "push", "shoulder", 3),

  ex("Schulterblätter zusammenziehen", "Aufrecht stehen, Schultern nach hinten unten, 2 Sekunden halten.", "pull", "reps", 12, "pull"),
  ex("Rudern mit Flaschen", "Leicht vorgebeugt, Ellbogen eng nach hinten ziehen.", "pull", "reps", 10, "pull", "home", "back shoulder"),
  ex("Latzug am Gerät", "Stange zur Brust ziehen, langsam zurück.", "pull", "reps", 12, "pull", "gym", "shoulder"),
  ex("Rudern am Gerät", "Aufrecht sitzen, Griffe zum Bauch ziehen.", "pull", "reps", 12, "pull", "gym", "back shoulder"),
  gear("dumbbell", "Einarmiges Rudern", "Eine Hand abstützen, Hantel zur Hüfte ziehen, dann Seite wechseln.", "pull", "reps", 10, "pull", "back shoulder"),
  gear("dumbbell", "Armbeugen mit Hanteln", "Ellbogen am Körper, Hanteln heben, langsam senken.", "pull", "reps", 12, "pull", "shoulder"),
  gear("band", "Rudern mit Band", "Band um die Füße oder an der Tür sichern, Ellbogen nach hinten.", "pull", "reps", 12, "pull", "shoulder"),
  gear("band", "Band auseinanderziehen", "Arme vorn gestreckt, Band zur Seite auseinanderziehen.", "pull", "reps", 12, "arms", "shoulder"),
  gear("bar", "An der Stange hängen", "Fest greifen, Schultern aktiv, ruhig atmen. Stange vorher prüfen.", "pull", "sec", 20, "hang", "shoulder", 2),
  gear("bar", "Klimmzug mit Hilfe", "Mit Band oder Fußunterstützung hochziehen, langsam ablassen.", "pull", "reps", 5, "hang", "shoulder", 3),

  ex("Unterarmstütz", "Auf Unterarmen und Knien oder Zehen, Körper gerade, weiteratmen.", "core", "sec", 20, "plank", "home out gym", "shoulder back"),
  ex("Seitstütz auf den Knien", "Seitlich auf den Unterarm stützen, Hüfte anheben, Seite wechseln.", "core", "sec", 15, "plank", "home gym", "shoulder", 2),
  ex("Vierfüßler: Arm und Bein strecken", "Gegengleich lang ausstrecken, Hüfte ruhig halten.", "core", "reps", 8, "plank", "home gym", "shoulder"),
  ex("Toter Käfer", "Rückenlage, Arm und Gegenbein langsam senken, unterer Rücken bleibt am Boden.", "core", "reps", 8, "bug", "home gym"),
  ex("Standwaage mit Festhalten", "Auf einem Bein stehen, Oberkörper leicht vor, Seite wechseln.", "core", "sec", 20, "balance"),

  ex("Zügig gehen", "So schnell, dass Reden noch geht.", "cardio", "min", 1, "walk"),
  ex("Gehen und locker laufen", "1 Minute laufen, 2 Minuten gehen, wiederholen.", "cardio", "min", 1, "run", "out gym", "knee quiet", 1),
  ex("Locker joggen", "Langsames Tempo, bei dem Reden noch geht.", "cardio", "min", 1, "run", "out gym", "knee quiet", 3),
  ex("Radfahren", "Gleichmäßig treten, draußen mit Helm.", "cardio", "min", 1, "bike", "out gym"),
  ex("Crosstrainer", "Gleichmäßig, mit leichtem Widerstand.", "cardio", "min", 1, "run", "gym"),
  ex("Tanzen", "Lieblingslieder an und einfach bewegen.", "cardio", "min", 1, "jump", "home", "knee"),
  ex("Schattenboxen", "Locker auf den Füßen, abwechselnd nach vorn boxen, Arme nie ganz durchstrecken.", "cardio", "min", 1, "press", "home out", "shoulder"),
  ex("Treppen steigen", "Ruhig hinauf, am Geländer hinunter.", "cardio", "min", 1, "lunge", "home out", "knee", 2),
  gear("rope", "Seilspringen", "Kleine Sprünge aus den Fußgelenken, bei Bedarf Pausen.", "cardio", "min", 1, "jump", "knee quiet", 2),
  gear("bike", "Heimtrainer fahren", "Sattel auf Hüfthöhe, gleichmäßig treten.", "cardio", "min", 1, "bike"),

  ex("Katze und Kuh", "Im Vierfüßler den Rücken langsam rund und wieder lang machen.", "flex", "sec", 40, "plank", "home gym", "shoulder"),
  ex("Brust öffnen", "Hände hinter dem Rücken, Brustbein heben.", "flex", "sec", 30, "arms", "home out gym", "shoulder"),
  ex("Nacken sanft dehnen", "Ohr Richtung Schulter, ohne zu ziehen. Beide Seiten.", "flex", "sec", 30, "stretch"),
  ex("Hüftbeuger dehnen", "Schrittstellung, Becken sanft nach vorn.", "flex", "sec", 30, "lunge"),
  ex("Oberschenkel hinten", "Ferse aufstellen, mit langem Rücken leicht vorbeugen.", "flex", "sec", 30, "hinge"),
  ex("Waden dehnen", "An der Wand abstützen, hinteres Bein gestreckt, Ferse unten.", "flex", "sec", 30, "lunge"),
  ex("Seitneigen", "Arm nach oben, sanft zur Seite neigen. Beide Seiten.", "flex", "sec", 30, "stretch"),
  ex("Ruhig atmen", "4 Sekunden ein, 6 Sekunden aus.", "flex", "sec", 60, "stretch"),
];

// ---------- Bewegungsbilder: Strichfigur zwischen zwei Haltungen ----------
// Punkte: Kopf, Hals, Hüfte, Ellbogen1, Hand1, Ellbogen2, Hand2, Knie1, Fuß1, Knie2, Fuß2
const STAND = "50,16 50,26 50,52 40,38 36,50 60,38 64,50 44,70 42,90 56,70 58,90";
const POSES = {
  squat: [STAND, "46,32 48,41 58,64 60,48 74,48 62,50 76,52 38,70 42,90 48,72 58,90"],
  lunge: [STAND, "50,26 50,36 52,60 44,48 46,60 60,48 62,60 34,70 32,90 66,80 82,88"],
  calf: [STAND, "50,10 50,20 50,46 40,32 36,44 60,32 64,44 45,66 44,84 55,66 56,84"],
  hinge: [STAND, "26,40 34,44 60,52 38,58 40,72 44,58 46,72 56,72 54,90 66,72 66,90"],
  bridge: ["14,80 24,80 52,82 30,86 42,88 30,86 42,88 66,64 76,88 68,66 80,88",
    "14,82 24,80 52,62 30,86 42,88 30,86 42,88 68,58 76,88 70,60 80,88"],
  push: ["24,44 33,50 56,66 36,66 36,86 40,68 42,86 70,76 84,86 72,76 86,88",
    "24,62 33,67 56,76 24,74 36,86 30,76 42,86 70,81 84,86 72,82 86,88"],
  plank: ["22,58 32,62 58,68 30,82 44,84 34,82 48,84 72,75 86,84 74,76 88,86",
    "22,55 32,59 58,63 30,82 44,84 34,82 48,84 72,72 86,84 74,73 88,86"],
  press: ["50,16 50,26 50,52 34,34 36,22 66,34 64,22 44,70 42,90 56,70 58,90",
    "50,16 50,26 50,52 40,14 40,2 60,14 60,2 44,70 42,90 56,70 58,90"],
  pull: ["44,22 46,32 54,56 56,44 70,52 60,46 74,54 46,72 46,90 60,72 62,90",
    "44,22 46,32 54,56 62,38 50,46 66,40 54,48 46,72 46,90 60,72 62,90"],
  arms: ["50,16 50,26 50,52 38,28 26,28 62,28 74,28 44,70 42,90 56,70 58,90",
    "50,16 50,26 50,52 36,18 30,6 64,18 70,6 44,70 42,90 56,70 58,90"],
  hang: ["50,38 50,46 50,70 38,28 40,8 62,28 60,8 46,82 44,94 54,82 56,94",
    "50,18 50,28 50,54 32,32 40,8 68,32 60,8 44,68 48,80 56,68 52,80"],
  bug: ["16,76 26,78 54,80 30,60 32,44 34,62 38,46 62,58 78,60 66,60 82,62",
    "16,76 26,78 54,80 14,66 4,62 34,62 38,46 62,58 78,60 76,72 92,76"],
  balance: [STAND, "24,34 33,38 56,50 24,50 18,60 40,54 42,68 56,70 54,90 74,48 90,44"],
  walk: ["50,16 50,26 50,52 42,38 44,52 60,38 66,46 40,68 30,86 60,70 62,90",
    "50,16 50,26 50,52 40,38 34,46 58,38 56,52 40,70 38,90 60,68 70,86"],
  run: ["54,14 52,24 46,50 40,34 52,40 64,36 70,24 30,60 18,72 66,60 66,82",
    "54,16 52,26 46,52 62,38 72,28 40,36 30,46 62,62 76,70 46,72 28,80"],
  jump: [STAND, "50,10 50,20 50,46 34,18 28,4 66,18 72,4 36,64 28,82 64,64 72,82"],
  bike: ["40,24 44,34 56,58 52,48 70,46 54,50 72,48 68,60 60,76 46,70 56,88",
    "40,24 44,34 56,58 52,48 70,46 54,50 72,48 50,70 56,88 68,62 62,76"],
  stretch: ["46,18 49,27 50,52 38,34 34,48 58,16 46,6 44,70 42,90 56,70 58,90",
    "54,18 51,27 50,52 42,16 54,6 62,34 66,48 44,70 42,90 56,70 58,90"],
};
function figure(pose, still) {
  const frames = (POSES[pose] || POSES.walk).map(text => text.split(" ").map(p => p.split(",").map(Number)));
  const body = ([, neck, hip, e1, h1, e2, h2, k1, f1, k2, f2]) =>
    `M${neck}L${hip}M${neck}L${e1}L${h1}M${neck}L${e2}L${h2}M${hip}L${k1}L${f1}M${hip}L${k2}L${f2}`;
  const move = (attribute, values) => still ? "" :
    `<animate attributeName="${attribute}" values="${values.join(";")};${values[0]}" dur="2.4s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".4 0 .6 1;.4 0 .6 1"/>`;
  const box = el("div", { className: "figure" });
  box.innerHTML = `<svg viewBox="-4 -6 108 108" role="img" aria-label="Bewegungsbild"><line class="floor" x1="2" y1="96" x2="98" y2="96"/>
    <path d="${body(frames[0])}">${move("d", frames.map(body))}</path>
    <circle cx="${frames[0][0][0]}" cy="${frames[0][0][1]}" r="8">${move("cx", frames.map(f => f[0][0]))}${move("cy", frames.map(f => f[0][1]))}</circle></svg>`;   // feste Zeichnungen
  return box;
}
const TIPS = { squat: "Knie zeigen in Richtung der Zehen, Fersen bleiben am Boden.", lunge: "Oberkörper aufrecht, vorderes Knie bleibt stabil.",
  hinge: "Der Rücken bleibt gerade. Wird er rund, nimm weniger Gewicht.", push: "Hüfte nicht durchhängen lassen.",
  plank: "Nicht ins Hohlkreuz fallen und weiteratmen.", press: "Nicht ins Hohlkreuz lehnen, beim Drücken ausatmen.",
  pull: "Schultern nicht zu den Ohren ziehen.", hang: "Nicht ruckartig, immer kontrolliert ablassen.",
  bridge: "Aus dem Po drücken, nicht aus dem unteren Rücken.", bug: "Langsam bewegen, der Rücken bleibt unten.",
  stretch: "Nur dehnen, bis es zieht, nie bis es schmerzt." };

const ageGroup = years => years < 16 ? "kid" : years < 18 ? "teen" : years < 40 ? "adult" : years < 60 ? "mid" : "senior";
const within = (value, min, max) => { const n = Number(String(value ?? "").replace(",", ".")); return n >= min && n <= max ? n : 0; };

function cleanSport(data) {
  const p = data?.profile;
  const pick = (key, value) => Object.hasOwn(SPORT_OPTIONS[key], value) ? String(value) : "";
  const many = (map, list) => [...new Set((Array.isArray(list) ? list : []).filter(x => Object.hasOwn(map, x)))];
  let profile = null;
  if (p) {
    const years = Math.round(within(p.ageYears, 13, 100));
    profile = { age: years ? ageGroup(years) : pick("age", p.age), ageYears: years, weight: within(p.weight, 30, 250),
      height: within(p.height, 120, 230), sex: Object.hasOwn(SEXES, p.sex) ? p.sex : "x", level: pick("level", p.level),
      goal: pick("goal", p.goal), minutes: pick("minutes", p.minutes), place: pick("place", p.place),
      days: [...new Set((Array.isArray(p.days) ? p.days : []).filter(d => Number.isInteger(d) && d >= 0 && d < 7))].sort(),
      equipment: many(EQUIPMENT, p.equipment), limits: many(SPORT_LIMITS, p.limits),
      time: /^([01]\d|2[0-3]):[0-5]\d$/.test(p.time) ? p.time : "17:00" };
    if (!profile.age || !profile.level || !profile.goal || !profile.minutes || !profile.place || !profile.days.length) profile = null;
  }
  return { profile, adjust: Math.max(-3, Math.min(5, Math.round(Number(data?.adjust) || 0))),
    good: Math.max(0, Math.min(3, Math.round(Number(data?.good) || 0))),
    log: (Array.isArray(data?.log) ? data.log : []).filter(x => /^\d{4}-\d\d-\d\d$/.test(x?.day)
      && Object.hasOwn(SPORT_TYPES, x?.type)).slice(-200).map(x => ({ day: x.day, type: x.type })),
    mood: { day: String(data?.mood?.day || ""), value: ["fit", "tired", "sick"].includes(data?.mood?.value) ? data.mood.value : "" } };
}

const weekIndex = (date = new Date()) => (date.getDay() + 6) % 7;   // Montag = 0
// Gleiche Auswahl innerhalb einer Woche, nächste Woche Abwechslung.
const weekNumber = (date = new Date()) => Math.floor((date.getTime() / 864e5 + 3) / 7);

function weekPlan(profile) {
  const pattern = SPORT_PATTERN[profile.goal];
  let before = null;
  return profile.days.map((day, i) => {
    let type = pattern[i % pattern.length];
    // Kraft nicht an zwei Tagen hintereinander.
    if (type === "kraft" && before?.type === "kraft" && day - before.day === 1) type = "beweg";
    before = { day, type };
    return before;
  });
}

function session(profile, type, slot, adjust, tired, date = new Date()) {
  const level = Number(profile.level), young = profile.age === "kid", older = profile.age === "senior";
  const minutes = tired ? Math.max(10, Math.round(Number(profile.minutes) * .6)) : Number(profile.minutes);
  const limits = [...profile.limits, ...(older ? ["quiet"] : [])];
  // Unter 16 im Studio: nur Übungen mit dem eigenen Körpergewicht.
  const place = profile.place === "gym" && young ? "home" : profile.place;
  const owned = (profile.equipment || []).filter(k => !(young && (k === "dumbbell" || k === "kettlebell")));
  const fits = area => EXERCISES.filter(e => e.area === area && e.min <= level
    && (e.places.includes(place) || (profile.place === "gym" && e.places.includes("gym") && !young))
    && (!e.need || (profile.place === "home" && owned.includes(e.need)))
    && !e.avoid.some(a => limits.includes(a)));
  // Übungen mit deinen Geräten kommen zuerst, jede Gruppe wechselt wöchentlich durch.
  const take = (area, count, offset = 0) => {
    const turn = list => list.map((_, i) => list[(weekNumber(date) + slot + offset + i) % list.length]);
    const all = fits(area);
    return [...turn(all.filter(e => e.need)), ...turn(all.filter(e => !e.need))].slice(0, count);
  };
  const factor = (1 + adjust * .1) * ({ 1: .85, 2: 1, 3: 1.15 }[level]) * (tired ? .75 : 1) * (older ? .85 : 1);
  const warm = take("warm", minutes <= 10 ? 1 : 2).map(e => ({ ...e, part: "Aufwärmen", sets: 1, value: e.amount }));
  const cool = take("flex", minutes <= 10 ? 1 : minutes >= 45 ? 3 : 2, 3).map(e => ({ ...e, part: "Ausklang", sets: 1, value: e.amount }));
  const main = [];
  // Keine Übung doppelt: gibt es für einen Bereich keine weitere, entfällt der Platz.
  const strength = (areas, sets) => areas.forEach((area, i) => {
    const list = take(area, 99, i);
    const e = list.find(x => !main.some(m => m.name === x.name));
    if (e) main.push({ ...e, part: "Hauptteil", sets, value: Math.max(e.unit === "sec" ? 10 : 4, Math.round(e.amount * factor)) });
  });
  const cardio = time => take("cardio", 1).forEach(e => main.push(
    { ...e, part: "Hauptteil", sets: 1, value: Math.max(4, Math.round(time * Math.min(1.2, factor))) }));
  const mainTime = Math.max(5, minutes - (minutes <= 10 ? 3 : 7));
  const sets = tired || level === 1 || minutes <= 10 ? (minutes >= 30 ? 2 : 1) : minutes >= 30 ? 3 : 2;
  if (type === "kraft") strength(minutes <= 10 ? ["legs", "push", "core"] : minutes <= 20 ? ["legs", "push", "pull", "core"]
    : minutes <= 30 ? ["legs", "push", "pull", "core", "legs"] : ["legs", "push", "pull", "core", "legs", "push", "pull"], sets);
  else if (type === "ausdauer") cardio(mainTime);
  else if (type === "beweg") take("flex", Math.min(7, Math.max(3, Math.round(mainTime / 3))))
    .forEach(e => main.push({ ...e, part: "Hauptteil", sets: minutes >= 30 ? 2 : 1, value: e.amount }));
  else { strength(minutes >= 45 ? ["legs", "push", "pull", "core"] : ["legs", "core"], minutes >= 30 ? 2 : 1); cardio(mainTime * .6); }
  if (older && type !== "beweg") main.push(...EXERCISES.filter(e => e.name.startsWith("Standwaage"))
    .filter(e => !main.some(m => m.name === e.name)).map(e => ({ ...e, part: "Gleichgewicht", sets: 1, value: e.amount })));
  const used = new Set(main.map(e => e.name));
  return { type, minutes, exercises: [...warm, ...main, ...cool.filter(e => !used.has(e.name))] };
}
const amountText = e => (e.sets > 1 ? `${e.sets} × ` : "")
  + (e.unit === "reps" ? `${e.value} Wiederholungen` : e.unit === "sec" ? `${e.value} Sekunden` : `${e.value} Minuten`);

// ---------- Oberfläche ----------
let sportForm = null, sportRun = null;

function sportQuestions() {
  const f = sportForm, parts = [], d = f.data;
  const steps = [["body", "Erzähl mir von dir"], ["level", "Wie aktiv bist du gerade?"], ["goal", "Was ist dein Ziel beim Trainieren?"],
    ["days", "Wie oft und an welchen Tagen?"], ["minutes", "Wie lange pro Training?"], ["place", "Wo trainierst du?"],
    ...(d.place === "home" ? [["equipment", "Welche Geräte hast du zu Hause?"]] : []),
    ["limits", "Worauf soll der Plan Rücksicht nehmen?"], ["health", "Kurzer Gesundheits-Check"]];
  const [key, question] = steps[f.step];
  const warn = el("p", { className: "sub", role: "status" });
  parts.push(button("Zurück", () => { if (f.step === 0) sportForm = null; else f.step--; render(true); }, "quiet"),
    ...title(question, `Frage ${f.step + 1} von ${steps.length}`),
    el("div", { className: "dots" }, ...steps.map((_, i) => el("i", { className: i <= f.step ? "on" : "" }))));
  const choose = (text, selected, run) => {
    const b = button((selected ? "✓ " : "") + text, run, "btn alt pick"); b.setAttribute("aria-pressed", selected); return b;
  };
  const number = (name, id, min, max) => {
    const input = el("input", { type: "number", inputMode: "decimal", min, max, step: "any", value: d[id] || "" });
    input.addEventListener("input", () => { d[id] = input.value; });
    return field(name, input);
  };
  const flip = (list, value) => () => { d[list] = d[list].includes(value) ? d[list].filter(x => x !== value) : [...d[list], value]; render(); };
  let controls;
  if (key === "body") {
    const sex = select(SEXES, d.sex || "x");
    sex.addEventListener("change", () => { d.sex = sex.value; });
    controls = [number("Wie alt bist du? (Jahre)", "ageYears", 13, 100), number("Wie groß bist du? (cm)", "height", 120, 230),
      number("Wie viel wiegst du? (kg)", "weight", 30, 250), field("Geschlecht (nur für den Kalorien-Richtwert)", sex),
      small("Die Angaben bleiben auf deinem Gerät.")];
  } else if (key === "days") controls = [el("div", { className: "days" }, ...SPORT_DAYS.map((name, i) => {
    const b = button(name, () => { d.days = d.days.includes(i) ? d.days.filter(x => x !== i) : [...d.days, i]; render(); }, "");
    b.setAttribute("aria-pressed", d.days.includes(i)); return b;
  })), small(`${d.days.length}× pro Woche gewählt. Mindestens ein Tag bleibt frei.`)];
  else if (key === "equipment") controls = [...Object.entries(EQUIPMENT).map(([value, text]) =>
    choose(text, d.equipment.includes(value), flip("equipment", value))), small("Mehrere möglich. Ohne Geräte planst du mit dem eigenen Körper.")];
  else if (key === "limits") controls = [...Object.entries(SPORT_LIMITS).map(([value, text]) =>
    choose(text, d.limits.includes(value), flip("limits", value))), small("Mehrere möglich. Trifft nichts zu, tippe einfach auf „Weiter“.")];
  else if (key === "health") controls = [el("p", { textContent: "Trifft etwas davon zu: Herzprobleme, Schmerzen in der Brust, Schwindel oder Ohnmacht bei Anstrengung, eine frische Verletzung oder Operation, Schwangerschaft, oder jemand Ärztliches hat dir vom Sport abgeraten?" }),
    choose("Nein, nichts davon", f.health === "no", () => { f.health = "no"; render(); }),
    choose("Ja, aber ich habe ärztlich das Okay", f.health === "ok", () => { f.health = "ok"; render(); }),
    choose("Ja, und noch nicht abgeklärt", f.health === "yes", () => { f.health = "yes"; render(); })];
  else controls = Object.entries(SPORT_OPTIONS[key]).map(([value, text]) =>
    choose(text, d[key] === value, () => { d[key] = value; render(); }));
  parts.push(card("", ...controls), warn, button(key === "health" ? "Plan erstellen" : "Weiter", () => {
    if (key === "body") {
      if (!within(d.ageYears, 13, 100)) { warn.textContent = "Bitte gib ein Alter ab 13 Jahren ein. Für Jüngere plant die App nicht."; return; }
      if (!within(d.height, 120, 230)) { warn.textContent = "Bitte gib deine Größe in cm ein (120 bis 230)."; return; }
      if (!within(d.weight, 30, 250)) { warn.textContent = "Bitte gib dein Gewicht in kg ein (30 bis 250)."; return; }
    } else if (key === "days") {
      if (!d.days.length) { warn.textContent = "Wähle mindestens einen Tag."; return; }
      if (d.days.length > 6) { warn.textContent = "Lass mindestens einen Tag frei."; return; }
    } else if (key === "health") {
      if (!f.health) { warn.textContent = "Bitte wähle eine Antwort."; return; }
      if (f.health === "yes") { warn.textContent = "Kläre das bitte zuerst ärztlich ab. Danach stellt dir die App gern einen Plan zusammen."; return; }
      state.sport = cleanSport({ ...state.sport, profile: d, adjust: 0, good: 0 });
      sportForm = null; save(); chime(); burst(); render(true); return;
    } else if (key !== "limits" && key !== "equipment" && !d[key]) { warn.textContent = "Bitte wähle eine Antwort."; return; }
    f.step++; render(true);
  }));
  return parts;
}
function openSportForm() {
  const p = state.sport.profile;
  sportForm = { step: 0, health: "", data: p ? { ...p, days: [...p.days], limits: [...p.limits], equipment: [...p.equipment] }
    : { ageYears: "", height: "", weight: "", sex: "x", level: "", goal: "", minutes: "", place: "", days: [0, 2, 4],
      equipment: [], limits: [] } };
  render(true);
}

function todaySession() {
  const { profile, adjust, mood } = state.sport;
  if (!profile) return null;
  const slot = weekPlan(profile).findIndex(d => d.day === weekIndex());
  if (slot < 0) return null;
  const tired = mood.day === dayKey() && mood.value === "tired";
  return { ...session(profile, weekPlan(profile)[slot].type, slot, adjust, tired), done: state.sport.log.some(x => x.day === dayKey()) };
}

// Alle Trainingstage der nächsten 12 Wochen als Datei für den Handy-Kalender.
function workoutCalendar() {
  const { profile, adjust } = state.sport;
  const text = value => String(value).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
  const stamp = date => date.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Life Control//DE"];
  const [hour, minute] = profile.time.split(":").map(Number), plan = weekPlan(profile);
  for (let i = 0; i < 84; i++) {
    const start = new Date(); start.setDate(start.getDate() + i); start.setHours(hour, minute, 0, 0);
    const slot = plan.findIndex(d => d.day === weekIndex(start));
    if (slot < 0 || start < new Date()) continue;
    const s = session(profile, plan[slot].type, slot, adjust, false, start);
    lines.push("BEGIN:VEVENT", `UID:${dayKey(start)}-training@lifecontrol`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(new Date(start.getTime() + s.minutes * 60000))}`, `SUMMARY:${text(`Training: ${SPORT_TYPES[s.type][0]}`)}`,
      `DESCRIPTION:${text(s.exercises.map(e => `${e.name}: ${amountText(e)}`).join("\n"))}`, "END:VEVENT");
  }
  return [...lines, "END:VCALENDAR", ""].join("\r\n");
}
function exportWorkouts() {
  const url = URL.createObjectURL(new Blob([workoutCalendar()], { type: "text/calendar;charset=utf-8" }));
  el("a", { href: url, download: "life-control-training.ics" }).click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function sportPlayer() {
  const r = sportRun, e = r.list[r.i];
  const stop = button("Abbrechen", () => { sportRun = null; render(true); }, "quiet");
  if (!e) {
    const rate = (value, text) => button(text, () => {
      const s = state.sport;
      if (value === "easy") { s.adjust = Math.min(5, s.adjust + 1); s.good = 0; }
      if (value === "hard") { s.adjust = Math.max(-3, s.adjust - 1); s.good = 0; }
      if (value === "pain") { s.adjust = Math.max(-3, s.adjust - 2); s.good = 0; }
      if (value === "good" && ++s.good >= 3) { s.adjust = Math.min(5, s.adjust + 1); s.good = 0; }
      if (!s.log.some(x => x.day === dayKey())) s.log.push({ day: dayKey(), type: r.type });
      const message = value === "pain" ? "Gut, dass du es sagst. Der Plan wird leichter. Halten die Schmerzen an, lass sie ärztlich ansehen. Unter „Plan anpassen“ kannst du die Stelle schonen."
        : value === "hard" ? "Verstanden. Das nächste Training wird etwas leichter."
          : value === "easy" ? "Stark! Das nächste Training wird etwas anspruchsvoller." : "Genau richtig. So geht es weiter.";
      sportRun = null; gain(`sport-${dayKey()}`, 25); state.sport.note = message; save(); chime(); burst(); render(true);
    });
    return [stop, ...title("Geschafft! 🎉", "Wie war es? Danach richtet sich dein Plan."),
      card("big green", rate("easy", "Zu leicht"), rate("good", "Genau richtig"), rate("hard", "Zu anstrengend"),
        rate("pain", "Etwas hat wehgetan"))];
  }
  const parts = [stop, ...title(e.name, `${e.part} · Übung ${r.i + 1} von ${r.list.length}`),
    el("div", { className: "dots" }, ...r.list.map((_, i) => el("i", { className: i <= r.i ? "on" : "" })))];
  const total = e.unit === "min" ? e.value * 60 : e.value;
  const shown = el("p", { className: "time" });
  const draw = () => {
    const left = r.end ? Math.max(0, Math.ceil((r.end - Date.now()) / 1000)) : r.left || total;
    shown.textContent = e.unit === "reps" ? `${e.value}×` : `${pad(Math.floor(left / 60))}:${pad(left % 60)}`;
    if (r.end && !left) {
      r.end = 0; r.left = 0; clearInterval(timer); control.textContent = "Zeit um ✓ Noch einmal"; chime(); burst();
    }
  };
  const control = button(r.end ? "Anhalten" : r.left ? "Weiter" : "Timer starten", () => {
    if (r.end) { r.left = Math.max(1, Math.ceil((r.end - Date.now()) / 1000)); r.end = 0; }
    else r.end = Date.now() + (r.left || total) * 1000;
    render();
  }, "btn alt");
  draw();
  if (r.end) timer = setInterval(draw, 250);
  parts.push(card("big", figure(e.pose, calmed()), shown,
    el("p", { className: "cheer", textContent: e.sets > 1 ? `Durchgang ${r.set} von ${e.sets}` : amountText(e) }),
    el("p", { textContent: e.how }), TIPS[e.pose] && el("p", { className: "note", textContent: `Achte darauf: ${TIPS[e.pose]}` }),
    e.need && small(`Gerät: ${EQUIPMENT[e.need]}`), e.unit !== "reps" && control),
    button(r.set < e.sets ? "Durchgang fertig" : "Fertig, weiter", () => {
      if (r.set < e.sets) r.set++; else { r.i++; r.set = 1; }
      r.end = 0; r.left = 0; burst(6); render(true);
    }),
    button("Übung auslassen", () => { r.i++; r.set = 1; r.end = 0; r.left = 0; render(true); }, "btn alt"),
    small("Tut etwas weh, wird dir schwindlig oder bekommst du schlecht Luft: sofort aufhören."));
  return parts;
}

// Eine Zeile je Übung, zum Aufklappen mit Bild und Anleitung.
function exerciseList(list) {
  return list.map(e => {
    const row = el("details", { className: "move-detail" }, el("summary", { className: "move" },
      el("span", { textContent: e.name }), el("em", { textContent: amountText(e) })));
    row.addEventListener("toggle", () => {
      if (row.open && row.children.length === 1) row.append(figure(e.pose, calmed()), el("p", { textContent: e.how }),
        ...(TIPS[e.pose] ? [small(`Achte darauf: ${TIPS[e.pose]}`)] : []));
    });
    return row;
  });
}

function trainingPage() {
  if (sportForm) return sportQuestions();
  if (sportRun) return sportPlayer();
  const { profile, log, mood } = state.sport;
  if (!profile) return [...title("Sportplan", "Dein Training, passend zu dir."),
    card("big lav", figure("squat", calmed()), el("strong", { textContent: "Stell dir deinen Plan zusammen" }),
      el("p", { textContent: "Ein paar Fragen zu Alter, Größe, Gewicht, Ziel, Zeit, Geräten und Beschwerden." }),
      button("Los geht's", openSportForm))];
  const plan = weekPlan(profile), today = todaySession();
  const note = state.sport.note; delete state.sport.note;
  const monday = weekStart();
  const parts = [...title("Sportplan", `${SPORT_OPTIONS.goal[profile.goal]} · ${plan.length}× ${profile.minutes} Min.`),
    note && card("sand cheer", note),
    !profile.ageYears && card("sand", el("p", { textContent: "Neu: Ergänze Alter, Größe, Gewicht und Geräte, dann passt der Plan genauer." }),
      button("Angaben ergänzen", openSportForm)),
    card("", el("h3", { textContent: "Meine Trainingswoche" }), el("div", { className: "week" }, ...SPORT_DAYS.map((name, i) => {
      const item = plan.find(d => d.day === i);
      const d = fromKey(monday); d.setDate(d.getDate() + i);
      const done = log.some(x => x.day === dayKey(d));
      return el("div", { className: (item ? "train " : "") + (done ? "done " : "") + (i === weekIndex() ? "now" : ""),
        title: item ? SPORT_TYPES[item.type][0] : "Pause" }, el("small", { textContent: name }),
        el("b", { textContent: done ? "✓" : item ? SPORT_TYPES[item.type][1] : "·" }));
    })), small(`${log.filter(x => x.day >= monday).length} von ${plan.length} Trainings diese Woche`))];
  if (mood.day === dayKey() && mood.value === "sick") parts.push(card("big sand", el("strong", { textContent: "Heute ist Pause." }),
    el("p", { textContent: "Gute Besserung. Fang erst wieder an, wenn du dich gesund fühlst." }),
    button("Mir geht es doch gut", () => { state.sport.mood = { day: "", value: "" }; save(); render(); }, "btn alt")));
  else if (!today) {
    const next = plan.find(d => d.day > weekIndex()) || plan[0];
    parts.push(card("big green", el("strong", { textContent: "Heute ist Pausentag 🌙" }),
      el("p", { textContent: `Erholung gehört dazu. Weiter geht es am ${SPORT_DAYS[next.day]} mit ${SPORT_TYPES[next.type][0]}.` })));
  } else if (today.done) parts.push(card("big green", el("strong", { textContent: "Training erledigt ✓" }),
    el("p", { textContent: "Der Rest vom Tag gehört dir." })));
  else {
    const set = value => () => { state.sport.mood = { day: dayKey(), value }; save(); render(); };
    const picked = mood.day === dayKey() ? mood.value : "";
    const moods = el("div", { className: "moods", role: "group", ariaLabel: "Wie fühlst du dich heute?" },
      ...[["fit", "😄 Fit"], ["tired", "😴 Müde"], ["sick", "🤒 Krank"]].map(([value, text]) => {
        const b = button(text, set(value), ""); b.setAttribute("aria-pressed", picked === value); return b;
      }));
    parts.push(card("big", small(`Heute · ca. ${today.minutes} Minuten${picked === "tired" ? " · leichte Fassung" : ""}`),
      el("strong", { textContent: `${SPORT_TYPES[today.type][1]} ${SPORT_TYPES[today.type][0]}` }),
      small("Wie fühlst du dich heute?"), moods, ...exerciseList(today.exercises),
      button("Training starten", () => { sportRun = { list: today.exercises, type: today.type, i: 0, set: 1, left: 0, end: 0 }; render(true); })));
  }
  parts.push(label("Dein Wochenplan"), card("days-list", ...plan.map((d, slot) => {
    const s = session(profile, d.type, slot, state.sport.adjust, false);
    return el("details", { className: "day" }, el("summary", { textContent: `${SPORT_DAYS[d.day]} · ${SPORT_TYPES[d.type][1]} ${SPORT_TYPES[d.type][0]} · ${s.minutes} Min.` }),
      ...exerciseList(s.exercises),
      !s.exercises.some(e => e.part === "Hauptteil") && small("Für deine Angaben fehlt hier eine passende Übung."));
  })));
  const time = el("input", { type: "time", value: profile.time });
  time.addEventListener("change", () => { if (time.value) { profile.time = time.value; save(); } });
  const young = profile.age === "kid" || profile.age === "teen";
  parts.push(label("Kalender"), card("", el("p", { textContent: "Deine Trainingstage stehen schon im Kalender dieser App." }),
    field("Uhrzeit fürs Training", time),
    button("Auch in den iPhone-Kalender übernehmen", exportWorkouts, "btn alt"),
    small("Erstellt eine Kalenderdatei für die nächsten 12 Wochen. Änderst du den Plan, übernimm sie neu und lösche alte Einträge.")),
    button("Plan anpassen", openSportForm, "btn alt"),
    young && profile.place === "gym" && card("sand", el("p", { textContent: profile.age === "kid"
      ? "Unter 16 plant die App nur Übungen mit dem eigenen Körpergewicht. Frag im Studio, ab wann und mit wem du trainieren darfst."
      : "Im Studio: lass dir die Geräte zeigen, nimm leichte Gewichte und mach keine Maximalversuche." })),
    card("", small(young ? "Richtwert der WHO für Jugendliche: im Schnitt etwa 60 Minuten Bewegung am Tag. Wege und Schulsport zählen mit."
      : "Richtwert der WHO für Erwachsene: 150 bis 300 Minuten mäßige Bewegung pro Woche, dazu an 2 Tagen Kraftübungen. Alltagswege zählen mit."),
      small("Der Plan ersetzt keine Beratung durch Ärztinnen, Ärzte oder Trainer.")));
  return parts;
}

// ================= Spielgefühl: Punkte, Spielerkarte, Funken =================
const calmed = () => matchMedia("(prefers-reduced-motion: reduce)").matches
  || document.documentElement.hasAttribute("data-calm");
let touchAt = null;
document.addEventListener("pointerdown", e => { touchAt = [e.clientX, e.clientY]; }, true);
const SPARKS = [100, 75, 55, 40].map(share => `color-mix(in srgb,var(--accent) ${share}%,#fff)`);

function burst(count = 18, label = "") {
  if (calmed()) return;
  const [x, y] = touchAt || [innerWidth / 2, innerHeight / 3];
  for (let i = 0; i < count; i++) {
    const spark = el("i", { className: "spark" });
    const angle = Math.random() * Math.PI * 2, far = 40 + Math.random() * 90;
    spark.style.cssText = `left:${x}px;top:${y}px;background:${SPARKS[i % 4]};--x:${Math.cos(angle) * far}px;--y:${Math.sin(angle) * far}px`;
    document.body.append(spark);
    setTimeout(() => spark.remove(), 900);
  }
  if (!label) return;
  const text = el("b", { className: "gain", textContent: label });
  text.style.cssText = `left:${Math.min(innerWidth - 80, Math.max(60, x))}px;top:${y}px`;
  document.body.append(text);
  setTimeout(() => text.remove(), 1300);
}
// Punkte gibt es für jede Sache nur einmal, auch nach erneutem Abhaken.
function gain(key, value) {
  if (state.awarded.includes(key)) return;
  state.awarded.push(key); state.xp += value;
  burst(22, `+${value} XP`);
}
// Tage in Folge, an denen etwas geschafft wurde. Heute darf noch offen sein.
function streak() {
  const active = new Set([...state.history.map(h => h.day), ...state.sport.log.map(x => x.day)]);
  const d = new Date();
  if (!active.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let count = 0;
  while (active.has(dayKey(d))) { count++; d.setDate(d.getDate() - 1); }
  return count;
}
const RANKS = ["Starter", "Entdecker", "Macher", "Profi", "Meister", "Legende"];
function playerCard(name, open) {
  const level = Math.floor(state.xp / 100) + 1, rest = state.xp % 100, days = streak();
  const bar = el("i"); bar.style.width = rest + "%";
  const today = new Date().toLocaleDateString("de-DE", { weekday: "long" });
  return el("section", { className: "player" }, avatar(), el("div", {},
    el("h1", { textContent: name ? `Hallo ${name}` : "Hallo" }),
    el("p", { className: "sub", textContent: `${today} · ${open === 1 ? "1 Sache" : `${open} Sachen`} offen` })),
    el("div", { className: "stats-line" }, el("span", { textContent: `Level ${level} · ${RANKS[Math.min(RANKS.length - 1, level - 1)]}` }),
      days > 1 && el("span", { textContent: `🔥 ${days} Tage` }), el("span", { textContent: `★ ${state.xp} XP` })),
    el("div", { className: "bar", title: `Noch ${100 - rest} XP bis Level ${level + 1}` }, bar));
}
// Jede Seite beginnt mit demselben Kopf: Zeichen, Name, kurzer Satz.
function banner(box) {
  const head = box.querySelector(":scope > h1");
  if (!head) return;
  const sub = head.nextElementSibling?.classList.contains("sub") ? head.nextElementSibling : null;
  const icon = document.querySelector(`nav [data-view=${current}] svg`)?.cloneNode(true);
  const area = el("div", { className: "banner" }, el("span", { className: "ic" }, icon), el("div", {}));
  head.before(area);
  area.lastChild.append(head, ...(sub ? [sub] : []));
}
// Karten nacheinander einschweben lassen – nur beim Öffnen einer Seite.
let introTimer = null;
function intro(box) {
  if (calmed() || !box) return;
  clearTimeout(introTimer);
  for (const other of document.querySelectorAll(".intro")) other.classList.remove("intro");
  [...box.children].forEach((child, i) => child.style.setProperty("--i", Math.min(i, 8)));
  box.classList.add("intro");
  introTimer = setTimeout(() => box.classList.remove("intro"), 1200);
}

// ================= Persönlich: Kennenlernen, Begleiter und Anpassung =================
// Alles läuft mit festen Regeln auf dem Gerät. Nichts wird irgendwohin gesendet.
const BUDDIES = { robo: "Roboter", cat: "Katze", fox: "Fuchs", owl: "Eule" };
const AREAS = { way: "Ziele erreichen", sport: "Bewegung und Sport", home: "Geld im Blick" };
const STRUGGLES = { start: "Ich komme schwer ins Tun", forget: "Ich vergesse Dinge", much: "Mir wird schnell alles zu viel",
  time: "Ich verschätze mich bei der Zeit" };
const RHYTHMS = { early: "Ich bin früh wach und fit", normal: "Irgendwo dazwischen", late: "Ich werde erst spät richtig wach" };
const TONES = { cheer: "Fröhlich, feuere mich an", calm: "Ruhig und sanft", direct: "Kurz und direkt" };
const ENERGY = { high: "⚡ Viel", normal: "🙂 Normal", low: "🔋 Wenig" };

function cleanMe(data) {
  const pick = (map, value, fallback) => Object.hasOwn(map, value) ? value : fallback;
  const many = (map, list) => [...new Set((Array.isArray(list) ? list : []).filter(x => Object.hasOwn(map, x)))];
  return { v: 2, done: data?.done === true, buddy: pick(BUDDIES, data?.buddy, "robo"), buddyName: String(data?.buddyName || "").slice(0, 20),
    areas: data?.v === 2 && Array.isArray(data.areas) ? many(AREAS, data.areas) : Object.keys(AREAS), struggles: many(STRUGGLES, data?.struggles),
    rhythm: pick(RHYTHMS, data?.rhythm, "normal"), tone: pick(TONES, data?.tone, "cheer"),
    why: String(data?.why || "").slice(0, 80), energy: { day: String(data?.energy?.day || ""),
      value: pick(ENERGY, data?.energy?.value, "") } };
}
// Bereiche, die nicht gewählt wurden, verschwinden aus Menü, Übersicht und Kalender.
const wants = view => !Object.hasOwn(AREAS, view) || state.me.areas.includes(view);
function applyAreas() {
  document.documentElement.dataset.off = Object.keys(AREAS).filter(view => !wants(view)).join(" ");
}
const buddyName = () => state.me.buddyName || BUDDIES[state.me.buddy];
const energyToday = () => state.me.energy.day === dayKey() ? state.me.energy.value : "";

function avatar(kind = state.me.buddy) {
  const box = el("div", { className: "avatar" });
  const top = {
    robo: '<line x1="40" y1="14" x2="40" y2="22"/><circle class="light" cx="40" cy="12" r="4"/><rect x="19" y="22" width="42" height="36" rx="16"/>',
    cat: '<path class="skin" d="M22 36 20 12l17 11h6l17-11-2 24"/><rect x="19" y="22" width="42" height="36" rx="18"/><path d="M8 40l14 3M8 50l14-2M72 40l-14 3M72 50l-14-2"/>',
    fox: '<path class="skin" d="M19 34 15 6l21 17h8L65 6l-4 28"/><path class="skin" d="M18 30q22-16 44 0L52 52 40 62 28 52z"/>',
    owl: '<path class="skin" d="M19 28l3-15 12 9h12l12-9 3 15"/><rect x="19" y="20" width="42" height="42" rx="21"/><circle cx="31" cy="39" r="9"/><circle cx="49" cy="39" r="9"/>',
  }[kind];
  const mouth = { robo: "M32 49q8 6 16 0", cat: "M34 49q3 4 6 0q3 4 6 0", fox: "M35 51q5 5 10 0", owl: "M36 49l4 7 4-7z" }[kind];
  box.innerHTML = `<svg viewBox="0 0 80 80" aria-hidden="true"><ellipse class="ring" cx="40" cy="42" rx="37" ry="13"/>
    <g class="bot">${top}<g class="eyes"><circle cx="31" cy="39" r="4"/><circle cx="49" cy="39" r="4"/></g><path d="${mouth}"/></g></svg>`;   // feste Zeichnungen
  return box;
}

// Wann erledigst du am meisten? Erst ab acht Einträgen.
function bestTime() {
  if (state.history.length < 8) return "";
  const count = [0, 0, 0];
  for (const h of state.history.slice(-60)) count[h.minute < 720 ? 0 : h.minute < 1020 ? 1 : 2]++;
  return ["am Vormittag", "am Nachmittag", "am Abend"][count.indexOf(Math.max(...count))];
}

// Ein Satz vom Begleiter, passend zur Lage und zum gewünschten Ton.
function buddySays(open, all) {
  const hour = new Date().getHours(), done = all.length - open.length, days = streak(), energy = energyToday();
  const say = (cheer, calm, direct) => ({ cheer, calm, direct })[state.me.tone];
  if (energy === "low") return say("Wenig Akku? Dann zählt heute jeder kleine Schritt doppelt! 💛",
    "Heute reicht wenig. Such dir eine Sache aus, der Rest darf warten.", "Wenig Energie: nur das Nötigste.");
  if (all.length && !open.length) return say("WOW, alles geschafft! Ich bin richtig stolz auf dich! 🎉",
    "Alles erledigt. Gönn dir jetzt Ruhe.", "Alles erledigt. Feierabend.");
  if (done) return say(`Stark, schon ${done} geschafft! Weiter so! 🚀`, `${done === 1 ? "Eine Sache ist" : `${done} Sachen sind`} schon getan. Ganz in deinem Tempo weiter.`,
    `${done} erledigt, ${open.length} offen.`);
  if (days > 2) return say(`${days} Tage in Folge – du bist nicht zu stoppen! 🔥`, `Seit ${days} Tagen bist du dabei. Schön.`,
    `Serie: ${days} Tage.`);
  if (state.me.why && new Date().getDate() % 2) return say(`Denk dran, wofür du das machst: ${state.me.why} ✨`,
    `Wofür du das tust: ${state.me.why}`, `Ziel: ${state.me.why}`);
  const hello = hour < 11 ? "Guten Morgen" : hour < 17 ? "Hallo" : "Guten Abend";
  const first = open[0]?.title;
  if (!first) return say(`${hello}! Heute ist nichts geplant – genieß es! 😎`, `${hello}. Heute ist nichts geplant.`, "Nichts geplant.");
  return say(`${hello}! Los geht's mit „${first}“ – du schaffst das! 💪`, `${hello}. Fang in Ruhe mit „${first}“ an.`,
    `Als Erstes: ${first}.`);
}

// ---------- Kennenlernen ----------
let meForm = null;
function meQuestions() {
  if (!meForm) {
    meForm = { step: 0, data: cleanMe(state.me) };
    // Nichts vorausgewählt: Antippen heißt „will ich“.
    if (meForm.data.areas.length === Object.keys(AREAS).length) meForm.data.areas = [];
  }
  const f = meForm, d = f.data;
  const steps = [["buddy", "Wer soll dich begleiten?"], ["areas", "Wobei soll ich dir helfen?"], ["struggles", "Was fällt dir manchmal schwer?"],
    ["rhythm", "Wann bist du am fittesten?"], ["tone", "Wie soll ich mit dir reden?"], ["why", "Wofür machst du das alles?"]];
  const [key, question] = steps[f.step];
  const choose = (text, on, run) => { const b = button((on ? "✓ " : "") + text, run, "btn alt pick"); b.setAttribute("aria-pressed", on); return b; };
  let controls;
  if (key === "buddy") {
    const name = el("input", { maxLength: 20, value: d.buddyName, placeholder: `z. B. ${{ robo: "Pixel", cat: "Mimi", fox: "Flo", owl: "Elli" }[d.buddy]}` });
    name.addEventListener("input", () => { d.buddyName = name.value; });
    controls = [el("div", { className: "buddies" }, ...Object.entries(BUDDIES).map(([value, text]) => {
      const b = button("", () => { d.buddy = value; render(); }, "buddy");
      b.append(avatar(value), el("span", { textContent: text })); b.setAttribute("aria-pressed", d.buddy === value); return b;
    })), field("Wie soll dein Begleiter heißen? (wenn du magst)", name)];
  } else if (key === "areas" || key === "struggles") {
    const map = key === "areas" ? AREAS : STRUGGLES;
    controls = [...Object.entries(map).map(([value, text]) => choose(text, d[key].includes(value), () => {
      d[key] = d[key].includes(value) ? d[key].filter(x => x !== value) : [...d[key], value]; render();
    })), small(key === "areas" ? "Tippe an, was du möchtest. Ohne Auswahl bekommst du alles. Aufgaben und Kalender sind immer dabei." : "Mehrere möglich, oder gar nichts.")];
  } else if (key === "why") {
    const why = el("input", { maxLength: 80, value: d.why, placeholder: "z. B. Mehr Zeit für meine Freunde" });
    why.ariaLabel = question;
    why.addEventListener("input", () => { d.why = why.value; });
    controls = [why, small("Freiwillig. Dein Begleiter erinnert dich ab und zu daran.")];
  } else controls = Object.entries(key === "rhythm" ? RHYTHMS : TONES).map(([value, text]) =>
    choose(text, d[key] === value, () => { d[key] = value; render(); }));
  const last = f.step === steps.length - 1;
  const name = host.profile().name;
  return [f.step ? button("Zurück", () => { f.step--; render(true); }, "quiet")
      : button("Später", () => { state.me.done = true; meForm = null; save(); render(true); }, "quiet"),
    ...title(f.step === 0 && name ? `Schön, dich kennenzulernen, ${name}!` : question,
      f.step === 0 ? question : `Frage ${f.step + 1} von ${steps.length}`),
    el("div", { className: "dots" }, ...steps.map((_, i) => el("i", { className: i <= f.step ? "on" : "" }))),
    card("", ...controls),
    button(last ? "Meine App einrichten" : "Weiter", () => {
      if (!last) { f.step++; render(true); return; }
      finishMe(d); burst(30); render(true);
    })];
}
function finishMe(data) {
  const shift = { early: -90, normal: 0, late: 90 };
  const move = shift[data.rhythm] - shift[state.me.rhythm];
  // Nur vorgeschlagene, noch nie erledigte Aufgaben an den Rhythmus anpassen.
  if (move) for (const task of state.tasks) {
    const at = toMinutes(task.time);
    if (at !== null && task.guide && !task.done.length) task.time = toTime(Math.max(360, Math.min(1350, at + move)));
  }
  state.settings.quiet = { early: "20:00", normal: "21:00", late: "22:30" }[data.rhythm];
  state.me = cleanMe({ ...data, v: 2, areas: data.areas.length ? data.areas : Object.keys(AREAS), done: true });
  meForm = null;
  save(); applyAreas();
}

// Karte unter „Mehr“: was die App über dich weiß, und welche Bereiche du siehst.
function meCard() {
  const m = state.me, line = (name, value) => el("p", { className: "fact" }, el("small", { textContent: name }), el("span", { textContent: value }));
  const list = (map, keys) => keys.map(k => map[k]).join(", ") || "–";
  const best = bestTime();
  const areas = Object.entries(AREAS).map(([view, text]) => {
    const box = el("input", { type: "checkbox", checked: wants(view) });
    box.addEventListener("change", () => {
      m.areas = Object.keys(AREAS).filter(key => key === view ? box.checked : m.areas.includes(key));
      save(); applyAreas(); render();
    });
    return el("label", { className: "switch" }, el("span", { textContent: text }), box);
  });
  return card("", el("h3", { textContent: "Über mich und meinen Begleiter" }), el("h4", { textContent: "Diese Bereiche anzeigen" }), ...areas,
    line("Begleiter", `${buddyName()} (${BUDDIES[m.buddy]})`), line("Schwer fällt mir", list(STRUGGLES, m.struggles)),
    line("Rhythmus", RHYTHMS[m.rhythm]), line("Ton", TONES[m.tone]), m.why && line("Wofür", m.why),
    best && line("Am meisten schaffe ich", best),
    button("Neu kennenlernen", () => { state.me.done = false; meForm = null; save(); host.show("today"); }, "btn alt"));
}
// Die Karten unter „Mehr“ klappen wie die übrigen Einstellungen auf.
let openFold = "";
function foldCard(node) {
  const head = node?.querySelector?.(":scope > h3");
  if (!head) return node;
  const name = head.textContent;
  const body = el("div", { className: "fold-body" }, ...[...node.childNodes].filter(n => n !== head));
  const fold = el("details", { className: "card fold", open: openFold === name },
    el("summary", {}, el("h2", { textContent: name })), body);
  fold.addEventListener("toggle", () => {
    if (!fold.isConnected) return;
    if (fold.open) {
      openFold = name;
      for (const other of document.querySelectorAll("#settings details.fold")) if (other !== fold) other.open = false;
    } else if (openFold === name) openFold = "";
  });
  return fold;
}

// ================= KI-Zugang (Claude) =================
// Direkter Aufruf aus dem Browser ohne eigenen Server und ohne Zusatzbibliothek.
// Der Schlüssel liegt nur auf diesem Gerät, nicht in Sicherungen und nicht im Programmcode.
const AI_STORE = "lifecontrol-ki";
const AI_MODELS = { "claude-opus-5-5": "Claude Opus 5.5 (am gründlichsten)", "claude-haiku-5-5": "Claude Haiku 5.5 (viel günstiger)" };
function aiSettings() {
  let data = {};
  try { data = JSON.parse(localStorage.getItem(AI_STORE)) || {}; } catch { /* noch nichts gespeichert */ }
  return { key: String(data.key || ""), model: Object.hasOwn(AI_MODELS, data.model) ? data.model : "claude-opus-5-5" };
}
const aiReady = () => !host.demo() && !!aiSettings().key;

const AI_ERRORS = { 401: "Der Schlüssel wird nicht angenommen. Prüfe ihn unter „Mehr → KI-Zugang“.",
  403: "Dieser Schlüssel darf diese Anfrage nicht stellen.", 413: "Das Foto ist zu groß.",
  429: "Zu viele Anfragen oder dein Limit ist erreicht. Warte kurz.", 529: "Die KI ist gerade überlastet. Versuch es gleich noch einmal." };

async function askAI({ system, messages, schema }) {
  const { key, model } = aiSettings();
  if (!key) throw new Error("Es ist noch kein KI-Schlüssel eingerichtet.");
  const body = { model, max_tokens: 8000, system, messages, output_config: { effort: "low" } };
  if (schema) body.output_config.format = { type: "json_schema", schema };
  const headers = { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2026-10-21",
    "anthropic-dangerous-direct-browser-access": "true" };
  // Lehnt die Sicherheitsprüfung ab, darf ein Ersatzmodell antworten.
  if (model === "claude-opus-5-5") { body.fallbacks = "default"; headers["anthropic-beta"] = "server-side-fallback-2026-07-01"; }
  const stop = new AbortController(), limit = setTimeout(() => stop.abort(), 120000);
  let response, data;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages",
      { method: "POST", headers, body: JSON.stringify(body), signal: stop.signal });
    data = await response.json();
  } catch {
    throw new Error("Keine Verbindung zur KI. Prüfe dein Internet.");
  } finally { clearTimeout(limit); }
  if (!response.ok) throw new Error(AI_ERRORS[response.status]
    || `Die KI meldet einen Fehler: ${String(data?.error?.message || response.status).slice(0, 200)}`);
  if (data.stop_reason === "refusal") throw new Error("Dabei kann die KI nicht helfen.");
  if (data.stop_reason === "max_tokens") throw new Error("Die Antwort wurde zu lang. Stell die Frage kürzer.");
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
  if (!text) throw new Error("Die KI hat nichts geantwortet.");
  return { text, content: data.content };
}

// ---------- Einrichten unter „Mehr“ ----------
function aiCard() {
  const current = aiSettings();
  const key = el("input", { type: "password", autocomplete: "off", spellcheck: false,
    placeholder: current.key ? "Gespeichert. Neu eingeben, um zu ersetzen." : "sk-ant-…" });
  const model = select(AI_MODELS, current.model);
  const status = el("p", { className: "sub", role: "status" });
  const store = data => { try { localStorage.setItem(AI_STORE, JSON.stringify(data)); return true; } catch { return false; } };
  const saveButton = button("Speichern und testen", async () => {
    if (host.demo()) { status.textContent = "In der Demo wird nichts gespeichert."; return; }
    const value = key.value.trim() || aiSettings().key;
    if (!value) { status.textContent = "Füge zuerst deinen Schlüssel ein."; return; }
    if (!store({ key: value, model: model.value })) { status.textContent = "Speichern nicht möglich."; return; }
    key.value = ""; status.textContent = "Wird getestet …";
    try {
      await askAI({ system: "Antworte nur mit dem Wort OK.", messages: [{ role: "user", content: "Test" }] });
      status.textContent = "Die KI ist verbunden ✓";
    } catch (error) { status.textContent = error.message; }
  });
  return card("", el("h3", { textContent: "KI-Zugang" }),
    el("p", { textContent: current.key ? "Ein Schlüssel ist gespeichert." : "Für Foto-Analyse und Chat brauchst du einen eigenen Claude-API-Schlüssel." }),
    small("Den Schlüssel erstellst du auf platform.claude.com. Die Nutzung kostet Geld und wird nach Verbrauch abgerechnet; ein Claude-Abo gilt dafür nicht. Dafür musst du volljährig sein oder ein Elternteil richtet es ein. Setz dort ein Ausgabenlimit."),
    small("Fotos und Fragen werden zur Beantwortung an Anthropic gesendet. Gib den Schlüssel niemandem."),
    field("API-Schlüssel", key), field("Modell", model), saveButton, status,
    current.key && button("Schlüssel von diesem Gerät löschen", () => {
      try { localStorage.removeItem(AI_STORE); } catch { /* war nicht gespeichert */ }
      chat = null; render();
    }, "btn alt"));
}

// ---------- Chat ----------
let chat = null, chatOpen = false;
function chatSystem() {
  const p = state.sport.profile;
  const facts = [p?.ageYears && `Alter ${p.ageYears}`, p && `Sportziel: ${SPORT_OPTIONS.goal[p.goal]}`,
    p?.limits.length && `Rücksicht auf: ${p.limits.map(l => SPORT_LIMITS[l]).join(", ")}`,
    `Heute offen: ${entries(dayKey()).filter(e => !e.done).map(e => e.title).join(", ") || "nichts"}`].filter(Boolean);
  return "Du bist der freundliche Begleiter in der Alltags-App Life Control. Antworte auf Deutsch, kurz und konkret, ohne Formatierungszeichen. "
    + "Du hilfst bei Alltag, Lernen, Bewegung, Essen und Geld. Gib keine Diagnosen und keine Pläne zum Abnehmen oder Fasten, "
    + "empfiehl keine sehr niedrigen Kalorienmengen und bei Personen unter 18 keine Kalorienziele. "
    + "Bei Beschwerden, Essproblemen oder seelischer Not rate freundlich dazu, mit einer Vertrauensperson oder Fachleuten zu sprechen; "
    + `im Notfall 112. Bekannt über die Person: ${facts.join("; ")}.`;
}
function chatPage() {
  if (!chat) chat = { system: chatSystem(), messages: [], shown: [], busy: false, error: "", draft: "" };
  const c = chat;
  const input = el("textarea", { rows: 3, value: c.draft, placeholder: "Frag mich etwas …" });
  input.ariaLabel = "Deine Frage";
  input.addEventListener("input", () => { c.draft = input.value; });
  const send = async () => {
    const text = input.value.trim();
    if (!text || c.busy) return;
    c.busy = true; c.error = ""; c.draft = ""; c.shown.push(["me", text]); render();
    try {
      const messages = [...c.messages, { role: "user", content: text }];
      const answer = await askAI({ system: c.system, messages });
      // Antwortblöcke unverändert behalten, damit das Gespräch gültig bleibt.
      c.messages = [...messages, { role: "assistant", content: answer.content }];
      c.shown.push(["ai", answer.text]);
    } catch (error) { c.error = error.message; c.shown.pop(); c.draft = text; }
    c.busy = false;
    if (chat === c && chatOpen) render();
  };
  return [button("Zurück", () => { chatOpen = false; render(true); }, "quiet"), ...title(`Frag ${buddyName()}`, "KI-Chat"),
    !aiReady() && card("sand", el("p", { textContent: "Richte zuerst unter „Mehr → KI-Zugang“ deinen Schlüssel ein." }),
      button("Zu Mehr", () => { chatOpen = false; openFold = "KI-Zugang"; go("settings"); }, "btn alt")),
    ...c.shown.map(([who, text]) => el("p", { className: "message " + who, textContent: text })),
    c.busy && el("p", { className: "message ai", textContent: "Denke nach …" }),
    c.error && card("sand", c.error),
    aiReady() && c.messages.length < 40 && card("", input, button("Senden", send)),
    c.shown.length > 0 && button("Neues Gespräch", () => { chat = null; render(true); }, "btn alt"),
    small("Die KI kann sich irren. Das Gespräch wird nicht gespeichert.")];
}

// ================= Ernährung, Trinken und Schritte =================
// Richtwerte sind grobe Orientierung (Annahmen). Keine Diät, kein Kaloriendefizit.
function cleanFood(data) {
  const day = v => /^\d{4}-\d\d-\d\d$/.test(v);
  const amount = (v, max) => Math.max(0, Math.min(max, Math.round(Number(String(v ?? "").replace(",", ".")) || 0)));
  const daily = (map, max) => Object.fromEntries(Object.entries(map && typeof map === "object" ? map : {})
    .filter(([k]) => day(k)).slice(-120).map(([k, v]) => [k, amount(v, max)]));
  return { entries: (Array.isArray(data?.entries) ? data.entries : []).filter(e => day(e?.day)).slice(-600).map(e => ({
    id: String(e.id || "").slice(0, 30) || newId(), day: e.day, name: String(e.name || "Essen").slice(0, 80),
    kcal: amount(e.kcal, 10000), protein: amount(e.protein, 1000), fiber: amount(e.fiber, 500), ai: e.ai === true })),
    water: daily(data?.water, 10000), steps: daily(data?.steps, 100000) };
}

// Richtwerte aus Alter, Gewicht, Größe und Trainingsziel.
function targets() {
  const p = state.sport.profile;
  const age = p?.ageYears || 0, weight = p?.weight || 0, height = p?.height || 0;
  const adult = age >= 18;
  const trains = weekPlan(p || { goal: "all", days: [] }).some(d => d.day === weekIndex());
  const base = !age ? 2000 : adult ? Math.max(1500, Math.min(3000, Math.round((weight * 33 || 2000) / 100) * 100)) : age < 15 ? 2000 : 2200;
  return { known: !!(age && weight && height), adult,
    water: base + (trains ? 500 : 0),
    protein: weight ? Math.round(weight * (adult ? (p.goal === "strength" ? 1.4 : .8) : .9)) : 0,
    fiber: !age || adult ? 30 : 25,
    steps: !age ? 8000 : age < 18 ? 10000 : age >= 60 ? 7000 : 8000,
    // Nur für Erwachsene: ungefährer Bedarf, um das Gewicht zu halten (Mifflin-St Jeor).
    kcal: adult && weight && height ? Math.round((10 * weight + 6.25 * height - 5 * age + ({ f: -161, m: 5, x: -78 })[p.sex])
      * ({ 1: 1.4, 2: 1.55, 3: 1.7 })[p.level] / 50) * 50 : 0 };
}
// Kalorien zeigt die App nur Erwachsenen.
const showKcal = () => targets().adult;

// Foto verkleinern, damit es schnell und günstig übertragen wird.
async function shrink(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((done, fail) => { image.onload = done; image.onerror = () => fail(new Error("Dieses Foto kann ich nicht lesen.")); image.src = url; });
    const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
    const canvas = el("canvas", { width: Math.round(image.width * scale), height: Math.round(image.height * scale) });
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", .82);
  } finally { URL.revokeObjectURL(url); }
}
const FOOD_SCHEMA = { type: "object", additionalProperties: false,
  required: ["is_food", "name", "portion", "kcal", "protein_g", "fiber_g", "confidence", "note"],
  properties: { is_food: { type: "boolean" }, name: { type: "string" }, portion: { type: "string" }, kcal: { type: "number" },
    protein_g: { type: "number" }, fiber_g: { type: "number" }, confidence: { type: "string", enum: ["low", "medium", "high"] },
    note: { type: "string" } } };
async function analyseFood(dataUrl, hint) {
  const answer = await askAI({
    system: "Du schätzt Nährwerte von Mahlzeiten auf Fotos. Antworte auf Deutsch. Schätze die sichtbare Portion als Ganzes. "
      + "Zeigt das Foto kein Essen oder Getränk, setze is_food auf false und die Zahlen auf 0. In note steht kurz, was die Schätzung unsicher macht. "
      + "Bewerte das Essen nicht und gib keine Diätratschläge.",
    messages: [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: dataUrl.split(",")[1] } },
      { type: "text", text: hint ? `Zusatzinfo: ${hint}` : "Was ist das und welche Nährwerte hat es ungefähr?" }] }],
    schema: FOOD_SCHEMA });
  let result;
  try { result = JSON.parse(answer.text); } catch { throw new Error("Die Antwort der KI war unlesbar. Versuch es noch einmal."); }
  if (!result.is_food) throw new Error("Auf dem Foto erkenne ich kein Essen.");
  return result;
}

let foodDraft = null;
function meter(name, value, target, unit) {
  const bar = el("i"); bar.style.width = target ? Math.min(100, value / target * 100) + "%" : "0%";
  return el("div", { className: "meter" }, el("p", {}, el("span", { textContent: name }),
    el("b", { textContent: `${value.toLocaleString("de-DE")}${target ? ` / ${target.toLocaleString("de-DE")}` : ""} ${unit}` })),
    el("div", { className: "bar" }, bar));
}
function foodForm() {
  const d = foodDraft;
  const input = (text, key, type = "number") => {
    const node = el("input", { type, value: d[key] ?? "", ...(type === "number" ? { inputMode: "decimal", min: 0, step: "any" } : { maxLength: 80 }) });
    node.addEventListener("input", () => { d[key] = node.value; });
    return field(text, node);
  };
  const warn = el("p", { className: "sub", role: "status" });
  return card("big", el("strong", { textContent: d.ai ? "Prüf die Schätzung" : "Essen eintragen" }),
    d.photo && el("img", { src: d.photo, alt: "Dein Foto", className: "photo" }),
    d.ai && el("p", { className: "note", textContent: `Geschätzt${d.portion ? ` für: ${d.portion}` : ""}. Sicherheit: ${({ low: "niedrig", medium: "mittel", high: "hoch" })[d.confidence] || "unklar"}. ${d.note || ""}` }),
    input("Was war es?", "name", "text"), showKcal() && input("Kalorien (kcal)", "kcal"), input("Protein (g)", "protein"),
    input("Ballaststoffe (g)", "fiber"), warn,
    button("Speichern", () => {
      if (!String(d.name || "").trim()) { warn.textContent = "Schreib kurz auf, was es war."; return; }
      state.food.entries.push(cleanFood({ entries: [{ ...d, day: dayKey() }] }).entries[0]);
      foodDraft = null; gain(`food-${dayKey()}`, 5); save(); render(true);
    }),
    button("Verwerfen", () => { foodDraft = null; render(true); }, "btn alt"));
}
function foodPage() {
  const day = dayKey(), t = targets(), list = state.food.entries.filter(e => e.day === day);
  const sum = key => list.reduce((total, e) => total + e[key], 0);
  const water = state.food.water[day] || 0;
  const drink = ml => () => { state.food.water[day] = Math.max(0, water + ml); save(); render(); };
  const steps = el("input", { type: "number", inputMode: "numeric", min: 0, max: 100000, value: state.food.steps[day] || "", placeholder: "z. B. 6000" });
  steps.addEventListener("change", () => { state.food.steps[day] = Number(steps.value) || 0; state.food = cleanFood(state.food); save(); render(); });
  const status = el("p", { className: "sub", role: "status" });
  const file = el("input", { type: "file", accept: "image/*", hidden: true });
  const hint = el("input", { maxLength: 150, placeholder: "z. B. mit 1 EL Öl, große Portion" });
  const photo = button("📷 Foto vom Essen", () => {
    if (!aiReady()) { status.textContent = host.demo() ? "In der Demo ist die KI ausgeschaltet." : "Richte zuerst unter „Mehr → KI-Zugang“ deinen Schlüssel ein."; return; }
    file.click();
  });
  file.addEventListener("change", async () => {
    const chosen = file.files[0];
    file.value = "";
    if (!chosen) return;
    photo.disabled = true; status.textContent = "Die KI schaut sich dein Essen an …";
    try {
      const image = await shrink(chosen), r = await analyseFood(image, hint.value.trim());
      foodDraft = { ai: true, photo: image, name: r.name, portion: r.portion, kcal: Math.round(r.kcal), protein: Math.round(r.protein_g),
        fiber: Math.round(r.fiber_g), confidence: r.confidence, note: r.note };
      render(true);
    } catch (error) { photo.disabled = false; status.textContent = error.message; }
  });
  if (foodDraft) return [...title("Ernährung", "Kurz prüfen, dann speichern."), foodForm()];
  return [...title("Ernährung", "Essen, Trinken und Schritte von heute."),
    !t.known && card("sand", el("p", { textContent: "Gib im Sportplan Alter, Größe und Gewicht an, dann passen die Richtwerte zu dir." }),
      button("Angaben machen", () => { sportTab = "training"; openSportForm(); }, "btn alt")),
    card("big", photo, field("Hinweis zum Foto (wenn du magst)", hint), file, status,
      button("Ohne Foto eintragen", () => { foodDraft = { ai: false, name: "" }; render(true); }, "btn alt")),
    card("", el("h3", { textContent: "Heute gegessen" }),
      meter("Protein", sum("protein"), t.protein, "g"), meter("Ballaststoffe", sum("fiber"), t.fiber, "g"),
      showKcal() && meter("Kalorien", sum("kcal"), t.kcal, "kcal"),
      showKcal() && t.kcal > 0 && small("Der Kalorienwert ist der geschätzte Bedarf zum Halten des Gewichts, kein Diätziel."),
      ...list.map(e => el("div", { className: "item" }, el("span", { className: "title" }, e.name,
        small(`${showKcal() ? `${e.kcal} kcal · ` : ""}${e.protein} g Protein · ${e.fiber} g Ballaststoffe${e.ai ? " · KI-Schätzung" : ""}`)),
        button("✕", () => { if (confirm(`„${e.name}“ löschen?`)) { state.food.entries.splice(state.food.entries.indexOf(e), 1); save(); render(); } }, "quiet"))),
      !list.length && small("Noch nichts eingetragen.")),
    card("", el("h3", { textContent: "Trinken" }), meter("Getrunken", water, t.water, "ml"),
      el("div", { className: "chips" }, button("+ 250 ml", drink(250), ""), button("+ 500 ml", drink(500), ""), water > 0 && button("− 250 ml", drink(-250), "")),
      small("Richtwert, an Trainingstagen etwas höher. Bei Herz- oder Nierenproblemen gilt der ärztliche Rat.")),
    card("", el("h3", { textContent: "Schritte" }), meter("Gegangen", state.food.steps[day] || 0, t.steps, "Schritte"),
      field("Schritte von heute eintragen", steps),
      small("Die App kann deine Schritte nicht selbst auslesen. Schau in der Health-App nach und trag die Zahl ein.")),
    small("Alle Werte sind Schätzungen und ersetzen keine Ernährungsberatung. Wenn Essen dich belastet, sprich mit jemandem, dem du vertraust.")];
}

// ---------- Sport-Bereich mit zwei Reitern ----------
let sportTab = "training";
function sportPage() {
  if (sportRun || sportForm) return trainingPage();
  const tabs = el("div", { className: "tabs", role: "group", ariaLabel: "Bereich" },
    ...[["training", "Training"], ["food", "Ernährung"]].map(([key, text]) => {
      const b = button(text, () => { sportTab = key; foodDraft = null; render(true); }, "");
      b.setAttribute("aria-pressed", sportTab === key); return b;
    }));
  const parts = sportTab === "food" ? foodPage() : trainingPage();
  const sub = parts.findIndex(node => node?.classList?.contains("sub"));
  parts.splice(sub + 1, 0, tabs);
  return parts;
}


const KEY = "meinweg-v1";
const $ = id => document.getElementById(id);

// ================= Anleitungen =================
const ICONS = {
  bag: '<path d="M8 8V6a4 4 0 0 1 8 0v2M5 8h14l1 13H4zM9 13h6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  room: '<path d="M3 21V9l9-6 9 6v12M8 21v-6h8v6"/>',
  wash: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="14" r="4"/><path d="M5 8h14M8 5.5h.01M12 5.5h4"/>',
  book: '<path d="M12 6c-2-2-6-2-9-1v14c3-1 7-1 9 1 2-2 6-2 9-1V5c-3-1-7-1-9 1zM12 6v14"/>',
  pot: '<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM2 10h20M9 6c-1-1 1-2 0-3M15 6c-1-1 1-2 0-3"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M15 8.5a4.5 4.5 0 1 0 0 7M6.5 11h6M6.5 14h6"/>',
  phone: '<path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4c-9 1-16-6-15-15z"/>',
  cart: '<path d="M3 4h2l3 11h10l3-8H7M9 20h.01M17 20h.01"/>',
  paper: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5"/>',
};
const step = (title, text, help) => ({ title, text, help });
const GUIDES = {
  bag: { stage: 1, icon: "bag", title: "Schultasche packen", minutes: 5, steps: [
    step("Stundenplan ansehen", "Welche Fächer hast du morgen?", "Mach ein Foto vom Stundenplan, dann findest du ihn immer."),
    step("Hefte und Bücher", "Leg alles für diese Fächer in die Tasche.", "Geh Fach für Fach durch, eins nach dem anderen."),
    step("Mäppchen und Extras", "Stifte, Sportzeug, Unterschriften?", "Frag dich: Brauche ich morgen etwas Besonderes?"),
    step("Tasche an die Tür", "Dann ist morgens schon alles bereit.", "Stell sie dorthin, wo du beim Rausgehen vorbeikommst.")] },
  morning: { stage: 1, icon: "sun", title: "Morgenroutine", minutes: 25, steps: [
    step("Aufstehen", "Vorhang auf, Füße auf den Boden.", "Leg den Wecker so weit weg, dass du aufstehen musst."),
    step("Waschen und Zähne", "Gesicht waschen, Zähne putzen.", "Ein Lied dauert ungefähr so lang wie Zähneputzen."),
    step("Anziehen", "Zieh an, was bereitliegt.", "Leg die Kleidung am Abend vorher raus."),
    step("Frühstück und Wasser", "Etwas Kleines reicht.", "Ein Glas Wasser ist schon ein Anfang."),
    step("Tasche und los", "Schlüssel, Handy, Tasche.", "Sag die drei Dinge laut auf.")] },
  room: { stage: 1, icon: "room", title: "Zimmer aufräumen", minutes: 15, steps: [
    step("Müll raus", "Nur den Müll. Sonst nichts.", "Nimm eine Tüte und geh einmal im Kreis."),
    step("Geschirr in die Küche", "Alle Gläser und Teller wegbringen.", "Nimm, was in zwei Hände passt."),
    step("Wäsche sammeln", "Schmutziges in den Wäschekorb.", "Fang beim Boden an."),
    step("Eine Fläche frei machen", "Schreibtisch oder Bett, nur eine.", "Wähle die kleinste Fläche."),
    step("Fertig ansehen", "Das reicht für heute.", "Perfekt muss es nicht sein.")] },
  laundry: { stage: 2, icon: "wash", title: "Wäsche waschen", minutes: 10, steps: [
    step("Sortieren", "Helles und Dunkles getrennt.", "Im Zweifel kommt es zu den dunklen Sachen. Neue Teile einzeln."),
    step("Etiketten prüfen", "Welche Temperatur ist erlaubt? Taschen leeren.", "Die Zahl im Wasserbottich ist die höchste Temperatur. Unsicher? Frag jemanden."),
    step("Maschine füllen", "Locker füllen, Tür schließen.", "Eine Hand breit sollte oben noch frei sein."),
    step("Waschmittel einfüllen", "Schau auf die Packung, wie viel du brauchst.", "Waschmittel kommt meist ins Fach mit der II. Sonst frag nach."),
    step("Starten und Wecker stellen", "Programm wählen, starten, Erinnerung zum Aufhängen.", "Häng die Wäsche bald nach dem Waschen auf.")] },
  learn: { stage: 2, icon: "book", title: "Lernen, 25 Minuten", minutes: 25, timer: true, steps: [
    step("Platz richten", "Heft und Stift holen, Wasser dazu.", "Räum nur so viel weg, dass das Heft Platz hat."),
    step("Handy weglegen", "Am besten in ein anderes Zimmer.", "Wenn das nicht geht: Flugmodus."),
    step("Eine Aufgabe wählen", "Nur eine. Die erste reicht.", "Nimm die leichteste, um reinzukommen."),
    step("Jetzt lernen", "Starte den Timer. Danach ist Pause.", "Es fällt schwer? Mach nur 5 Minuten und entscheide dann neu.")] },
  pasta: { stage: 2, icon: "pot", title: "Nudeln kochen", minutes: 20, steps: [
    step("Wasser aufsetzen", "Großer Topf, Deckel drauf, Herd an.", "Frag eine erwachsene Person, wenn du den Herd noch nicht kennst."),
    step("Salz und Nudeln", "Wenn es sprudelt: salzen, Nudeln rein.", "Vorsicht, heißer Dampf. Etwa 100 g Nudeln pro Person."),
    step("Umrühren und Zeit stellen", "Die Kochzeit steht auf der Packung.", "Bleib in der Küche."),
    step("Abgießen", "Mit Topflappen, vom Körper weg.", "Zu schwer oder unsicher? Hol Hilfe."),
    step("Herd ausschalten", "Prüf es zweimal.", "Alle Knöpfe auf Null.")] },
  pocket: { stage: 2, icon: "coin", title: "Taschengeld planen", minutes: 10, steps: [
    step("Was habe ich?", "Zähl dein Geld.", "Konto und Bargeld zusammen."),
    step("Was brauche ich sicher?", "Handy, Fahrten, Vereinbartes.", "Denk an die nächsten vier Wochen."),
    step("Etwas zurücklegen", "Auch ein kleiner Betrag zählt.", "Zum Beispiel 5 Euro für ein Ziel."),
    step("Rest ist frei", "Den darfst du ausgeben.", "Teil ihn durch vier, das ist dein Wochenbetrag.")] },
  doctor: { stage: 3, icon: "phone", title: "Arzttermin ausmachen", minutes: 10, steps: [
    step("Infos bereitlegen", "Versichertenkarte, Kalender, Anliegen.", "Schreib in einem Satz auf, warum du hingehst."),
    step("Zeiten aussuchen", "Wann kannst du? Notiere zwei Möglichkeiten.", "Schau in deinen Plan."),
    step("Anrufen", "„Guten Tag, mein Name ist … Ich hätte gern einen Termin wegen …“", "Lies den Satz einfach ab. Bei einem Notfall wähle den Notruf 112."),
    step("Termin eintragen", "Datum und Uhrzeit in den Plan.", "Wiederhol den Termin am Telefon, bevor du auflegst.")] },
  shopping: { stage: 3, icon: "cart", title: "Einkaufen", minutes: 30, steps: [
    step("Liste schreiben", "Erst schauen, was da ist.", "Ordne die Liste nach Obst, Kühlregal, Rest."),
    step("Budget festlegen", "Wie viel darf es kosten?", "Nimm nur diesen Betrag mit, wenn du magst."),
    step("Tasche mitnehmen", "Und das Geld.", "Leg die Tasche an die Tür."),
    step("Nach Liste einkaufen", "Hake beim Gehen ab.", "Alles andere kann auf die nächste Liste."),
    step("Einräumen", "Kühles zuerst.", "Quittung kurz prüfen.")] },
  budget: { stage: 3, icon: "coin", title: "Monatsbudget", minutes: 20, steps: [
    step("Einnahmen notieren", "Was kommt im Monat rein?", "Lohn, Taschengeld, Nebenjob."),
    step("Feste Kosten", "Was geht sicher weg?", "Schau in die letzten Kontoauszüge."),
    step("Sparbetrag", "Leg ihn gleich am Anfang zurück.", "Klein anfangen ist in Ordnung."),
    step("Wochenbetrag", "Rest durch vier.", "Prüf am Sonntag kurz, wie es läuft.")] },
  apply: { stage: 3, icon: "paper", title: "Bewerbung schreiben", minutes: 40, steps: [
    step("Stelle genau lesen", "Was wird gesucht?", "Markier drei wichtige Wörter."),
    step("Lebenslauf prüfen", "Aktuell und vollständig?", "Schule, Praktika, Interessen."),
    step("Anschreiben", "Warum du, warum dort?", "Drei kurze Absätze reichen."),
    step("Gegenlesen lassen", "Bitte jemanden um einen Blick.", "Lies es sonst laut vor."),
    step("Abschicken", "Anhänge prüfen und senden.", "Notiere das Datum.")] },
  flat: { stage: 4, icon: "room", title: "Wohnung suchen", minutes: 30, steps: [
    step("Budget klären", "Was kann ich monatlich zahlen?", "Denk an Nebenkosten und Kaution."),
    step("Wunschliste", "Muss und Kann trennen.", "Höchstens drei Muss-Punkte."),
    step("Angebote ansehen", "Notiere passende Wohnungen.", "Nie Geld vor einer Besichtigung überweisen."),
    step("Besichtigung anfragen", "Kurze, freundliche Nachricht.", "Stell dich in zwei Sätzen vor.")] },
  contract: { stage: 4, icon: "paper", title: "Vertrag prüfen", minutes: 20, steps: [
    step("In Ruhe lesen", "Nichts sofort unterschreiben.", "Bitte um eine Kopie zum Mitnehmen."),
    step("Kosten und Laufzeit", "Wie viel, wie lange?", "Schreib beides groß auf."),
    step("Kündigung", "Bis wann und wie?", "Trag die Frist in deinen Plan ein."),
    step("Fragen klären", "Unklares nachfragen.", "Hol dir Rat bei einer Vertrauensperson oder Beratungsstelle.")] },
  money: { stage: 4, icon: "coin", title: "Finanzen ordnen", minutes: 20, steps: [
    step("Unterlagen sammeln", "Konto, Verträge, Rechnungen.", "Ein Ordner reicht."),
    step("Offene Rechnungen", "Was ist fällig?", "Das Dringendste zuerst."),
    step("Abos prüfen", "Was nutze ich noch?", "Kündige eins, das du nicht brauchst."),
    step("Nächsten Termin setzen", "Einmal im Monat reicht.", "Trag ihn in den Plan ein.")] },
};
const STAGES = [
  ["Routinen", "Morgen, Schultasche, Zimmer", "ungefähr 13–14 Jahre"],
  ["Selbst planen", "Lernen, Wäsche, Kochen, Taschengeld", "ungefähr 15–16 Jahre"],
  ["Selbstständig", "Termine, Einkauf, Budget, Bewerbung", "ungefähr 17–18 Jahre"],
  ["Eigenes Leben", "Wohnung, Verträge, Finanzen", "ab 18"]];
const COLORS = [["#4f7d6d", "#dcebe3", "Salbei"], ["#6a61a8", "#e7e3f4", "Lavendel"], ["#3f6f96", "#dce9f3", "Blau"],
  ["#a5604a", "#f4e2da", "Terrakotta"], ["#3d424d", "#e4e5e8", "Grau"]];

// ================= Daten =================
const pad = n => String(n).padStart(2, "0");
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = key => new Date(key + "T12:00");
const minutesNow = () => new Date().getHours() * 60 + new Date().getMinutes();
const toMinutes = t => /^\d\d:\d\d$/.test(t) ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3)) : null;
const toTime = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const REPEATS = { once: "Einmal", daily: "Jeden Tag", school: "Montag bis Freitag", weekly: "Jede Woche" };

// Übernimmt nur bekannte Felder – auch aus geladenen Dateien.
function clean(data) {
  const text = (v, max = 200) => String(v ?? "").slice(0, max);
  const list = v => (Array.isArray(v) ? v : []).slice(-600);
  const date = v => /^\d{4}-\d\d-\d\d$/.test(v) ? v : "";
  const s = data?.settings || {};
  return {
    ready: data?.ready === true, name: text(data?.name, 30),
    stage: [1, 2, 3, 4].includes(data?.stage) ? data.stage : 1,
    tasks: list(data?.tasks).map(t => ({ id: text(t?.id, 30) || newId(), title: text(t?.title, 80),
      time: toMinutes(t?.time) !== null && toMinutes(t?.time) < 1440 ? t.time : "",
      repeat: Object.hasOwn(REPEATS, t?.repeat) ? t.repeat : "once", date: date(t?.date) || dayKey(),
      guide: Object.hasOwn(GUIDES, t?.guide) ? t.guide : "",
      done: list(t?.done).filter(date), skip: list(t?.skip).filter(date) })).filter(t => t.title),
    history: list(data?.history).map(h => ({ ref: text(h?.ref, 40), day: date(h?.day),
      minute: Number(h?.minute) || 0, helped: h?.helped === true })),
    me: cleanMe(data?.me), food: cleanFood(data?.food), sport: cleanSport(data?.sport), quest: cleanQuest(data?.quest), xp: Math.max(0, Math.min(1e7, Number(data?.xp) || 0)),
    awarded: list(data?.awarded).map(x => text(x, 60)), cheer: "",
    short: Object.fromEntries(Object.keys(GUIDES).filter(k => typeof data?.short?.[k] === "boolean")
      .map(k => [k, data.short[k]])),
    dismissed: list(data?.dismissed).map(x => text(x, 60)),
    tools: list(data?.tools).slice(0, 20).map(t => ({ id: text(t?.id, 30) || newId(), title: text(t?.title, 60),
      target: Math.max(1, Math.min(50, Number(t?.target) || 1)), log: list(t?.log).filter(date) })).filter(t => t.title),
    lightDay: date(data?.lightDay), notified: list(data?.notified).map(x => text(x, 60)),
    settings: { effects: s.effects === true, sound: s.sound === true, single: s.single === true,
      remind: s.remind === true, quiet: toMinutes(s.quiet) !== null ? s.quiet : "21:00",
      color: COLORS.some(c => c[0] === s.color) ? s.color : COLORS[0][0] },
  };
}
let state;
try { state = clean(JSON.parse(localStorage.getItem(KEY))); } catch { state = clean(null); }
let saveFailed = false;
function save() {
  if (host.demo()) return;
  try { localStorage.setItem(KEY, JSON.stringify(state)); saveFailed = false; }
  catch { saveFailed = true; }
  host.touch();
}

// ================= Logik =================
function isDue(task, day) {
  if (task.skip.includes(day)) return false;
  const weekday = fromKey(day).getDay();
  if (task.repeat === "daily") return day >= task.date;
  if (task.repeat === "school") return day >= task.date && weekday >= 1 && weekday <= 5;
  if (task.repeat === "weekly") return day >= task.date && weekday === fromKey(task.date).getDay();
  // Einmalige, offene Aufgaben wandern nach heute mit.
  if (day === dayKey()) return task.done.includes(day) || (task.date <= day && !task.done.length);
  return task.date === day;
}
const tasksFor = day => state.tasks.filter(t => isDue(t, day))
  .sort((a, b) => (toMinutes(a.time) ?? 2000) - (toMinutes(b.time) ?? 2000));
const duration = task => GUIDES[task.guide]?.minutes || 15;

function finish(task, helped) {
  const day = dayKey();
  if (task?.done.includes(day)) return;   // nicht doppelt zählen
  task?.done.push(day);
  const ref = task?.guide || task?.id;
  if (ref) state.history.push({ ref, day, minute: minutesNow(), helped: !!helped });
  gain(`task-${ref}-${day}`, 5);
  save(); chime();
}
function undo(task) {
  const day = dayKey(), ref = task.guide || task.id;
  task.done = task.done.filter(d => d !== day);
  const i = state.history.map(h => h.ref + h.day).lastIndexOf(ref + day);
  if (i >= 0) state.history.splice(i, 1);
  save();
}

// Lernen nach festen Regeln: nur Vorschläge, entschieden wird von dir.
function insights() {
  const result = [];
  for (const task of state.tasks) {
    const planned = toMinutes(task.time), ref = task.guide || task.id;
    const times = state.history.filter(h => h.ref === ref).slice(-6).map(h => h.minute).sort((a, b) => a - b);
    if (planned === null || times.length < 3) continue;
    const usual = Math.round(times[Math.floor(times.length / 2)] / 15) * 15;
    const id = `time-${task.id}-${usual}`;
    if (Math.abs(usual - planned) >= 45 && usual < 1440 && !state.dismissed.includes(id))
      result.push({ id, text: `„${task.title}“ erledigst du meist gegen ${toTime(usual)} Uhr. Uhrzeit ändern?`,
        yes: "Ja, ändern", run: () => { task.time = toTime(usual); } });
  }
  for (const [key, guide] of Object.entries(GUIDES)) {
    const alone = state.history.filter(h => h.ref === key).slice(-3);
    if (alone.length === 3 && alone.every(h => !h.helped) && !(key in state.short))
      result.push({ id: `short-${key}`, text: `„${guide.title}“ klappt ohne Hilfe. Anleitung kürzer anzeigen?`,
        yes: "Ja, kürzer", run: () => { state.short[key] = true; }, no: () => { state.short[key] = false; } });
  }
  const here = state.history.filter(h => GUIDES[h.ref]?.stage === state.stage);
  const id = `stage-${state.stage}`;
  if (state.stage < 4 && here.length >= 8 && new Set(here.map(h => h.day)).size >= 4 && !state.dismissed.includes(id))
    result.push({ id, text: `Du bist in Stufe ${state.stage} gut unterwegs. Bereit für „${STAGES[state.stage][0]}“?`,
      yes: "Ja, weiter", run: () => { state.stage++; } });
  return result;
}

// ================= Bausteine =================
function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children.filter(c => c !== null && c !== false && c !== undefined));
  return node;
}
function button(text, run, className = "btn") {
  const b = el("button", { type: "button", textContent: text, className });
  b.addEventListener("click", run);
  return b;
}
const card = (className, ...children) => el("section", { className: "card " + className }, ...children);
const title = (head, sub) => [el("h1", { textContent: head }), el("p", { className: "sub", textContent: sub })];
const small = text => el("small", { textContent: text });
const field = (label, node) => el("label", {}, label, node);
function select(options, value) {
  const node = el("select", {}, ...Object.entries(options).map(([v, t]) => el("option", { value: v, textContent: t })));
  node.value = value;
  return node;
}
function picture(name) {
  const box = el("div", { className: "pic" });
  box.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;   // feste Zeichnungen
  return box;
}

let current = null, run = null, planDay = dayKey(), timer = null;
function render(focusTop) {
  clearInterval(timer);
  applyAreas();
  if (!current || host.locked()) return;
  const box = document.getElementById(current === "me" ? "alltag-me" : current);
  if (!state.ready) { box.replaceChildren(card("", "Beantworte zuerst die kurzen Fragen.")); return; }
  const content = run ? runPage() : PAGES[current]();
  box.replaceChildren(...content.filter(Boolean).map(n => current === "me" ? foldCard(n) : n));
  if (saveFailed) box.prepend(card("sand", "Speichern ist in diesem Browser nicht möglich."));
  banner(box);
  if (focusTop) { scrollTo(0, 0); intro(box); }
}
const go = next => host.show(next);

// Beim ersten Mal passend zum Profil einrichten.
function ensure() {
  if (state.ready) return;
  const { occupation } = host.profile();
  state.stage = occupation === "pupil" ? 2 : occupation === "retired" ? 4 : 3;
  const starter = { 2: [["bag", "19:00", "school"], ["learn", "15:00", "school"], ["room", "17:00", "weekly"]],
    3: [["shopping", "17:30", "weekly"], ["room", "18:00", "weekly"], ["budget", "18:00", "weekly"]],
    4: [["money", "10:00", "weekly"], ["room", "11:00", "weekly"], ["shopping", "15:00", "weekly"]] }[state.stage];
  state.tasks.push(...starter.map(([guide, time, repeat]) => ({ id: newId(), title: GUIDES[guide].title, time,
    repeat, date: dayKey(), guide, done: [], skip: [] })));
  state.ready = true;
  save();
}

// ---------- Heute ----------
function row(task, now) {
  const done = task.done.includes(dayKey());
  const check = button(done ? "✓" : "", () => { done ? undo(task) : finish(task, false); render(); }, "check");
  check.ariaLabel = done ? `${task.title} wieder offen` : `${task.title} erledigt`;
  return el("div", { className: "item" + (done ? " done" : "") + (now ? " now" : "") }, check,
    button(task.title, () => start(task), "title"), el("em", { textContent: task.time }));
}
// ================= Tagesübersicht und Kalender =================
// Beide lesen dieselben Einträge. Nichts muss doppelt eingetragen werden:
// Aufgaben, Trainings, Quest-Etappen und Geldtermine kommen aus ihren Bereichen.
const TOPICS = { plan: ["Aufgabe", "Aufgaben"], sport: ["Sport", "Sport"], way: ["Weg", "Weg"], home: ["Geld", "Geld"],
  settings: ["App", "App"] };
const label = text => el("h2", { className: "label", textContent: text });
const menuIcon = view => document.querySelector(`nav [data-view=${view}] svg`)?.cloneNode(true);

// Geschätzte Termine der Quest: jede offene Station und das Ziel.
function questDates() {
  const now = currentQuest();
  if (!now || now.next < 0) return [];
  const { quest, route, done } = now, weeks = estimate(route, quest.answers).likely;
  if (!Number.isFinite(weeks)) return [];
  let share = 0;
  const at = part => { const d = fromKey(quest.created); d.setDate(d.getDate() + Math.round(part * weeks * 7)); return dayKey(d); };
  const list = [];
  route.phases.forEach((p, i) => {
    share += p.share;
    if (done[i] < p.steps.length && i < route.phases.length - 1)
      list.push({ day: at(share), kind: "Etappe geschafft bis (geschätzt)", title: p.title });
  });
  list.push({ day: at(1), kind: "Ziel erreicht (geschätzt)", title: quest.title });
  return list;
}

// Alles, was an einem Tag ansteht. „fixed“ enthält die Termine aus Weg und Geld.
function fixedDates() {
  return [...questDates().map(x => ({ ...x, view: "way", run: () => go("way") })), ...host.dates()];
}
function entries(day, fixed = fixedDates()) {
  const today = dayKey(), list = [];
  for (const task of tasksFor(day)) list.push({ view: "plan", kind: "Aufgabe", title: task.title, time: task.time, task,
    done: task.done.includes(day), run: () => start(task),
    toggle: day === today && (() => { task.done.includes(day) ? undo(task) : finish(task, false); render(); }) });
  const { profile, log, mood } = state.sport;
  if (profile) {
    const logged = log.find(x => x.day === day);
    const planned = weekPlan(profile).find(d => d.day === weekIndex(fromKey(day)));
    const sick = day === today && mood.day === day && mood.value === "sick";
    if (logged || (planned && day >= today && !sick)) {
      const type = (logged || planned).type, slot = weekPlan(profile).findIndex(d => d === planned || d.day === planned?.day);
      const moves = planned ? session(profile, type, Math.max(0, slot), state.sport.adjust, false, fromKey(day)).exercises
        .filter(e => e.part === "Hauptteil").map(e => e.name) : [];
      list.push({ view: "sport", kind: `Training · ca. ${profile.minutes} Min.`, time: profile.time,
        title: SPORT_TYPES[type][0], detail: moves.join(", "), done: !!logged, run: () => go("sport") });
    }
  }
  const now = currentQuest();
  if (day === today && now && now.next >= 0) {
    const station = now.route.phases[now.next];
    const s = station.steps.findIndex((_, i) => !now.quest.done.includes(`${now.next}-${i}`));
    list.push({ view: "way", kind: `Nächster Quest-Schritt · Station ${now.next + 1}`, title: station.steps[s], done: false,
      run: () => go("way"), toggle: () => toggleStep(`${now.next}-${s}`, now.next, station) });
  }
  const money = day === today ? host.moneyStep() : null;
  if (money) {
    const view = money[0].startsWith("Zeit für eine Sicherung") ? "settings" : "home";
    list.push({ view, kind: view === "home" ? "Geld" : "Sicherung", title: money[0], done: false, run: money[2] });
  }
  // Was der Geld-Hinweis von heute schon sagt, nicht doppelt zeigen.
  list.push(...fixed.filter(x => x.day === day && !(money && (x.month || x.due))).map(x => ({ done: false, ...x })));
  return list.filter(e => wants(e.view)).sort((a, b) => (toMinutes(a.time) ?? 2000) - (toMinutes(b.time) ?? 2000));
}

function entryRow(e, { next = false, extra = [] } = {}) {
  const row = el("div", { className: "entry" + (e.done ? " done" : "") + (next ? " next" : "") });
  row.dataset.to = e.view;
  const text = button("", e.run, "text");
  text.append(small([next && "Als Nächstes", e.kind, e.time].filter(Boolean).join(" · ")), el("b", { textContent: e.title }));
  if (e.detail && current === "plan") text.append(el("span", { className: "detail", textContent: e.detail }));
  let action;
  if (e.toggle) {
    action = button(e.done ? "✓" : "", e.toggle, "check");
    action.ariaLabel = e.done ? `${e.title} wieder offen` : `${e.title} erledigt`;
  } else {
    action = button(e.done ? "✓" : "›", e.run, "go");
    action.ariaLabel = `${e.title} öffnen`;
  }
  const body = el("div", { className: "body" }, text, ...(extra.length ? [el("div", { className: "extra" }, ...extra)] : []));
  row.append(el("span", { className: "ic" }, menuIcon(e.view)), body, action);
  return row;
}

// ---------- Heute ----------
let showAll = false;
// Begleiter-Satz und kurze Frage nach der Energie – danach richtet sich der Tag.
function buddyCard(open, all) {
  const energy = energyToday();
  const pickEnergy = value => () => {
    state.me.energy = { day: dayKey(), value };
    state.sport.mood = { day: dayKey(), value: value === "low" ? "tired" : "fit" };
    showAll = false; save(); render();
  };
  return card("buddy-card", el("p", { className: "bubble" }, el("small", { textContent: buddyName() }),
    el("span", { textContent: buddySays(open, all) })),
    !energy && small("Wie viel Energie hast du heute?"),
    !energy && el("div", { className: "moods" }, ...Object.entries(ENERGY).map(([value, text]) => button(text, pickEnergy(value), ""))),
    energy && button(`Energie heute: ${ENERGY[energy]} · ändern`, pickEnergy(""), "quiet"));
}
// „Nur 5 Minuten“: kleiner Einstieg für Aufgaben.
function fiveMinutes(task) {
  run = { task: { ...task, guide: "" }, key: "", step: 0, helped: false, help: false, left: 0, end: 0, real: task };
  render(true);
}
function todayPage() {
  if (!state.me.done) return meQuestions();
  if (chatOpen) return chatPage();
  const day = dayKey(), all = entries(day), open = all.filter(e => !e.done), has = key => state.me.struggles.includes(key);
  const light = state.lightDay === day, low = energyToday() === "low";
  const parts = [playerCard(host.profile().name, open.length), buddyCard(open, all), label("Heute zu tun")];
  if (light) {
    const one = open.filter(e => e.task).sort((a, b) => duration(a.task) - duration(b.task))[0] || open[0];
    return [...parts, one ? entryRow(one, { next: true }) : card("", "Alles geschafft."),
      card("", "Alles andere darf heute warten."),
      button("Doch alles zeigen", () => { state.lightDay = ""; save(); render(); }, "btn alt")];
  }
  const counts = Object.keys(TOPICS).map(view => [view, open.filter(e => e.view === view).length]).filter(([, n]) => n);
  if (counts.length) parts.push(el("div", { className: "topics" }, ...counts.map(([view, n]) => {
    const chip = el("span", {}, el("b", { textContent: n }), ` ${TOPICS[view][n === 1 ? 0 : 1]}`);
    chip.dataset.to = view;
    return chip;
  })));
  if (has("time") && open.length) {
    const minutes = open.reduce((sum, e) => sum + (e.task ? duration(e.task) : e.view === "sport" ? Number(state.sport.profile.minutes) : 10), 0);
    parts.push(card("sand", el("p", { textContent: `⏱ Plane heute ungefähr ${minutes} Minuten ein.` })));
  }
  if (!open.length) parts.push(card("big", el("strong", { textContent: all.length ? "Alles geschafft." : "Nichts geplant." }),
    small(all.length ? "Der Rest vom Tag gehört dir." : "Genieß es, oder trag im Kalender etwas ein.")));
  // Wenig Energie: das Leichteste zuerst und nur zwei. Wird schnell alles zu viel: höchstens drei.
  const ordered = low ? [...open].sort((a, b) => (a.task ? duration(a.task) : 60) - (b.task ? duration(b.task) : 60)) : open;
  const limit = state.settings.single ? 1 : low ? 2 : has("much") ? 3 : Infinity;
  const shown = showAll ? ordered : ordered.slice(0, limit);
  parts.push(...shown.map((e, i) => entryRow(e, { next: i === 0, extra: i === 0 && e.task && e.toggle && has("start")
    ? [button("Nur 5 Minuten anfangen", () => fiveMinutes(e.task), "quiet")] : [] })));
  if (ordered.length > limit) parts.push(button(showAll ? "Wieder weniger zeigen" : `Noch ${ordered.length - limit} weitere zeigen`,
    () => { showAll = !showAll; render(); }, "quiet center"));
  if (!state.settings.single) parts.push(...all.filter(e => e.done).map(e => entryRow(e)));
  if (open.length > 1) parts.push(button("Heute ist mir zu viel",
    () => { state.lightDay = day; save(); render(true); }, "quiet center"));
  parts.push(button("Zum Kalender", () => go("plan"), "btn alt"),
    button(`💬 Frag ${buddyName()} (KI)`, () => { chatOpen = true; render(true); }, "btn alt"));
  if (has("forget") && !state.settings.remind) parts.push(card("lav", el("p", { textContent: "Du vergisst manchmal Dinge. Soll ich dich erinnern, solange die App offen ist?" }),
    button("Erinnerungen einschalten", async () => {
      state.settings.remind = true; save();
      if ("Notification" in window && Notification.permission === "default")
        try { await Notification.requestPermission(); } catch { /* bleibt aus */ }
      render();
    }, "btn alt")));
  const hint = insights()[0];
  if (hint) parts.push(suggestion(hint));
  parts.push(label("Deine Woche"), ...toolCards(), weekCard());
  return parts;
}
// ---------- Kalender ----------
let calMonth = "";
function planPage() {
  const today = dayKey();
  if (!calMonth) calMonth = planDay.slice(0, 7);
  const [year, month] = calMonth.split("-").map(Number);
  const first = new Date(year, month - 1, 1, 12), fixed = fixedDates();
  const heading = first.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
  const move = step => () => {
    const d = new Date(year, month - 1 + step, 1, 12);
    calMonth = dayKey(d).slice(0, 7);
    planDay = calMonth === today.slice(0, 7) ? today : dayKey(d);
    render();
  };
  const arrow = (symbol, step, name) => { const b = button(symbol, move(step), "turn"); b.ariaLabel = name; return b; };
  const grid = el("div", { className: "month" }, ...["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
    .map(name => el("span", { textContent: name })));
  const offset = weekIndex(first), count = new Date(year, month, 0).getDate();
  for (let i = 0; i < offset; i++) grid.append(el("i"));
  for (let n = 1; n <= count; n++) {
    const key = `${calMonth}-${pad(n)}`, list = entries(key, fixed);
    const topics = [...new Set(list.map(e => e.view))].slice(0, 4);
    const b = button("", () => { planDay = key; render(); }, key === today ? "today" : "");
    b.append(el("b", { textContent: n }), el("span", { className: "dots-row" }, ...topics.map(view => {
      const dot = el("i"); dot.dataset.to = view; return dot;
    })));
    b.setAttribute("aria-pressed", key === planDay);
    b.ariaLabel = `${n}. ${heading}, ${list.length === 1 ? "1 Eintrag" : `${list.length} Einträge`}`;
    grid.append(b);
  }
  const list = entries(planDay, fixed).map(e => {
    const task = e.task;
    if (!task) return entryRow(e);
    return entryRow({ ...e, kind: REPEATS[task.repeat] }, { extra: [
      task.repeat !== "once" && button("Diesmal auslassen", () => { task.skip.push(planDay); save(); render(); }, "quiet"),
      button("Löschen", () => {
        if (!confirm(`„${task.title}“ ganz löschen?`)) return;
        state.tasks.splice(state.tasks.indexOf(task), 1); save(); render();
      }, "quiet")].filter(Boolean) });
  });
  const what = el("input", { required: true, maxLength: 80, placeholder: "z. B. Zimmer lüften" });
  const guides = select({ "": "Ohne Anleitung", ...Object.fromEntries(Object.entries(GUIDES)
    .map(([k, g]) => [k, g.title])) }, "");
  guides.addEventListener("change", () => { if (guides.value) what.value = GUIDES[guides.value].title; });
  const time = el("input", { type: "time" });
  const repeat = select(REPEATS, "once");
  const form = el("form", {}, field("Mit Anleitung?", guides), field("Was?", what), field("Uhrzeit (wenn du magst)", time),
    field("Wie oft?", repeat), el("button", { className: "btn", textContent: "Eintragen" }));
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!what.value.trim()) return;
    state.tasks.push({ id: newId(), title: what.value.trim(), time: time.value, repeat: repeat.value,
      date: planDay, guide: guides.value, done: [], skip: [] });
    save(); render();
  });
  return [...title("Kalender", "Alles aus allen Bereichen, automatisch eingetragen."),
    card("calendar", el("div", { className: "head" }, arrow("‹", -1, "Voriger Monat"), el("h3", { textContent: heading }),
      arrow("›", 1, "Nächster Monat")), grid,
      el("div", { className: "topics legend-row" }, ...["plan", "sport", "way", "home"].filter(wants).map(view => {
        const chip = el("span", { textContent: TOPICS[view][1] }); chip.dataset.to = view; return chip;
      }))),
    label(fromKey(planDay).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })),
    ...(list.length ? list : [card("", "Für diesen Tag ist nichts geplant.")]),
    planDay >= today && el("details", { className: "card add", open: !list.length },
      el("summary", { textContent: "＋ Neue Aufgabe" }), form)];
}
// Eigene Werkzeuge: Wochenziel zum Hochzählen (Sport, Weiterbildung, Wasser …).
const weekStart = () => { const d = new Date(); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return dayKey(d); };
function toolCards() {
  return state.tools.map(tool => {
    const count = tool.log.filter(d => d >= weekStart()).length;
    const bar = el("i"); bar.style.width = Math.min(100, count / tool.target * 100) + "%";
    return card("", small("Diese Woche"), el("h3", { textContent: `${tool.title}: ${count} von ${tool.target}` }),
      el("div", { className: "bar" }, bar), el("div", { className: "chips" },
        button("+ 1", () => { tool.log.push(dayKey()); save(); chime(); burst(12); render(); }, ""),
        count > 0 && button("Zurücknehmen", () => { tool.log.pop(); save(); render(); }, "")));
  });
}
// Wohin gehen die 168 Stunden? Schlaf wird mit 8 Stunden pro Nacht angenommen.
function weekCard() {
  const { dayHours, weekDays } = host.profile();
  const work = Math.min(112, dayHours * weekDays);
  let planned = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    planned += tasksFor(dayKey(d)).reduce((sum, t) => sum + duration(t), 0) / 60;
  }
  planned = Math.round(Math.min(planned, 112 - work) * 2) / 2;
  const free = 112 - work - planned;
  const shade = share => `color-mix(in srgb,var(--accent) ${share}%,#fff)`;
  const parts = [["Schlaf (angenommen)", 56, "#b9b6c4"], ["Arbeit", work, shade(72)],
    ["Geplante Aufgaben", planned, shade(40)], ["Zeit für dich", free, "var(--accent)"]];
  return card("", el("h3", { textContent: "Meine Woche" }), el("div", { className: "stack" }, ...parts.map(([, hours, colour]) => {
    const piece = el("i"); piece.style.cssText = `width:${hours / 168 * 100}%;background:${colour}`; return piece;
  })), ...parts.map(([label, hours, colour]) => {
    const dot = el("i"); dot.style.background = colour;
    return el("p", { className: "key" }, dot, el("span", { textContent: label }),
      el("b", { textContent: `${hours.toLocaleString("de-DE")} Std.` }));
  }), !work && small("Arbeitszeiten trägst du unter Geld → Zeit wert? ein."));
}
function suggestion(hint) {
  const answer = yes => {
    if (yes) hint.run(); else { hint.no?.(); state.dismissed.push(hint.id); }
    save(); render();
  };
  return card("lav", el("p", { textContent: hint.text }), el("div", { className: "chips" },
    button(hint.yes, () => answer(true), ""), button("So lassen", () => answer(false), "")));
}

// ---------- Anleitung Schritt für Schritt ----------
function start(task, guideKey) {
  run = { task, key: guideKey || task?.guide || "", step: 0, helped: false, help: false, left: 0, end: 0 };
  render(true);
}
function runPage() {
  const guide = GUIDES[run.key], task = run.real || run.task;
  const close = button("Zurück", () => { run = null; render(true); }, "quiet");
  const done = () => {
    if (task) finish(task, run.helped);
    else { state.history.push({ ref: run.key, day: dayKey(), minute: minutesNow(), helped: run.helped }); save(); chime(); }
    run = null; host.show("today");
  };
  if (!guide) return [close, ...title(task.title, "Nur diese eine Sache."),
    card("big", el("strong", { textContent: "Fang klein an." }), small("Fünf Minuten zählen auch.")),
    timerCard(5), button("Erledigt", done)];
  if (state.short[run.key]) return [close, ...title(guide.title, "Kurze Fassung"),
    card("", ...guide.steps.map(s => el("p", { textContent: "• " + s.title, style: "padding:5px 0" }))),
    guide.timer && timerCard(guide.minutes), button("Alles erledigt", done),
    button("Wieder ausführlich zeigen", () => { state.short[run.key] = false; save(); render(); }, "btn alt")];
  const s = guide.steps[run.step], last = run.step === guide.steps.length - 1;
  return [close, ...title(guide.title, `Schritt ${run.step + 1} von ${guide.steps.length}`),
    el("div", { className: "dots" }, ...guide.steps.map((_, i) => el("i", { className: i <= run.step ? "on" : "" }))),
    picture(guide.icon), card("big", el("strong", { textContent: s.title, style: "margin-bottom:6px" }), el("p", { textContent: s.text })),
    run.help && card("sand", small("So geht es leichter"), el("p", { textContent: s.help }),
      el("small", { textContent: "Du darfst auch kurz Pause machen oder jemanden fragen.", style: "margin-top:8px" })),
    guide.timer && last && timerCard(guide.minutes),
    button(last ? "Fertig" : "Fertig, weiter", () => {
      if (last) return done();
      run.step++; run.help = false; render(true);
    }),
    !run.help && button("Ich brauche Hilfe", () => { run.help = run.helped = true; render(); }, "btn alt")];
}
function timerCard(minutes) {
  const shown = el("p", { className: "time" });
  const draw = () => {
    const left = run.end ? Math.max(0, Math.ceil((run.end - Date.now()) / 1000)) : run.left || minutes * 60;
    shown.textContent = `${pad(Math.floor(left / 60))}:${pad(left % 60)}`;
    if (run.end && !left) { run.end = 0; run.left = 0; clearInterval(timer); chime(); control.textContent = "Fertig – Pause verdient"; }
  };
  const control = button(run.end ? "Anhalten" : "Timer starten", () => {
    if (run.end) { run.left = Math.max(1, Math.ceil((run.end - Date.now()) / 1000)); run.end = 0; }
    else { run.end = Date.now() + (run.left || minutes * 60) * 1000; }
    render();
  }, "btn alt");
  draw();
  if (run.end) timer = setInterval(draw, 500);
  return card("", shown, control);
}

// ---------- Plan ----------
// ---------- Mein Weg (Spielkarte) ----------
let openStage = 0;
let showGuides = false;
function wayPage() {
  if (wizard) return wizardPage();
  const cheer = state.cheer;
  state.cheer = "";
  const shown = openStage || state.stage;
  const stages = !showGuides ? [] : [...STAGES.map(([name, what, age], i) => {
    const n = i + 1;
    const b = button("", () => { openStage = n; render(); }, "stage" + (n === state.stage ? " here" : ""));
    b.append(el("b", { textContent: n < state.stage ? "✓" : n }), el("span", {},
      el("h3", { textContent: `Stufe ${n} · ${name}` }), small(what), small(age)));
    b.setAttribute("aria-expanded", n === shown);
    return b;
  }), card("green", el("h2", { textContent: `Anleitungen: ${STAGES[shown - 1][0]}` }),
    el("div", { className: "chips" }, ...Object.entries(GUIDES).filter(([, g]) => g.stage === shown)
      .map(([key, g]) => button(g.title, () => start(null, key), ""))),
    shown !== state.stage && button("Das ist jetzt meine Stufe", () => { state.stage = shown; save(); render(); }))];
  return [...title("Dein Weg", "Station für Station zu deinem Ziel."),
    cheer && card("sand cheer", `🎉 ${cheer}`), ...questMap(),
    ...insights().filter(h => h.id.startsWith("stage")).map(suggestion),
    button(showGuides ? "Alltags-Anleitungen ausblenden" : "Alltags-Anleitungen und Stufen",
      () => { showGuides = !showGuides; render(); }, "btn alt"), ...stages];
}

// ---------- Einstellungen zum Alltag ----------
function toggle(label, key, after) {
  const box = el("input", { type: "checkbox", checked: state.settings[key] });
  box.addEventListener("change", async () => { state.settings[key] = box.checked; if (after) await after(box); save(); render(); });
  return el("label", { className: "switch" }, el("span", { textContent: label }), box);
}
function mePage() {
  const quiet = el("input", { type: "time", value: state.settings.quiet });
  quiet.addEventListener("change", () => { if (quiet.value) { state.settings.quiet = quiet.value; save(); } });
  const name = el("input", { required: true, maxLength: 60, placeholder: "z. B. Sport" });
  const target = el("input", { type: "number", min: 1, max: 50, value: 3 });
  const form = el("form", {}, field("Neues Werkzeug", name), field("Wie oft pro Woche?", target),
    el("button", { className: "btn", textContent: "Hinzufügen" }));
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!name.value.trim()) return;
    state.tools.push({ id: newId(), title: name.value.trim(), target: Math.max(1, Math.min(50, Number(target.value) || 1)), log: [] });
    save(); render();
  });
  const learned = [
    ...Object.entries(state.short).filter(([, on]) => on).map(([key]) =>
      [`„${GUIDES[key].title}“ wird kurz angezeigt.`, () => { delete state.short[key]; }]),
    ...(state.history.length ? [[`${state.history.length} erledigte Aufgaben mit Uhrzeit (für Vorschläge).`,
      () => { state.history = []; state.dismissed = []; }]] : [])];
  return [meCard(), aiCard(),
    card("", el("h3", { textContent: "Heute" }), toggle("Nur eine Aufgabe zeigen", "single"), toggle("Töne", "sound", () => chime())),
    card("", el("h3", { textContent: "Aufgaben-Erinnerungen" }),
      toggle("Erinnern, wenn etwas dran ist", "remind", async box => {
        if (box.checked && "Notification" in window && Notification.permission === "default")
          try { await Notification.requestPermission(); } catch { /* bleibt aus */ }
      }), field("Ruhe ab", quiet), small("Höchstens 3 am Tag, nur solange die App offen ist oder im Hintergrund läuft.")),
    card("", el("h3", { textContent: "Eigene Werkzeuge" }),
      ...state.tools.map(tool => el("div", { className: "item" }, el("span", { className: "title", textContent: `${tool.title} · ${tool.target}× pro Woche` }),
        button("✕", () => { if (confirm(`„${tool.title}“ löschen?`)) { state.tools.splice(state.tools.indexOf(tool), 1); save(); render(); } }, "quiet"))), form),
    card("", el("h3", { textContent: "Was die App gelernt hat" }), small("Alles bleibt auf deinem Gerät."),
      ...(learned.length ? learned.map(([text, forget]) => el("div", { className: "item" },
        el("span", { className: "title", textContent: text }),
        button("Löschen", () => { forget(); save(); render(); }, "quiet"))) : [small("Noch nichts gelernt.")])),
    el("p", { className: "sub", textContent: "Hilfe im Alltag, keine Therapie. Geht es dir schlecht, sprich mit jemandem, dem du vertraust. Im Notfall: 112." })];
}
const PAGES = { today: todayPage, plan: planPage, way: wayPage, sport: sportPage, me: mePage };

// ---------- Ton und Erinnerungen ----------
function chime() {
  if (!state.settings.sound) return;
  try {
    const audio = new AudioContext(), tone = audio.createOscillator(), volume = audio.createGain();
    tone.frequency.value = 528; volume.gain.setValueAtTime(.08, audio.currentTime);
    volume.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .6);
    tone.connect(volume).connect(audio.destination); tone.start(); tone.stop(audio.currentTime + .6);
    tone.onended = () => audio.close();
  } catch { /* ohne Ton */ }
}
function dueReminder() {
  const day = dayKey(), now = minutesNow();
  if (!state.ready || !state.settings.remind || state.lightDay === day) return null;
  if (now >= toMinutes(state.settings.quiet)) return null;
  if (state.notified.filter(n => n.startsWith(day)).length >= 3) return null;
  return tasksFor(day).find(t => {
    const at = toMinutes(t.time);
    return at !== null && now >= at && now - at < 30 && !t.done.includes(day) && !state.notified.includes(`${day} ${t.id}`);
  }) || null;
}
async function remind() {
  const task = host.locked() ? null : dueReminder();
  if (!task || !("Notification" in window) || Notification.permission !== "granted") return;
  state.notified.push(`${dayKey()} ${task.id}`); save();
  const options = { body: `Jetzt dran: ${task.title}`, tag: task.id, icon: "icon-192.png" };
  try {
    const worker = await navigator.serviceWorker?.getRegistration();
    if (worker?.active) await worker.showNotification("Life Control", options);
    else new Notification("Life Control", options);
  } catch { /* Benachrichtigung nicht möglich */ }
}

setInterval(remind, 30000);
let shownDay = dayKey();
document.addEventListener("visibilitychange", () => {   // neuer Tag: Ansicht auffrischen
  if (!document.hidden && dayKey() !== shownDay) { shownDay = planDay = dayKey(); run = null; render(); }
});


const SAMPLE = () => clean({ me: { done: true, buddy: "fox", buddyName: "Flo" }, ready: true, stage: 3, xp: 80, tasks: [
    { title: "Einkaufen", time: "17:30", repeat: "daily", guide: "shopping" },
    { title: "Zimmer aufräumen", time: "18:30", repeat: "daily", guide: "room" }],
  tools: [{ title: "Sport", target: 3, log: [dayKey()] }],
  quest: { type: "save", title: "Neues Fahrrad", answers: { price: "400", have: "100", monthly: "50" }, route: "plain",
    done: ["0-0", "0-1"] },
  sport: { profile: { ageYears: 30, weight: 70, height: 172, level: "2", goal: "all", minutes: "20", place: "home", days: [0, 1, 2, 3, 4, 5], equipment: ["dumbbell", "band"], limits: [] } },
  food: { entries: [{ day: dayKey(), name: "Müsli mit Obst", kcal: 380, protein: 14, fiber: 8 }], water: { [dayKey()]: 750 }, steps: { [dayKey()]: 4200 } } });
return {
  open(next) {
    const moved = current !== next; current = next; run = null; wizard = null; openNode = null; openStage = 0; sportForm = null; sportRun = null; planDay = dayKey(); calMonth = ""; showAll = false; meForm = null; foodDraft = null; chatOpen = false; sportTab = "training"; applyAreas();
    render(); if (moved) intro(next && next !== "me" ? document.getElementById(next) : null);
  },
  render, ensure() { ensure(); render(); },
  dump: () => state,
  load(data) { if (Array.isArray(data?.tasks)) { state = clean(data); save(); render(); } },
  reset() { state = clean(null); try { localStorage.removeItem(AI_STORE); } catch { /* nichts gespeichert */ } chat = null; save(); },
  demo() { state = SAMPLE(); render(); },
};
}
