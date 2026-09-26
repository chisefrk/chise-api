export async function randomQuote() {
  const response = await fetch(
    new URL("./all.json", import.meta.url)
  );

  if (!response.ok) {
    throw new Error("Failed to load quotes");
  }

  const result = await response.json();

  if (!Array.isArray(result.data) || result.data.length === 0) {
    throw new Error("Quote dataset is empty");
  }

  const index = Math.floor(Math.random() * result.data.length);

  return {
    status: true,
    data: result.data[index]
  };
}
