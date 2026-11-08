export const SETTINGS_KEY = "chess_academy_settings_v1";

export function getDefaultSettings() {
  return {
    theme: "dark",
    difficulty: 3,
    showLia: true,
    showHistory: true,
    animations: true
  };
}

function isValidDifficulty(value) {
  const number = Number(value);
  return Number.isInteger(number) && [1, 2, 3, 4, 5].includes(number);
}

export function sanitizeSettings(input = {}) {
  const base = getDefaultSettings();
  const source = input && typeof input === "object" ? input : {};
  const next = { ...base };

  if (source.theme === "light" || source.theme === "dark") {
    next.theme = source.theme;
  }

  if (isValidDifficulty(source.difficulty)) {
    next.difficulty = Number(source.difficulty);
  }

  next.showLia = source.showLia === undefined ? base.showLia : Boolean(source.showLia);
  next.showHistory = source.showHistory === undefined ? base.showHistory : Boolean(source.showHistory);
  next.animations = source.animations === undefined ? base.animations : Boolean(source.animations);

  return next;
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return getDefaultSettings();
    }

    const parsed = JSON.parse(raw);
    return sanitizeSettings(parsed);
  } catch (error) {
    console.warn("Configurações inválidas; usando padrões seguros.", error);
    return getDefaultSettings();
  }
}

export function saveSettings(settings) {
  const next = sanitizeSettings(settings);

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("Não foi possível salvar as configurações.", error);
  }

  return next;
}

export function exportSettings() {
  const settings = loadSettings();
  const payload = JSON.stringify(settings, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "chess-academy-settings.json";
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return settings;
}

export async function importSettingsFromFile(file) {
  if (!file) {
    throw new Error("Selecione um arquivo JSON.");
  }

  const text = await file.text();

  try {
    const parsed = JSON.parse(text);
    const next = sanitizeSettings(parsed);
    saveSettings(next);
    return next;
  } catch (error) {
    throw new Error("Arquivo JSON inválido.");
  }
}

export function restoreDefaultSettings() {
  const defaults = getDefaultSettings();
  saveSettings(defaults);
  return defaults;
}

function setStatus(message, type = "info") {
  const element = document.getElementById("settings-status");

  if (!element) {
    return;
  }

  element.textContent = message;
  element.dataset.type = type;
}

function bindTabs() {
  const buttons = document.querySelectorAll(".settings-tab");
  const panels = document.querySelectorAll(".settings-panel");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const nextTab = button.dataset.tab;

      buttons.forEach(item => {
        item.classList.toggle("active", item === button);
      });

      panels.forEach(panel => {
        const isActive = panel.dataset.panel === nextTab;
        panel.classList.toggle("active", isActive);
        panel.hidden = !isActive;
      });
    });
  });
}

function bindControls(appApi = {}) {
  const themeInputs = document.querySelectorAll('input[name="settings-theme"]');
  const difficultyInput = document.getElementById("settings-difficulty");
  const liaToggle = document.getElementById("settings-show-lia");
  const historyToggle = document.getElementById("settings-show-history");
  const animationsToggle = document.getElementById("settings-animations");
  const openButton = document.getElementById("settings-button");
  const closeButton = document.getElementById("settings-close");
  const modal = document.getElementById("settings-modal");
  const exportButton = document.getElementById("settings-export");
  const importButton = document.getElementById("settings-import");
  const restoreButton = document.getElementById("settings-restore");
  const importInput = document.getElementById("settings-import-file");

  if (openButton && modal) {
    openButton.addEventListener("click", () => {
      modal.hidden = false;
      document.body.classList.add("settings-open");
    });
  }

  if (closeButton && modal) {
    closeButton.addEventListener("click", () => {
      modal.hidden = true;
      document.body.classList.remove("settings-open");
    });
  }

  if (modal) {
    modal.addEventListener("click", event => {
      if (event.target === modal) {
        modal.hidden = true;
        document.body.classList.remove("settings-open");
      }
    });
  }

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && modal && !modal.hidden) {
      modal.hidden = true;
      document.body.classList.remove("settings-open");
    }
  });

  function setCurrentSettings(settings) {
    const next = sanitizeSettings(settings);

    themeInputs.forEach(input => {
      input.checked = input.value === next.theme;
    });

    if (difficultyInput) {
      difficultyInput.value = String(next.difficulty);
    }

    if (liaToggle) {
      liaToggle.checked = Boolean(next.showLia);
    }

    if (historyToggle) {
      historyToggle.checked = Boolean(next.showHistory);
    }

    if (animationsToggle) {
      animationsToggle.checked = Boolean(next.animations);
    }

    if (typeof appApi.applySettings === "function") {
      appApi.applySettings(next, { silent: true });
    }
  }

  function readSettingsFromForm() {
    const themeValue = document.querySelector('input[name="settings-theme"]:checked');
    const difficultyValue = difficultyInput ? Number(difficultyInput.value) : 3;

    return sanitizeSettings({
      theme: themeValue ? themeValue.value : "dark",
      difficulty: difficultyValue,
      showLia: liaToggle ? liaToggle.checked : true,
      showHistory: historyToggle ? historyToggle.checked : true,
      animations: animationsToggle ? animationsToggle.checked : true
    });
  }

  themeInputs.forEach(input => {
    input.addEventListener("change", () => {
      const next = readSettingsFromForm();
      saveSettings(next);
      setCurrentSettings(next);
      setStatus("Tema atualizado.", "success");
    });
  });

  if (difficultyInput) {
    difficultyInput.addEventListener("change", () => {
      const next = readSettingsFromForm();
      saveSettings(next);
      setCurrentSettings(next);
      setStatus("Dificuldade padrão atualizada.", "success");

      if (typeof appApi.onDifficultyChange === "function") {
        appApi.onDifficultyChange(next.difficulty);
      }
    });
  }

  [liaToggle, historyToggle, animationsToggle].forEach(control => {
    if (!control) return;

    control.addEventListener("change", () => {
      const next = readSettingsFromForm();
      saveSettings(next);
      setCurrentSettings(next);
      setStatus("Preferências gerais atualizadas.", "success");
    });
  });

  if (exportButton) {
    exportButton.addEventListener("click", () => {
      exportSettings();
      setStatus("Configurações exportadas em JSON.", "success");
    });
  }

  if (importButton && importInput) {
    importButton.addEventListener("click", () => {
      importInput.value = "";
      importInput.click();
    });

    importInput.addEventListener("change", async event => {
      const [file] = event.target.files || [];

      if (!file) {
        return;
      }

      try {
        const next = await importSettingsFromFile(file);
        setCurrentSettings(next);
        setStatus("Configurações importadas com sucesso.", "success");
      } catch (error) {
        setStatus(error.message || "Arquivo inválido.", "error");
      }
    });
  }

  if (restoreButton) {
    restoreButton.addEventListener("click", () => {
      const defaults = restoreDefaultSettings();
      setCurrentSettings(defaults);
      setStatus("Configurações padrão restauradas.", "success");
    });
  }

  const initial = loadSettings();
  setCurrentSettings(initial);
}

export function initializeSettings(appApi = {}) {
  if (!document || !document.getElementById) {
    return;
  }

  const modal = document.getElementById("settings-modal");
  if (!modal) {
    return;
  }

  bindTabs();
  bindControls(appApi);
}

export function refreshSettingsUI(appApi = {}) {
  const settings = loadSettings();
  const current = sanitizeSettings(settings);

  if (typeof appApi.applySettings === "function") {
    appApi.applySettings(current, { silent: true });
  }

  const themeInputs = document.querySelectorAll('input[name="settings-theme"]');
  if (themeInputs.length) {
    themeInputs.forEach(input => {
      input.checked = input.value === current.theme;
    });
  }

  const difficultyInput = document.getElementById("settings-difficulty");
  if (difficultyInput) {
    difficultyInput.value = String(current.difficulty);
  }

  const liaToggle = document.getElementById("settings-show-lia");
  const historyToggle = document.getElementById("settings-show-history");
  const animationsToggle = document.getElementById("settings-animations");

  if (liaToggle) liaToggle.checked = Boolean(current.showLia);
  if (historyToggle) historyToggle.checked = Boolean(current.showHistory);
  if (animationsToggle) animationsToggle.checked = Boolean(current.animations);
}
