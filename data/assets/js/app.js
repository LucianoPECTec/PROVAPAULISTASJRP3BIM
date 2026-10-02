const BASE = window.PROVA_PAULISTA;
const UP = {
  url: "COLE_AQUI_A_URL_DO_APPS_SCRIPT_TERMINANDO_EM_/exec"
};

const $ = s => document.querySelector(s);
const N = "pt-BR";

const st = {
  meta: 0.51,
  q: "",
  sit: "",
  comp: "geral",
  key: "rk",
  dir: 1,
  v: "painel"
};

const pc = v =>
  v == null ? "" :
  (v * 100).toLocaleString(N, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + "%";

const SN = [
  "Acima da Meta",
  "Próxima da Meta",
  "Atenção",
  "Alta Prioridade"
];

const SC = ["g", "y", "o", "r"];
const CL = ["#7cc65c", "#f0c63c", "#ee9250", "#e0605a"];

const sit = (v, m) => {
  if (v >= m) return 0;

  const d = Math.round((m - v) * 1e10) / 1e10;

  return d <= 0.02 ? 1 : d <= 0.05 ? 2 : 3;
};

const esc = s =>
  String(s).replace(/[&<>]/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;"
  }[c]));

const short = n => n.replace(/ - \d+$/, "");

const TA = BASE.escolas.reduce((x, r) => x + r.alunos, 0);
const ch = {};

if (typeof Chart !== "undefined" && Chart.defaults) {
  Chart.defaults.font.size = 13;
  Chart.defaults.color = "#334155";
  Chart.defaults.font.family = "system-ui,'Segoe UI',Arial,sans-serif";
}

const lbl = {
  id: "lbl",
  afterDatasetsDraw(c) {
    if (c.config.type !== "bar") return;

    const x = c.ctx;
    const h = c.options.indexAxis === "y";

    c.data.datasets.forEach((d, i) => {
      if (d.type === "line") return;

      c.getDatasetMeta(i).data.forEach((b, k) => {
        const v = d.data[k];
        if (v == null) return;

        const t = v.toFixed(2).replace(".", ",") + (d.suffix || "%");

        x.save();
        x.font = "700 13px system-ui";

        const w = x.measureText(t).width + 10;
        const px = h ? (v < 0 ? b.x - 6 - w : b.x + 6) : b.x - w / 2;
        const py = h ? b.y - 10 : b.y - 27;

        x.fillStyle = "rgba(255,255,255,.93)";
        x.fillRect(px, py, w, 20);

        x.fillStyle = "#14212e";
        x.textAlign = "center";
        x.textBaseline = "middle";
        x.fillText(t, px + w / 2, py + 10);
        x.restore();
      });
    });
  }
};

function mk(id, cfg) {
  const el = $("#" + id);
  if (!el) return;

  if (typeof Chart === "undefined") {
    el.parentNode.innerHTML =
      "<p class='sub'>Não foi possível carregar a biblioteca de gráficos.</p>";
    return;
  }

  if (ch[id]) ch[id].destroy();

  cfg.plugins = [lbl];
  cfg.options = Object.assign(
    { responsive: true, maintainAspectRatio: false },
    cfg.options
  );

  ch[id] = new Chart(el, cfg);
}

const tickP = v => v + "%";

function calc() {
  const ci = st.comp === "geral" ? -1 : +st.comp;

  const S = BASE.escolas
    .map(r => ({
      n: r.nome,
      a: r.alunos,
      p: r.participacao,
      g: r.resultadoGeral,
      c: r.resultados,
      v: ci < 0 ? r.resultadoGeral : r.resultados[ci]
    }))
    .filter(s => s.v != null);

  const T = S.reduce((x, s) => x + s.a, 0);

  S.forEach(s => {
    s.w = s.a / T;
    s.d = Math.max(0, st.meta - s.v);
    s.i = s.w * s.d;
    s.s = sit(s.v, st.meta);
  });

  const ord = S
    .filter(s => s.i > 0)
    .sort((x, y) => y.i - x.i);

  ord.forEach((s, k) => s.rk = k + 1);

  return {
    S,
    T,
    ure: S.reduce((x, s) => x + s.a * s.v, 0) / T,
    ord
  };
}

const kpi = (l, v) =>
  `<div class="kpi"><small>${l}</small><b>${v}</b></div>`;

function comps(m) {
  return BASE.componentes
    .map((c, j) => {
      const x = BASE.escolas.filter(r => r.resultados[j] != null);
      const t = x.reduce((a, r) => a + r.alunos, 0);
      const v = x.reduce((a, r) => a + r.alunos * r.resultados[j], 0) / t;

      return {
        j,
        c,
        v,
        cov: t / TA,
        s: sit(v, m)
      };
    })
    .sort((a, b) => a.v - b.v);
}

const pp = v =>
  (Math.abs(v) * 100)
    .toLocaleString(N, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + " p.p.";

function pick(n) {
  st.q = n;
  $("#q").value = n;
  st.v = "painel";
  render();
  scrollTo(0, 0);
}

function render() {
  const { S, T, ure, ord } = calc();
  const m = st.meta;
  const cs = comps(m);

  const base = st.comp === "geral"
    ? "Geral"
    : BASE.componentes[+st.comp];

  const raw = st.q
    ? BASE.escolas.find(r => r.nome === st.q)
    : null;

  const me = raw ? S.find(s => s.n === st.q) : null;

  if (raw) {
    const dif = me ? me.v - ure : 0;

    $("#ctx").className = "ctx sch";
    $("#ctx").innerHTML = `
      <div>
        <small>ESCOLA SELECIONADA</small>
        <h2>🏫 ${esc(short(raw.nome))}</h2>
        <p>
          ${
            me
              ? `<span class="pill ${SC[me.s]}">${SN[me.s]}</span> · em <b>${base}</b>, a escola tem <b>${pc(me.v)}</b>, ${pp(dif)} ${dif >= 0 ? "acima" : "abaixo"} da URE (${pc(ure)}).`
              : `Esta escola não tem resultado em <b>${base}</b>.`
          }
        </p>
      </div>
      <button id="back">← Voltar à visão da URE</button>
    `;

    $("#back").onclick = () => {
      st.q = "";
      $("#q").value = "";
      render();
    };

    $("#kpis").innerHTML =
      kpi("Resultado da escola — " + base, me ? pc(me.v) : "Sem resultado") +
      kpi("Meta URE", pc(m)) +
      kpi("Distância para a meta", me ? pc(me.d) : "—") +
      kpi("Ranking de prioridade", me ? (me.rk ? me.rk + "º de " + ord.length : "Meta atingida") : "—") +
      kpi("Alunos · peso na URE", raw.alunos.toLocaleString(N) + (me ? " · " + pc(me.w) : "")) +
      kpi("Participação", pc(raw.participacao));

  } else {
    $("#ctx").className = "ctx";
    $("#ctx").innerHTML = `
      <div>
        <small>VISÃO GERAL</small>
        <h2>🌎 Unidade Regional de Ensino</h2>
        <p>Todas as escolas · escolha uma escola na lista acima para ver somente os dados dela.</p>
      </div>
    `;

    $("#kpis").innerHTML =
      kpi("Resultado URE — " + base, pc(ure)) +
      kpi("Meta URE", pc(m)) +
      kpi("Gap para a meta", pc(Math.max(0, m - ure))) +
      kpi("Avanço relativo necessário", pc(Math.max(0, m - ure) / ure)) +
      kpi("Alunos representados", T.toLocaleString(N)) +
      kpi("Escolas abaixo da meta", ord.length + " de " + S.length);
  }

  const L = S.filter(s =>
    (st.q === "" || s.n === st.q) &&
    (st.sit === "" || String(s.s) === st.sit)
  );

  document.querySelectorAll("[data-p]").forEach(e => {
    e.hidden = e.dataset.p !== st.v;
  });

  document.querySelectorAll(".tabs [data-v]").forEach(e => {
    e.classList.toggle("on", e.dataset.v === st.v);
  });

  $("#pU").hidden = !!raw;
  $("#pE").hidden = !raw;

  $("#upS").textContent = !UP.url || UP.url.includes("COLE_AQUI")
    ? "Envio ainda não configurado."
    : raw
      ? "Escola: " + raw.nome + " · formatos aceitos: PDF, Word ou ODT, até 5 MB."
      : "Escolha a escola na lista do topo da página para liberar o envio.";

  $("#upF").disabled = !raw || !UP.url || UP.url.includes("COLE_AQUI");
  $("#upB").disabled = !raw || !UP.url || UP.url.includes("COLE_AQUI");

  const mx = Math.max(...S.map(s => s.a));

  const metaLine = n => ({
    type: "line",
    label: "Meta URE",
    data: n,
    borderColor: "#1f3864",
    borderDash: [6, 4],
    pointRadius: 0,
    borderWidth: 2
  });

  const yP = {
    beginAtZero: true,
    ticks: { callback: tickP },
    title: { display: true, text: "% de acertos" },
    grace: "8%"
  };

  if (st.v === "painel" && !raw) {
    const t = ord.slice(0, 10);

    mk("c1", {
      type: "bar",
      data: {
        labels: t.map(s => short(s.n)),
        datasets: [{
          label: "Impacto do déficit na URE",
          data: t.map(s => s.i * 100),
          backgroundColor: t.map(s => s.rk <= 5 ? "#c00000" : "#ed7d31"),
          categoryPercentage: .72
        }]
      },
      options: {
        indexAxis: "y",
        layout: { padding: { right: 80 } },
        onClick: (e, a) => a.length && pick(t[a[0].index].n),
        scales: {
          x: {
            ticks: { callback: tickP },
            title: {
              display: true,
              text: "Impacto do déficit (% do resultado regional)"
            }
          },
          y: { ticks: { font: { size: 12 } } }
        },
        plugins: { legend: { position: "bottom" } }
      }
    });

    mk("c3", {
      type: "bar",
      data: {
        labels: cs.map(o => o.c),
        datasets: [
          {
            label: "Resultado ponderado da URE",
            data: cs.map(o => o.v * 100),
            backgroundColor: cs.map(o => CL[o.s]),
            categoryPercentage: .8
          },
          metaLine(cs.map(() => m * 100))
        ]
      },
      options: {
        scales: { y: yP },
        plugins: { legend: { position: "bottom" } }
      }
    });

    mk("c2", {
      type: "doughnut",
      data: {
        labels: SN,
        datasets: [{
          data: [0, 1, 2, 3].map(k => S.filter(s => s.s === k).length),
          backgroundColor: CL
        }]
      },
      options: {
        plugins: {
          legend: { position: "bottom" },
          title: { display: true, text: "Total: " + S.length + " escolas" }
        }
      }
    });

    mk("c4", {
      type: "bubble",
      data: {
        datasets: [
          {
            label: "Escolas",
            data: S.map(s => ({
              x: s.v * 100,
              y: s.a,
              r: 5 + Math.sqrt(s.i * 1e4) * 3.2,
              n: s.n
            })),
            backgroundColor: S.map(s => CL[s.s] + "cc"),
            borderColor: "#fff"
          },
          {
            type: "line",
            label: "Meta URE",
            data: [
              { x: m * 100, y: 0 },
              { x: m * 100, y: mx * 1.1 }
            ],
            borderColor: "#1f3864",
            borderDash: [6, 4],
            pointRadius: 0
          }
        ]
      },
      options: {
        scales: {
          x: {
            title: { display: true, text: "Resultado (% de acertos)" },
            ticks: { callback: tickP }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: "Alunos" }
          }
        },
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: c => c.raw.n
                ? short(c.raw.n) + ": " + c.raw.x.toFixed(2).replace(".", ",") + "% · " + c.raw.y + " alunos"
                : "Meta " + c.raw.x + "%"
            }
          }
        }
      }
    });
  }

  if (st.v === "painel" && raw) {
    const ur = {};
    cs.forEach(o => ur[o.c] = o.v);

    const it = BASE.componentes
      .map((c, j) => ({ c, v: raw.resultados[j] }))
      .filter(o => o.v != null);

    mk("c6", {
      type: "bar",
      data: {
        labels: it.map(o => o.c),
        datasets: [
          {
            label: "Resultado da escola",
            data: it.map(o => o.v * 100),
            backgroundColor: it.map(o => CL[sit(o.v, m)]),
            categoryPercentage: .8
          },
          {
            type: "line",
            label: "Resultado da URE",
            data: it.map(o => ur[o.c] * 100),
            showLine: false,
            pointStyle: "rectRot",
            pointRadius: 8,
            pointBackgroundColor: "#7a4fd0",
            pointBorderColor: "#fff",
            pointBorderWidth: 2
          },
          metaLine(it.map(() => m * 100))
        ]
      },
      options: {
        scales: { y: yP },
        plugins: { legend: { position: "bottom" } }
      }
    });

    const ds = it
      .map(o => ({ c: o.c, g: (o.v - m) * 100 }))
      .sort((a, b) => a.g - b.g);

    mk("c7", {
      type: "bar",
      data: {
        labels: ds.map(o => o.c),
        datasets: [{
          label: "Diferença para a meta (p.p.)",
          suffix: " p.p.",
          data: ds.map(o => o.g),
          backgroundColor: ds.map(o => o.g < 0 ? "#e0605a" : "#7cc65c"),
          categoryPercentage: .75
        }]
      },
      options: {
        indexAxis: "y",
        layout: { padding: { right: 85, left: 10 } },
        scales: {
          x: {
            ticks: { callback: v => v + " p.p." },
            title: {
              display: true,
              text: "Diferença para a meta (pontos percentuais)"
            },
            grace: "10%"
          }
        },
        plugins: { legend: { display: false } }
      }
    });

    mk("c8", {
      type: "bubble",
      data: {
        datasets: [
          {
            label: "Demais escolas",
            data: S.filter(s => s.n !== st.q).map(s => ({
              x: s.v * 100,
              y: s.a,
              r: 6,
              n: s.n
            })),
            backgroundColor: "#9aa7b866",
            borderColor: "#fff"
          },
          {
            label: "Escola selecionada",
            data: me ? [{
              x: me.v * 100,
              y: me.a,
              r: 13,
              n: me.n
            }] : [],
            backgroundColor: "#7a4fd0",
            borderColor: "#fff",
            borderWidth: 2
          },
          {
            type: "line",
            label: "Meta URE",
            data: [
              { x: m * 100, y: 0 },
              { x: m * 100, y: mx * 1.1 }
            ],
            borderColor: "#1f3864",
            borderDash: [6, 4],
            pointRadius: 0
          }
        ]
      },
      options: {
        scales: {
          x: {
            title: { display: true, text: "Resultado (% de acertos)" },
            ticks: { callback: tickP }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: "Alunos" }
          }
        },
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: c => c.raw.n
                ? short(c.raw.n) + ": " + c.raw.x.toFixed(2).replace(".", ",") + "% · " + c.raw.y + " alunos"
                : "Meta " + c.raw.x + "%"
            }
          }
        }
      }
    });
  }

  if (st.v === "escolas") {
    const k = st.key;

    const val = s =>
      k === "rk" ? (s.rk ?? 1e9) : s[k];

    L.sort((a, b) =>
      (typeof val(a) === "string"
        ? val(a).localeCompare(val(b))
        : val(a) - val(b)) * st.dir
    );

    $("#tsub").textContent =
      L.length + " escola(s) · base: " + base +
      " · clique no cabeçalho para ordenar e na linha para abrir os dados da escola";

    const H = [
      ["rk", "Prioridade"],
      ["n", "Escola"],
      ["a", "Alunos"],
      ["v", "Resultado"],
      ["w", "Peso na URE"],
      ["d", "Distância"],
      ["i", "Impacto do déficit"],
      ["s", "Situação"]
    ];

    $("#tb").innerHTML =
      "<thead><tr>" +
      H.map(h =>
        `<th data-k="${h[0]}">${h[1]}${st.key === h[0] ? (st.dir > 0 ? " ▲" : " ▼") : ""}</th>`
      ).join("") +
      "</tr></thead><tbody>" +

      L.map((s, i) => `
        <tr data-i="${i}">
          <td>${s.rk ? `<span class="rk ${s.rk <= 5 ? "c" : s.rk <= 10 ? "e" : "d"}" style="width:30px;height:30px;font-size:14px">${s.rk}</span>` : ""}</td>
          <td>${esc(s.n)}</td>
          <td>${s.a.toLocaleString(N)}</td>
          <td>${pc(s.v)}</td>
          <td>${pc(s.w)}</td>
          <td>${pc(s.d)}</td>
          <td>${pc(s.i)}</td>
          <td><span class="pill ${SC[s.s]}">${SN[s.s]}</span></td>
        </tr>
      `).join("") +

      "</tbody>";

    document.querySelectorAll("#tb th").forEach(e => {
      e.onclick = () => {
        const kk = e.dataset.k;
        st.dir = st.key === kk ? -st.dir : 1;
        st.key = kk;
        render();
      };
    });

    document.querySelectorAll("#tb tbody tr").forEach(e => {
      e.onclick = () => pick(L[+e.dataset.i].n);
    });
  }

  if (st.v === "comps") {
    const ur = {};
    cs.forEach(o => ur[o.c] = o);

    const rows = raw
      ? BASE.componentes
          .map((c, j) => ({
            j,
            c,
            v: raw.resultados[j],
            u: ur[c]
          }))
          .filter(o => o.v != null)
          .map(o => ({ ...o, s: sit(o.v, m) }))
          .sort((a, b) => a.v - b.v)
      : cs;

    $("#cmp-t").textContent = raw
      ? "📚 Componentes da escola × meta"
      : "📚 Componentes × meta";

    $("#cmp-s").textContent = raw
      ? "Barra = resultado da escola; linha azul = meta; ao lado, o resultado da URE no componente."
      : "Linha azul = meta. Clique num componente para analisar as escolas só nele.";

    $("#cmp").innerHTML = rows.map(o => `
      <div class="row cmp" data-j="${o.j}" style="${raw ? "cursor:default" : ""}">
        <b>${o.c}</b>
        <div class="trk">
          <div class="fill ${SC[o.s]}" style="width:${o.v / .7 * 100}%"></div>
          <i class="mk" style="left:${m / .7 * 100}%"></i>
        </div>
        <span>
          <b>${pc(o.v)}</b>
          <small style="color:var(--mut)">
            ${raw ? "URE " + pc(o.u.v) : "cobertura " + pc(o.cov)}
          </small>
        </span>
      </div>
    `).join("");

    if (!raw) {
      document.querySelectorAll(".row.cmp").forEach(e => {
        e.onclick = () => {
          $("#comp").value = st.comp = st.comp === e.dataset.j ? "geral" : e.dataset.j;
          st.v = "escolas";
          render();
        };
      });
    }
  }

  if (st.v === "mapa") {
    const cl = v => v == null ? "" : " class='" + SC[sit(v, m)] + "'";

    $("#hm").innerHTML =
      "<thead><tr><th>Escola</th><th>% Acertos</th>" +
      BASE.componentes.map(c => `<th>${c}</th>`).join("") +
      "</tr></thead><tbody>" +

      L.slice()
        .sort((a, b) => a.n.localeCompare(b.n))
        .map(s => `
          <tr>
            <td style="text-align:left">${esc(s.n)}</td>
            <td${cl(s.g)}>${pc(s.g)}</td>
            ${s.c.map(v => `<td${cl(v)}>${pc(v)}</td>`).join("")}
          </tr>
        `).join("") +

      "</tbody>";
  }
}

document.querySelectorAll(".tabs [data-v]").forEach(e => {
  e.onclick = () => {
    st.v = e.dataset.v;
    render();
  };
});

$("#help").onclick = () => {
  $("#mb").innerHTML = `
    <h3>❓ Como funciona</h3>
    <p><b>Resultado URE</b> = Σ(alunos × resultado) ÷ total de alunos. É média ponderada, nunca média simples.</p>
    <p><b>Peso</b> = alunos da escola ÷ alunos da URE.</p>
    <p><b>Distância</b> = <code>máx(0; meta − resultado)</code>.</p>
    <p><b>Impacto do déficit</b> = peso × distância.</p>
    <p>O ranking usa o impacto do déficit: uma escola grande abaixo da meta pode ter prioridade maior que uma pequena com resultado menor.</p>
    <p><b>Situação:</b> verde ≥ meta · amarelo até 2 p.p. abaixo · laranja de 2 a 5 p.p. · vermelho mais de 5 p.p. abaixo.</p>
    <p>Escolas sem resultado em um componente ficam fora do cálculo dele.</p>
  `;

  $("#md").classList.add("on");
};

$("#md").onclick = e => {
  if (e.target.id === "md" || e.target.classList.contains("x")) {
    $("#md").classList.remove("on");
  }
};

$("#upB").onclick = async () => {
  const f = $("#upF").files[0];
  const M = $("#upM");
  const B = $("#upB");

  M.style.color = "#334155";

  if (!f) {
    M.textContent = "Selecione o arquivo do plano de ação primeiro.";
    return;
  }

  if (f.size > 5 * 1024 * 1024) {
    M.textContent = "O arquivo tem mais de 5 MB. Reduza o tamanho e tente de novo.";
    return;
  }

  const ext = f.name.split(".").pop().toLowerCase();

  const tipo = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    odt: "application/vnd.oasis.opendocument.text"
  }[ext];

  if (!tipo) {
    M.textContent = "Formato não aceito. Envie PDF, Word (.doc/.docx) ou ODT.";
    return;
  }

  B.disabled = true;
  M.textContent = "Enviando… aguarde, não feche a página.";

  try {
    const dados = await new Promise((ok, er) => {
      const r = new FileReader();
      r.onload = () => ok(r.result.split(",")[1]);
      r.onerror = er;
      r.readAsDataURL(f);
    });

    const r = await fetch(UP.url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        escola: st.q,
        nome: f.name,
        tipo,
        dados
      })
    });

    const j = await r.json();

    if (j.ok) {
      M.style.color = "#245c1a";
      M.textContent = "✅ Plano enviado com sucesso: " + j.arquivo;
      $("#upF").value = "";
    } else {
      M.style.color = "#9b1c22";
      M.textContent = "Não foi possível enviar: " + (j.erro || "erro desconhecido");
    }

  } catch (e) {
    M.style.color = "#9b1c22";
    M.textContent = "Não foi possível confirmar o envio. Verifique a internet e tente de novo.";
  }

  B.disabled = false;
};

$("#meta").oninput = e => {
  const v = parseFloat(e.target.value);
  if (!isNaN(v)) {
    st.meta = v / 100;
    render();
  }
};

$("#q").onchange = e => {
  st.q = e.target.value;
  render();
};

$("#sit").onchange = e => {
  st.sit = e.target.value;
  render();
};

$("#comp").onchange = e => {
  st.comp = e.target.value;
  render();
};

$("#q").innerHTML += BASE.escolas
  .map(r => r.nome)
  .sort((a, b) => a.localeCompare(b))
  .map(n => `<option value="${esc(n)}">${esc(n)}</option>`)
  .join("");

$("#comp").innerHTML =
  "<option value='geral'>Geral (% de acertos)</option>" +
  BASE.componentes
    .map((c, j) => `<option value="${j}">${c}</option>`)
    .join("");

$("#reset").onclick = () => {
  Object.assign(st, {
    meta: .51,
    q: "",
    sit: "",
    comp: "geral",
    key: "rk",
    dir: 1
  });

  $("#meta").value = 51;
  $("#q").value = "";
  $("#sit").value = "";
  $("#comp").value = "geral";

  render();
};

$("#titulo-bimestre").textContent = BASE.meta.bimestre;
$("#meta-fonte").textContent = BASE.meta.fonte;
$("#meta-base").textContent = BASE.meta.base;
$("#meta-extracao").textContent = BASE.meta.dataExtracao;
$("#meta-atualizacao").textContent = BASE.meta.dataAtualizacao;

$("#rodape").textContent =
  "Dados: " + BASE.meta.fonte +
  " · Resultado URE = média ponderada por alunos · escolas sem resultado no componente ficam fora do cálculo.";

render();
