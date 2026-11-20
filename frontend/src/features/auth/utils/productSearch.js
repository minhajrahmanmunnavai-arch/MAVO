export function matchesProductSearch(product, query) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) return true;

  const seoKeywords = Array.isArray(product.seoKeywords)
    ? product.seoKeywords
    : [product.seoKeywords];
  const searchableValues = [
    product.title,
    product.productName,
    product.brandName,
    product.shopName,
    product.category,
    product.description,
    product.keywords,
    ...seoKeywords,
  ];

  return searchableValues
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

export function getProductSearchSuggestions(products, query, limit = 5) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery || !Array.isArray(products) || limit <= 0) return [];

  const suggestions = [];
  const seen = new Set();

  for (const product of products) {
    const productTitle = product.title || product.productName || "";
    const titleValues = [product.title, product.productName, product.seoTitle]
      .filter(Boolean)
      .map((text) => ({ text: String(text).trim(), type: "title" }));
    const keywordValues = [product.keywords, product.seoKeywords]
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter(Boolean)
      .flatMap((value) =>
        String(value)
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean)
      )
      .map((text) => ({ text, type: "keyword" }));

    for (const suggestion of [...titleValues, ...keywordValues]) {
      if (!suggestion.text.toLowerCase().includes(normalizedQuery)) continue;

      const key = `${product._id || productTitle}:${suggestion.text.toLowerCase()}`;
      if (seen.has(key)) continue;

      seen.add(key);
      suggestions.push({ ...suggestion, product, productTitle });
      if (suggestions.length >= limit) return suggestions;
    }
  }

  return suggestions;
}
