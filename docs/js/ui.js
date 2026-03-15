document.addEventListener("click", (event) => {
  const target = event.target.closest(".eye-toggle");
  if (!target) {
    return;
  }

  const inputId = target.getAttribute("data-target");
  const input = document.getElementById(inputId);
  if (!input) {
    return;
  }

  const isHidden = input.getAttribute("type") === "password";
  input.setAttribute("type", isHidden ? "text" : "password");
  target.classList.toggle("is-on", isHidden);
});
