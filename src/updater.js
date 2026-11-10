
const OWNER = "Edrim2";
const REPOSITORY = "Chess-academy";

const RELEASES_API =
  `https://api.github.com/repos/${OWNER}/${REPOSITORY}/releases/latest`;

const $ = id => document.getElementById(id);

function showPanel(visible) {
  const panel = $("update-panel");
  if (panel) panel.style.display = visible ? "block" : "none";
}

function getBuildNumber(release) {
  const tag = String(release.tag_name || "");
  const match = tag.match(/build[-_]?(\d+)/i);

  return match ? Number(match[1]) : 0;
}

async function installUpdate(downloadUrl, button, message) {
  button.disabled = true;
  button.textContent = "Preparando atualização...";

  try {
    // Native Android implementation required for in-app APK installation.
    const nativeUpdater = window.AndroidUpdater;

    if (typeof nativeUpdater?.installApkFromUrl === "function") {
      const result = nativeUpdater.installApkFromUrl(downloadUrl);

      if (result && typeof result.then === "function") {
        await result;
      }

      message.textContent =
        "Atualização preparada. Confirme a instalação na janela do Android.";

      button.textContent = "Instalação iniciada";
      return;
    }

    // Browser fallback.
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();

    message.textContent =
      "APK baixado. Abra o arquivo e confirme a instalação para atualizar o aplicativo.";

    button.textContent = "Baixar novamente";
  } catch (error) {
    console.error("Erro ao instalar atualização:", error);

    message.textContent =
      "Não foi possível iniciar a instalação. Tente novamente.";

    button.disabled = false;
    button.textContent = "Instalar atualização";
  }
}

async function checkForUpdates() {
  const panel = $("update-panel");
  const message = $("update-message");
  const download = $("update-download");
  const checkButton = $("update-check");

  if (!panel || !message || !download) return;

  if (checkButton) checkButton.disabled = true;

  download.style.display = "none";
  download.disabled = false;
  download.textContent = "Instalar atualização";

  try {
    const [versionResponse, releaseResponse] = await Promise.all([
      fetch(`./version.json?check=${Date.now()}`, {
        cache: "no-store"
      }),
      fetch(`${RELEASES_API}?check=${Date.now()}`, {
        cache: "no-store",
        headers: {
          Accept: "application/vnd.github+json"
        }
      })
    ]);

    if (!versionResponse.ok) {
      throw new Error("Não foi possível ler version.json");
    }

    if (!releaseResponse.ok) {
      throw new Error("GitHub indisponível");
    }

    const installed = await versionResponse.json();
    const release = await releaseResponse.json();

    const installedBuild = Number(installed.build);
    const latestBuild = getBuildNumber(release);

    if (
      !Number.isFinite(installedBuild) ||
      installedBuild < 0 ||
      !latestBuild
    ) {
      throw new Error("Número de build inválido");
    }

    if (latestBuild <= installedBuild) {
      showPanel(false);
      return;
    }

    const apk = (release.assets || []).find(asset =>
      String(asset.name || "").toLowerCase().endsWith(".apk")
    );

    showPanel(true);

    if (!apk) {
      message.textContent =
        `Build ${latestBuild} encontrada, mas o APK ainda não está disponível.`;
      return;
    }

    message.textContent =
      `Nova versão disponível: build ${latestBuild}.`;

    download.style.display = "block";

    download.onclick = () => {
      installUpdate(
        apk.browser_download_url,
        download,
        message
      );
    };

  } catch (error) {
    console.warn("Atualizador:", error);

    showPanel(true);

    message.textContent =
      "Não foi possível verificar atualizações. Confira sua conexão e tente novamente.";
  } finally {
    if (checkButton) checkButton.disabled = false;
  }
}

export function initializeUpdater() {
  const button = $("update-check");

  if (button) {
    button.addEventListener("click", checkForUpdates);
  }

  checkForUpdates();
}
