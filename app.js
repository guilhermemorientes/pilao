/* URL publicada do Google Apps Script (Web App).
   Se você criar uma NOVA implantação no Apps Script, a URL muda:
   cole a URL nova /exec aqui. Se apenas EDITAR a implantação existente
   (Gerenciar implantações → lápis → Nova versão), a URL continua a mesma. */
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxpgJKNK-1EkNCOI3PtfES0j_Yp-YhZ-iR4y9Y8AEiGkdrc56q9gNJng-iaihJ1k8aEZQ/exec";

const form = document.querySelector("#support-form");
const phoneInput = document.querySelector("#phone");
const purchaseInput = document.querySelector("#purchase-value");
const formError = document.querySelector("#form-error");

function onlyDigits(value) { return value.replace(/\D/g, ""); }

function showError(message) {
  formError.textContent = message;
  formError.hidden = false;
  formError.classList.add("is-visible");
}

function hideError() {
  formError.classList.remove("is-visible");
  formError.hidden = true;
}

phoneInput.addEventListener("input", (event) => {
  const digits = onlyDigits(event.target.value).slice(0, 11);
  event.target.value = digits.length > 10
    ? digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    : digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
});

purchaseInput.addEventListener("input", (event) => {
  const digits = onlyDigits(event.target.value);
  event.target.value = digits ? (Number(digits) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "";
});

/* Envio com confirmação real: o Web App responde JSON.
   Se voltar outra coisa (ex.: tela de login do Google), a implantação
   está com o acesso errado e o erro é mostrado em vez de fingir sucesso. */
async function sendToGoogleAppsScript(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      redirect: "follow",
      signal: controller.signal,
      body: new URLSearchParams(payload),
    });
    let data = null;
    try { data = JSON.parse(await response.text()); } catch (_) { data = null; }
    if (!data) throw new Error("BAD_DEPLOYMENT");
    if (!data.success) throw new Error(data.error || "Não foi possível registrar o atendimento.");
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideError();

  if (!form.checkValidity()) {
    showError("Confira os campos obrigatórios antes de enviar.");
    form.querySelector(":invalid")?.focus();
    return;
  }
  if (onlyDigits(phoneInput.value).length < 10) {
    showError("Informe um telefone válido com DDD.");
    phoneInput.focus();
    return;
  }

  const payload = Object.fromEntries(new FormData(form).entries());
  const button = form.querySelector(".submit-button");
  button.disabled = true;
  button.classList.add("is-loading");
  try {
    await sendToGoogleAppsScript(payload);
    form.reset();
    openSuccessModal();
  } catch (error) {
    if (error.name === "AbortError") {
      showError("O envio demorou demais. Verifique sua conexão e tente novamente.");
    } else if (error.message === "BAD_DEPLOYMENT" || error.name === "TypeError") {
      showError("O servidor do formulário não respondeu corretamente. Confira a implantação do Apps Script (Executar como: Eu / Quem tem acesso: Qualquer pessoa) e se a URL em GOOGLE_APPS_SCRIPT_URL é a da implantação ativa.");
    } else {
      showError(error.message || "Não foi possível enviar agora. Tente novamente em instantes.");
    }
  } finally {
    button.disabled = false;
    button.classList.remove("is-loading");
  }
});

/* Popup de sucesso — só abre depois da confirmação do servidor */
function openSuccessModal() {
  const modal = document.getElementById("success-modal");
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
}
function closeSuccessModal() {
  const modal = document.getElementById("success-modal");
  modal.style.display = "none";
  document.body.style.overflow = "";
}
document.getElementById("success-close").addEventListener("click", closeSuccessModal);
document.getElementById("success-modal").addEventListener("click", function(event) {
  if (event.target === this) closeSuccessModal();
});
document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") closeSuccessModal();
});
