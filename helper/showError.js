const showError= (message) => {
  document.getElementById("loader").style.display = "none";
  
  const statusElement = document.getElementById("status");
  statusElement.classList.add('not-linkedin');
  statusElement.textContent = message;
}
export default showError;