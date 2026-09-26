const button = document.getElementById("copyQuote");
const endpoint = document.getElementById("quoteEndpoint");

if (button && endpoint) {
  button.addEventListener("click", async () => {
    await navigator.clipboard.writeText(endpoint.textContent.trim());

    const original = button.textContent;
    button.textContent = "COPIED";

    setTimeout(() => {
      button.textContent = original;
    }, 1200);
  });
}
