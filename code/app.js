/* ============================================
   app.js – Logik für den Data Analyzer
   Liest CSV / Excel direkt im Browser ein,
   berechnet Kennzahlen und zeigt Diagramm + Tabelle.
   ============================================ */

// --- Globale Zustände ---
let aktuelleDaten = [];   // Array von Objekten (eine Zeile pro Eintrag)
let spaltenNamen = [];    // Reihenfolge der Spalten
let chartInstanz = null;  // aktuelles Chart.js-Diagramm

// --- DOM-Referenzen ---
const fileInput = document.getElementById("fileInput");
const uploadBox = document.getElementById("uploadBox");
const dateinameEl = document.getElementById("dateiname");
const spaltenwahlSection = document.getElementById("spaltenwahlSection");
const spalteSelect = document.getElementById("spalteSelect");
const kennzahlenSection = document.getElementById("kennzahlenSection");
const kartenEl = document.getElementById("karten");
const diagrammSection = document.getElementById("diagrammSection");
const tabelleSection = document.getElementById("tabelleSection");
const datenTabelle = document.getElementById("datenTabelle");

// --- Datei-Auswahl per Klick ---
fileInput.addEventListener("change", (e) => {
    const datei = e.target.files[0];
    if (datei) ladeDatei(datei);
});

// --- Drag & Drop ---
["dragenter", "dragover"].forEach(ev => {
    uploadBox.addEventListener(ev, (e) => {
        e.preventDefault();
        uploadBox.classList.add("dragover");
    });
});
["dragleave", "drop"].forEach(ev => {
    uploadBox.addEventListener(ev, (e) => {
        e.preventDefault();
        uploadBox.classList.remove("dragover");
    });
});
uploadBox.addEventListener("drop", (e) => {
    const datei = e.dataTransfer.files[0];
    if (datei) {
        fileInput.value = "";
        ladeDatei(datei);
    }
});

/**
 * Lädt eine Datei und entscheidet je nach Endung
 * zwischen CSV- und Excel-Parser.
 */
function ladeDatei(datei) {
    dateinameEl.textContent = "Datei: " + datei.name;
    const endung = datei.name.split(".").pop().toLowerCase();
    const reader = new FileReader();

    reader.onerror = () => zeigeFehler("Datei konnte nicht gelesen werden.");

    if (endung === "csv" || endung === "tsv" || endung === "txt") {
        reader.onload = (e) => {
            try {
                const trenner = endung === "tsv" ? "\t" : erkenneTrenner(e.target.result);
                const daten = parseCSV(e.target.result, trenner);
                verarbeiteDaten(daten);
            } catch (err) {
                zeigeFehler("CSV konnte nicht verarbeitet werden: " + err.message);
            }
        };
        reader.readAsText(datei);
    } else if (endung === "xlsx" || endung === "xls") {
        reader.onload = (e) => {
            try {
                const workbook = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const daten = XLSX.utils.sheet_to_json(sheet, { defval: "" });
                verarbeiteDaten(daten);
            } catch (err) {
                zeigeFehler("Excel-Datei konnte nicht gelesen werden: " + err.message);
            }
        };
        reader.readAsArrayBuffer(datei);
    } else {
        zeigeFehler("Format nicht unterstützt: ." + endung);
    }
}

/**
 * Erkennt den Spaltentrenner einer CSV (Komma oder Semikolon).
 */
function erkenneTrenner(text) {
    const erstZeile = text.split(/\r?\n/)[0] || "";
    const kommas = (erstZeile.match(/,/g) || []).length;
    const semis = (erstZeile.match(/;/g) || []).length;
    return semis > kommas ? ";" : ",";
}

/**
 * Einfacher CSV-Parser mit Unterstützung für Anführungszeichen.
 * Gibt ein Array von Objekten zurück (Schlüssel = Spaltenüberschriften).
 */
function parseCSV(text, trenner) {
    const zeilen = text.split(/\r?\n/).filter(z => z.length > 0);
    if (zeilen.length === 0) return [];

    const splitZeile = (zeile) => {
        const ergebnis = [];
        let aktuell = "";
        let inQuotes = false;
        for (let i = 0; i < zeile.length; i++) {
            const c = zeile[i];
            if (c === '"' ) {
                if (inQuotes && zeile[i + 1] === '"') { aktuell += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (c === trenner && !inQuotes) {
                ergebnis.push(aktuell);
                aktuell = "";
            } else {
                aktuell += c;
            }
        }
        ergebnis.push(aktuell);
        return ergebnis;
    };

    const kopf = splitZeile(zeilen[0]).map(s => s.trim());
    const daten = [];
    for (let i = 1; i < zeilen.length; i++) {
        const werte = splitZeile(zeilen[i]);
        const obj = {};
        kopf.forEach((spalte, idx) => {
            obj[spalte] = (werte[idx] ?? "").trim();
        });
        daten.push(obj);
    }
    return daten;
}

/**
 * Speichert die Daten, befüllt die Spaltenauswahl
 * und stößt die Auswertung an.
 */
function verarbeiteDaten(daten) {
    entferneFehler();
    if (!daten || daten.length === 0) {
        zeigeFehler("Datei enthält keine Daten.");
        return;
    }
    aktuelleDaten = daten;
    spaltenNamen = Object.keys(daten[0]);

    fuelleSpaltenAuswahl();
    zeigeTabelle();

    // Sektionen sichtbar machen
    spaltenwahlSection.hidden = false;
    tabelleSection.hidden = false;

    // Erste numerische Spalte auswählen und analysieren
    const ersteNumerische = spaltenNamen.find(sp => istNumerischeSpalte(sp));
    if (ersteNumerische) {
        spalteSelect.value = ersteNumerische;
        analysiereSpalte(ersteNumerische);
    } else {
        kennzahlenSection.hidden = true;
        diagrammSection.hidden = true;
        zeigeFehler("Keine numerische Spalte gefunden – nur Tabelle wird angezeigt.");
    }
}

/**
 * Füllt das Dropdown mit allen Spalten;
 * markiert nur numerische als auswählbar (Textspalten werden grau).
 */
function fuelleSpaltenAuswahl() {
    spalteSelect.innerHTML = "";
    spaltenNamen.forEach(sp => {
        const option = document.createElement("option");
        option.value = sp;
        const numerisch = istNumerischeSpalte(sp);
        option.textContent = numerisch ? sp : sp + "  (nicht numerisch)";
        option.disabled = !numerisch;
        spalteSelect.appendChild(option);
    });
    spalteSelect.onchange = () => analysiereSpalte(spalteSelect.value);
}

/**
 * Prüft, ob in einer Spalte überwiegend Zahlen stehen.
 */
function istNumerischeSpalte(spalte) {
    let zahlen = 0;
    let gesamt = 0;
    for (const zeile of aktuelleDaten) {
        const wert = zeile[spalte];
        if (wert === "" || wert === null || wert === undefined) continue;
        gesamt++;
        if (!isNaN(parseFloat(String(wert).replace(",", ".")))) zahlen++;
    }
    return gesamt > 0 && zahlen / gesamt >= 0.7;
}

/**
 * Wandelt einen Wert in eine Zahl um (akzeptiert "," als Dezimaltrenner).
 */
function zuZahl(wert) {
    if (wert === "" || wert === null || wert === undefined) return NaN;
    return parseFloat(String(wert).replace(",", "."));
}

/**
 * Berechnet Kennzahlen + zeichnet Diagramm für eine Spalte.
 */
function analysiereSpalte(spalte) {
    const werte = aktuelleDaten
        .map(z => zuZahl(z[spalte]))
        .filter(w => !isNaN(w));

    if (werte.length === 0) {
        zeigeFehler("Spalte enthält keine gültigen Zahlen.");
        return;
    }

    const kennzahlen = berechneKennzahlen(werte);
    rendereKarten(kennzahlen);
    zeichneHistogramm(werte, spalte, kennzahlen._min, kennzahlen._max);

    kennzahlenSection.hidden = false;
    diagrammSection.hidden = false;
}

/**
 * Statistische Kennzahlen: Anzahl, Min, Max, Mittelwert,
 * Median, Standardabweichung, Summe.
 */
function berechneKennzahlen(werte) {
    const n = werte.length;
    // Schleifen statt Math.min(...werte) / werte.reduce(...) mit Spread,
    // damit auch große Dateien (>100k Zeilen) keinen Stack-Overflow auslösen.
    let summe = 0;
    let min = werte[0];
    let max = werte[0];
    for (let i = 0; i < n; i++) {
        const w = werte[i];
        summe += w;
        if (w < min) min = w;
        if (w > max) max = w;
    }
    const mittel = summe / n;

    const sortiert = werte.slice().sort((a, b) => a - b);
    const median = n % 2 === 0
        ? (sortiert[n / 2 - 1] + sortiert[n / 2]) / 2
        : sortiert[Math.floor(n / 2)];

    let varSumme = 0;
    for (let i = 0; i < n; i++) {
        const d = werte[i] - mittel;
        varSumme += d * d;
    }
    const stdAbw = Math.sqrt(varSumme / n);

    return {
        "Anzahl": n,
        "Minimum": formatZahl(min),
        "Maximum": formatZahl(max),
        "Mittelwert": formatZahl(mittel),
        "Median": formatZahl(median),
        "Std.-Abw.": formatZahl(stdAbw),
        "Summe": formatZahl(summe),
        // interne Werte (nicht angezeigt) für das Histogramm:
        _min: min,
        _max: max
    };
}

function formatZahl(z) {
    if (!isFinite(z)) return "-";
    if (Math.abs(z) >= 1000) return z.toLocaleString("de-DE", { maximumFractionDigits: 2 });
    return z.toLocaleString("de-DE", { maximumFractionDigits: 4 });
}

/**
 * Rendert die Kennzahlen-Karten.
 */
function rendereKarten(kennzahlen) {
    kartenEl.innerHTML = "";
    for (const [label, wert] of Object.entries(kennzahlen)) {
        if (label.startsWith("_")) continue; // interne Felder überspringen
        const karte = document.createElement("div");
        karte.className = "karte";
        karte.innerHTML = `
            <span class="label">${label}</span>
            <span class="wert">${wert}</span>
        `;
        kartenEl.appendChild(karte);
    }
}

/**
 * Zeichnet ein Histogramm der Werteverteilung.
 */
function zeichneHistogramm(werte, spalte, min, max) {
    // min/max werden übergeben, damit Math.min(...werte) bei großen Arrays
    // keinen Stack-Overflow erzeugt.
    const anzahlBuckets = Math.min(20, Math.max(5, Math.round(Math.sqrt(werte.length))));
    const bucketBreite = (max - min) / anzahlBuckets || 1;

    const buckets = new Array(anzahlBuckets).fill(0);
    const labels = [];
    for (let i = 0; i < anzahlBuckets; i++) {
        const von = min + i * bucketBreite;
        labels.push(formatZahl(von));
    }
    for (let i = 0; i < werte.length; i++) {
        let idx = Math.floor((werte[i] - min) / bucketBreite);
        if (idx >= anzahlBuckets) idx = anzahlBuckets - 1;
        if (idx < 0) idx = 0;
        buckets[idx]++;
    }

    if (chartInstanz) chartInstanz.destroy();
    const ctx = document.getElementById("chart").getContext("2d");
    chartInstanz = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: `Häufigkeit – ${spalte}`,
                data: buckets,
                backgroundColor: "#2980b9",
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true } },
            scales: {
                x: { title: { display: true, text: spalte } },
                y: { beginAtZero: true, title: { display: true, text: "Anzahl" } }
            }
        }
    });
}

/**
 * Zeigt die ersten 50 Zeilen als Tabelle.
 */
function zeigeTabelle() {
    const maxZeilen = Math.min(50, aktuelleDaten.length);
    let html = "<thead><tr>";
    spaltenNamen.forEach(sp => html += `<th>${sp}</th>`);
    html += "</tr></thead><tbody>";
    for (let i = 0; i < maxZeilen; i++) {
        html += "<tr>";
        spaltenNamen.forEach(sp => {
            html += `<td>${aktuelleDaten[i][sp] ?? ""}</td>`;
        });
        html += "</tr>";
    }
    html += "</tbody>";
    datenTabelle.innerHTML = html;
}

/**
 * Zeigt eine Fehlermeldung im Upload-Bereich.
 */
function zeigeFehler(nachricht) {
    entferneFehler();
    const div = document.createElement("div");
    div.className = "fehler";
    div.id = "fehlerBox";
    div.textContent = nachricht;
    uploadBox.parentElement.appendChild(div);
}

function entferneFehler() {
    const alt = document.getElementById("fehlerBox");
    if (alt) alt.remove();
}
