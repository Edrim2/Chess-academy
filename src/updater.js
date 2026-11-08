const OWNER = "Edrim2";
const REPOSITORY = "Chess-academy";

const RELEASES_API =
  `https://api.github.com/repos/${OWNER}/${REPOSITORY}/releases/latest`;

const $ = id => document.getElementById(id);

function parseNumericBuild(value) {
  if (value === null || value === undefined || value === "") return null;

  const numeric = Number(
    String(value).replace(/^build-/, "").trim()
  );

  return Number.isFinite(numeric) ? numeric : null;
}

async function readInstalledVersion() {
  try {
    const response = await fetch("./version.json?check=" + Date.now(), {
      cache: "no-store"
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (!data || typeof data !== "object") return null;

    const build = parseNumericBuild(data.build);

    if (build === null) return null;

    return { ...data, build };
  } catch {
    return null;
  }
}

async function checkForUpdates() {
  const panel = $("update-panel");
  const message = $("update-message");
  const download = $("update-download");

  if (!panel || !message || !download) return;

  panel.style.display = "block";
  download.style.display = "none";
  message.textContent = "Verificando atualizações...";

  if (!navigator.onLine) {
    message.textContent = "Sem conexão. Verifique sua conexão e tente novamente.";
    return;
  }

  try {
    const [installed, releaseResponse] = await Promise.all([
      readInstalledVersion(),
      fetch(RELEASES_API, {
        cache: "no-store",
        headers: {
          Accept: "application/vnd.github+json"
        }
      })
    ]);

    if (!releaseResponse.ok) {
      throw new Error("GitHub indisponível");
    }

    if (!installed) {
      message.textContent =
        "Metadado da versão instalada ausente ou inválido. A atualização foi ignorada.";
      return;
    }

    const release = await releaseResponse.json();
    const latestBuild = parseNumericBuild(release.tag_name);

    if (!Number.isFinite(latestBuild) || latestBuild <= 0) {
      throw new Error("Versão inválida");
    }

    const installedBuild = Number(installed.build || 0);

    if (latestBuild > installedBuild) {
      const apk = (release.assets || []).find(asset =>
        asset.name.toLowerCase().endsWith(".apk")
      );

      if (!apk) {
        message.textContent =
          "Nova versão encontrada, mas o APK ainda não está disponível.";
        return;
      }

      message.textContent =
        `Nova versão disponível: build ${latestBuild}!`;

      download.style.display = "block";

      download.onclick = () => {
        window.open(apk.browser_download_url, "_blank");
      };
    } else {
      message.textContent =
        "Você já está usando a versão mais recente!";
    }
  } catch (error) {
    message.textContent =
      "Não foi possível verificar. Confira sua conexão e tente novamente.";

    console.warn("Atualizador:", error);
  }
}

export function initializeUpdater() {
  const button = $("update-check");

  if (button) {
    button.addEventListener("click", checkForUpdates);
  }

  checkForUpdates();
}
