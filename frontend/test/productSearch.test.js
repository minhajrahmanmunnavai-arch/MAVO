import test from "node:test";
import assert from "node:assert/strict";
import {
  getProductSearchSuggestions,
  matchesProductSearch,
} from "../src/features/auth/utils/productSearch.js";

test("product search matches title, brand, description, tags, and category", () => {
  const cases = [
    [{ title: "Mavo Desk Lamp" }, "desk"],
    [{ brandName: "North Star" }, "north"],
    [{ description: "Solid oak construction" }, "oak"],
    [{ seoKeywords: ["reading light", "desk accessory"] }, "accessory"],
    [{ keywords: "legacy tag" }, "legacy"],
    [{ category: "Home Lighting" }, "lighting"],
  ];

  for (const [product, query] of cases) {
    assert.equal(matchesProductSearch(product, query), true, query);
  }
});

test("product search is case-insensitive and handles empty queries", () => {
  assert.equal(matchesProductSearch({ brandName: "MAVO" }, " mAvO "), true);
  assert.equal(matchesProductSearch({ title: "Mavo Desk" }, ""), true);
  assert.equal(matchesProductSearch({ title: "Mavo Desk" }, "chair"), false);
});

test("suggestions match product titles and keywords, but not unrelated fields", () => {
  const titleMatch = { _id: "title", title: "Desk Lamp" };
  const keywordMatch = {
    _id: "keyword",
    title: "Reading Light",
    seoKeywords: ["bedside lamp"],
  };
  const unrelatedMatch = {
    _id: "unrelated",
    title: "Oak Table",
    category: "Desk accessories",
    description: "A compact desk accessory",
  };

  const titleSuggestions = getProductSearchSuggestions(
    [titleMatch, keywordMatch, unrelatedMatch],
    "desk"
  );
  assert.deepEqual(
    titleSuggestions.map(({ text, type }) => ({ text, type })),
    [{ text: "Desk Lamp", type: "title" }]
  );

  const keywordSuggestions = getProductSearchSuggestions(
    [keywordMatch, unrelatedMatch],
    "bedside"
  );
  assert.deepEqual(
    keywordSuggestions.map(({ text, type, productTitle }) => ({
      text,
      type,
      productTitle,
    })),
    [{ text: "bedside lamp", type: "keyword", productTitle: "Reading Light" }]
  );
  assert.deepEqual(
    getProductSearchSuggestions([titleMatch, keywordMatch], "unknown"),
    []
  );
});

test("suggestions respect the requested result limit", () => {
  const products = [
    { title: "Desk Lamp" },
    { title: "Desk Chair" },
    { title: "Desk Shelf" },
  ];

  assert.deepEqual(
    getProductSearchSuggestions(products, "desk", 2).map(
      (suggestion) => suggestion.text
    ),
    ["Desk Lamp", "Desk Chair"]
  );
});

test("suggestions surface individual SEO keywords and legacy keyword text", () => {
  const product = {
    _id: "keyword",
    title: "Reading Light",
    keywords: "bedside lighting, table lamp",
    seoKeywords: ["warm ambient light", "bedside lamp"],
  };

  assert.deepEqual(
    getProductSearchSuggestions([product], "bedside").map(
      ({ text, type }) => ({ text, type })
    ),
    [
      { text: "bedside lighting", type: "keyword" },
      { text: "bedside lamp", type: "keyword" },
    ]
  );
});
