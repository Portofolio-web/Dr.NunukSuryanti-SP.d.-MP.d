/**
 * Success Modal — Tailwind CSS version
 * Usage: showSuccessModal({title, message, buttonText, onClose})
 *        showErrorModal({title, message, buttonText, onClose})
 *        showDeleteSuccessModal(itemName)
 */

function _buildModal({ iconClass, titleClass, btnClass, title, message, buttonText, onClose }) {
  // 1. Buat overlay (Backdrop) dengan Tailwind: fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm opacity-0
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm opacity-0 transition-opacity duration-300";

  // 2. Buat modal box dengan Tailwind: scale-95 untuk animasi pop-in
  const modal = document.createElement("div");
  modal.className = "bg-white rounded-2xl p-6 md:p-8 shadow-2xl max-w-sm w-full mx-4 transform scale-95 transition-all duration-300 text-center";

  const finalIconClass = iconClass || "ri-check-line";
  const defaultTitleClass = "text-xl font-bold text-gray-800 mb-2";
  const finalTitleClass = titleClass || defaultTitleClass;
  const defaultBtnClass = "w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors duration-200";
  const finalBtnClass = btnClass || defaultBtnClass;

  modal.innerHTML = `
    <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
      <i class="${finalIconClass} text-3xl text-green-500"></i>
    </div>
    <h3 class="${finalTitleClass}">${title}</h3>
    <p class="text-gray-500 mb-6 text-sm leading-relaxed">${message}</p>
    ${buttonText ? `<button class="success-modal-action ${finalBtnClass}">${buttonText}</button>` : ""}
  `;

  // Custom icon wrapper styling untuk error modal
  if (iconClass && iconClass.includes("close")) {
    modal.querySelector(".h-16").className = "mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4";
    modal.querySelector("i").className = `${finalIconClass} text-3xl text-red-500`;
  }

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Trigger animasi fade-in & scale-up (hapus opacity-0 dan scale-95)
  setTimeout(() => {
    overlay.classList.remove("opacity-0");
    overlay.classList.add("opacity-100");
    modal.classList.remove("scale-95");
    modal.classList.add("scale-100");
  }, 10);

  function closeModal() {
    // Animasi fade-out
    overlay.classList.remove("opacity-100");
    overlay.classList.add("opacity-0");
    modal.classList.remove("scale-100");
    modal.classList.add("scale-95");

    setTimeout(() => {
      overlay.remove();
      if (typeof onClose === "function") onClose();
    }, 300);
  }

  // Action button
  const btn = modal.querySelector(".success-modal-action");
  if (btn) btn.addEventListener("click", closeModal);

  // Click luar untuk tutup
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  // ESC untuk tutup
  const escHandler = (e) => {
    if (e.key === "Escape") {
      document.removeEventListener("keydown", escHandler);
      closeModal();
    }
  };
  document.addEventListener("keydown", escHandler);

  return { close: closeModal };
}

function showSuccessModal(options = {}) {
  const {
    title       = "Berhasil!",
    message     = "Operasi berhasil diselesaikan.",
    buttonText  = "Oke",
    onClose     = null
  } = options;

  return _buildModal({
    iconClass : "ri-check-line",
    titleClass: null,
    btnClass  : null,
    title, message, buttonText, onClose
  });
}

function showDeleteSuccessModal(itemName = "Item") {
  return showSuccessModal({
    title      : "Berhasil Dihapus",
    message    : `${itemName} telah berhasil dihapus dari sistem.`,
    buttonText : "Oke"
  });
}

function showErrorModal(options = {}) {
  const {
    title      = "Terjadi Kesalahan",
    message    = "Operasi gagal. Silakan coba lagi.",
    buttonText = "Oke",
    onClose    = null
  } = options;

  return _buildModal({
    iconClass : "ri-close-line",
    titleClass: "text-xl font-bold text-red-600 mb-2",
    btnClass  : "w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors duration-200",
    title, message, buttonText, onClose
  });
}
