export default function showError(message) {
  const loader = document.getElementById("loader");
  const status = document.getElementById("status");
  if (loader) loader.style.display = "none";
  if (status) {
    status.classList.add("not-linkedin");
    status.textContent = message;
  }
}