document.addEventListener("DOMContentLoaded", () => {
  console.log('app.js carregado');

  const form = document.getElementById("searchForm");
  const input = document.getElementById("query");
  const btnSites = document.getElementById("btn-sites"); // se existir
  const btnImages = document.getElementById("btn-images"); // se existir

  // Se existe o form, usar submit normalmente (funciona com Enter também)
  if (form && input) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (q) {
        // redireciona para a página de resultados (URL: /search?q=...)
        window.location.href = `/search?q=${encodeURIComponent(q)}`;
      }
    });
  }

  // Caso seu layout tenha botões separados para sites/imagens
  if (btnSites && input) {
    btnSites.addEventListener("click", () => {
      const q = input.value.trim();
      if (q) window.location.href = `/search?q=${encodeURIComponent(q)}&kind=sites`;
    });
  }

  if (btnImages && input) {
    btnImages.addEventListener("click", () => {
      const q = input.value.trim();
      if (q) window.location.href = `/search?q=${encodeURIComponent(q)}&kind=images`;
    });
  }
});
