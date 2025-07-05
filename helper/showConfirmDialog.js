export default function showConfirmDialog(message, title = 'Confirm Action') {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    if (!modal) return resolve(false);

    const modalTitle = modal.querySelector('#confirmModalLabel');
    const modalBody = modal.querySelector('#confirmModalBody');
    const confirmBtn = modal.querySelector('#confirmOk');
    const cancelBtn = modal.querySelector('#confirmCancel');
    const closeBtn = modal.querySelector('.close');

    modalTitle.textContent = title;
    modalBody.textContent = message;
    modal.classList.add('show');
    modal.style.display = 'block';
    document.body.classList.add('modal-open');

    const cleanup = () => {
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      closeBtn.removeEventListener('click', onCancel);
      document.removeEventListener('keydown', onEscape);
    };

    const hideModal = () => {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      cleanup();
    };

    const onConfirm = () => {
      hideModal();
      resolve(true);
    };
    const onCancel = () => {
      hideModal();
      resolve(false);
    };
    const onEscape = (e) => {
      if (e.key === 'Escape') onCancel();
    };

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    closeBtn.addEventListener('click', onCancel);
    document.addEventListener('keydown', onEscape);
  });
}