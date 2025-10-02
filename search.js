document.addEventListener("DOMContentLoaded", () => {
  console.log("search.js carregado");

  const resultsContainer = document.getElementById("results");
  const input = document.getElementById("query"); // campo de pesquisa na página de resultados
  const themeToggle = document.getElementById("theme-toggle");

  // Alternar tema claro / escuro
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
    });
  }

  // Pegar query da URL
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q") || "";
  const kind = params.get("kind") || "sites";

  // Preencher campo de pesquisa se existir
  if (input && q) {
    input.value = q;
  }

  // Função para carregar resultados via API JSON
  async function loadResults() {
    if (!q) {
      if (resultsContainer) resultsContainer.innerHTML = "Nenhuma pesquisa realizada.";
      return;
    }

    if (resultsContainer) resultsContainer.innerHTML = "Carregando resultados...";

    try {
      const resp = await fetch(`/search_api?q=${encodeURIComponent(q)}&kind=${encodeURIComponent(kind)}`);

      // Verifica se veio JSON
      const contentType = resp.headers.get("content-type") || "";
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      if (!contentType.includes("application/json")) {
        const text = await resp.text();
        throw new Error("Resposta não é JSON, provavelmente HTML. Primeiro chars: " + text.slice(0, 120));
      }

      const json = await resp.json();

      // Renderizar resultados
      if (kind === "images" && json.images) {
        const grid = document.createElement("div");
        grid.className = "grid-images";
        json.images.forEach((img) => {
          const i = document.createElement("img");
          i.src = img.thumbnail;
          i.alt = "";
          grid.appendChild(i);
        });
        resultsContainer.innerHTML = "";
        resultsContainer.appendChild(grid);
      } else if (json.results) {
        resultsContainer.innerHTML = "";
        json.results.forEach((r) => {
          const c = document.createElement("div");
          c.className = "card";
          const a = document.createElement("a");
          a.href = r.href;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.className = "result-title";
          a.textContent = r.title || r.href;
          const u = document.createElement("div");
          u.className = "result-url";
          u.textContent = r.href;
          const s = document.createElement("div");
          s.className = "result-snippet";
          s.textContent = r.snippet || "";
          c.appendChild(a);
          c.appendChild(u);
          c.appendChild(s);
          resultsContainer.appendChild(c);
        });
      } else if (json.error) {
        resultsContainer.innerHTML = "Erro na busca: " + (json.details || json.error);
      } else {
        resultsContainer.innerHTML = "Nenhum resultado encontrado.";
      }
    } catch (err) {
      console.error("Erro fetchSites:", err);
      if (resultsContainer) resultsContainer.innerHTML = "Erro ao carregar resultados: " + err.message;
    }
  }

  // Carregar resultados ao abrir a página
  loadResults();

  // Botão de pesquisa na tela de resultados (opcional)
  const btnSearch = document.getElementById("btn-search");
  if (btnSearch && input) {
    btnSearch.addEventListener("click", () => {
      const newq = input.value.trim();
      if (newq) {
        window.location.href = `/search?q=${encodeURIComponent(newq)}&kind=${encodeURIComponent(kind)}`;
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        btnSearch.click();
      }
    });
  }
});