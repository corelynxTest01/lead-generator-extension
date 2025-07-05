const showBootstrapAlert = (message, type = "success") => {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show custom-bootstrap-alert`;
  alertDiv.setAttribute("role", "alert");
  alertDiv.popup.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    min-width: 300px;
    max-width: 400px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `;
  alertDiv.innerHTML = `${message}`;
  document.body.appendChild(alertDiv);
  setTimeout(() => {
    if (alertDiv && alertDiv.parentNode) {
      alertDiv.classList.remove("show");
      setTimeout(() => {
        if (alertDiv && alertDiv.parentNode) {
          alertDiv.remove();
        }
      }, 150);
    }
  }, 2000);

  console.log(message);
};

export default showBootstrapAlert;