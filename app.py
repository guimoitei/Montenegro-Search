from flask import Flask, render_template, request, jsonify
import requests
from bs4 import BeautifulSoup

app = Flask(__name__, static_folder='public', template_folder='public')

# Página inicial
@app.route("/")
def index():
    return render_template("index.html")

# Página de resultados
@app.route("/search")
def search():
    return render_template("search.html")

# API de busca
@app.route("/search_api")
def search_api():
    query = request.args.get("q", "")
    if not query:
        return jsonify({"results": []})

    try:
        # Scraping do DuckDuckGo (HTML simplificado)
        url = "https://html.duckduckgo.com/html/"
        resp = requests.post(url, data={"q": query}, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(resp.text, "html.parser")
        results = []

        for result in soup.find_all("div", class_="result"):
            link_tag = result.find("a", class_="result__a")
            snippet_tag = result.find("a", class_="result__snippet")
            if link_tag:
                title = link_tag.get_text()
                href = link_tag.get("href")
                snippet = snippet_tag.get_text() if snippet_tag else ""
                results.append({
                    "title": title,
                    "href": href,
                    "snippet": snippet
                })

        return jsonify({"results": results})

    except Exception as e:
        return jsonify({"error": "Falha na busca", "details": str(e)})

if __name__ == "__main__":
    app.run(debug=True)
