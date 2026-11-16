/* URL publicada do Google Apps Script (Web App). */
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNur-3BNfRK21oq3fegyn5itREapvLICYnmCXtfBcFHFNpCvI8eL8eyJZ1p5ypItD2/exec";

/* Vídeo de fundo: o iframe do YouTube carrega direto.
   A imagem de fallback fica por baixo e só aparece se o vídeo falhar. */

const form = document.querySelector("#support-form");
const phoneInput = document.querySelector("#phone");
const purchaseInput = document.querySelector("#purchase-value");
const formError = document.querySelector("#form-error");
const formStatus = document.querySelector("#form-status");

function onlyDigits(value) { return value.replace(/\D/g, ""); }

function showMessage(element, message, type) {
  element.textContent = message;
  element.hidden = false;
  element.className = element.id === "form-error" ? "form-error is-visible" : `form-status is-visible ${type}`;
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

async function sendToGoogleAppsScript(payload) {
  if (!GOOGLE_APPS_SCRIPT_URL) throw new Error("INTEGRATION_NOT_CONFIGURED");
  await fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    body: new URLSearchParams(payload),
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.hidden = true;
  formStatus.hidden = true;

  if (!form.checkValidity()) {
    showMessage(formError, "Confira os campos obrigatórios antes de enviar.", "error");
    form.querySelector(":invalid")?.focus();
    return;
  }
  if (onlyDigits(phoneInput.value).length < 10) {
    showMessage(formError, "Informe um telefone válido com DDD.", "error");
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
    showMessage(formStatus, "Dados enviados com sucesso! Em breve entraremos em contato.", "success");
  } catch (error) {
    const message = error.message === "INTEGRATION_NOT_CONFIGURED"
      ? "O formulário está pronto, mas o envio ainda precisa da URL do Google Apps Script."
      : "Não foi possível enviar agora. Tente novamente em instantes.";
    showMessage(formError, message, "error");
  } finally {
    button.disabled = false;
    button.classList.remove("is-loading");
  }
});
