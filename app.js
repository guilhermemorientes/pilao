/* ============================================================
   PILÃO PROFESSIONAL — Main JS (vanilla, moderno)
   ============================================================ */

(function () {
    "use strict";

    /* ==========================================================
       CONFIGURAÇÃO — INTEGRAÇÕES
       ----------------------------------------------------------
       APPS_SCRIPT_URL: URL do App da Web do Google.
       Cole abaixo a URL /exec da implantação do script da Pilão
       (a que terminar em /exec).
       ========================================================== */
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyM0wBYZ7Y4WhRcHtJNGeTvtCXFUW55aC6MU9bzV0Q9IsNYbUyCjYsNhFeEKVg8jLu1Zw/exec";

    /* ----------------------------------------------------------
       Elementos e utilidades do formulário
       ---------------------------------------------------------- */
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

    /* ----------------------------------------------------------
       Envio → Google Apps Script (planilha + e-mail)
       Mesmo padrão do site Forte Prado: JSON em texto puro,
       sem bloquear o usuário esperando resposta.
       ---------------------------------------------------------- */
    function sendLeadToSheet(data) {
        const configured = APPS_SCRIPT_URL && APPS_SCRIPT_URL.indexOf("COLE_AQUI") === -1;
        if (!configured) return false;
        try {
            fetch(APPS_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(data),
            }).catch(function () {});
            return true;
        } catch (err) {
            return false;
        }
    }

    form.addEventListener("submit", (event) => {
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

        const data = Object.fromEntries(new FormData(form).entries());
        const button = form.querySelector(".submit-button");

        const enviado = sendLeadToSheet(data);
        if (!enviado) {
            showError("O formulário ainda não está conectado ao servidor. Cole a URL da implantação em APPS_SCRIPT_URL (app.js).");
            return;
        }

        if (button) {
            button.disabled = true;
            button.classList.add("is-loading");
        }

        // Tempo do servidor registrar antes da confirmação visual
        setTimeout(() => {
            form.reset();
            openSuccessModal();
            if (button) {
                button.disabled = false;
                button.classList.remove("is-loading");
            }
        }, 1200);
    });

    /* ----------------------------------------------------------
       Popup de sucesso
       ---------------------------------------------------------- */
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
    document.getElementById("success-modal").addEventListener("click", function (event) {
        if (event.target === this) closeSuccessModal();
    });
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeSuccessModal();
    });
})();
