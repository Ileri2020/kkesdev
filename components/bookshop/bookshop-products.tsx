"use client";

import { useState } from "react";
import { Check, Search, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/myComponents/subs/productCard";
import { useCart } from "@/hooks/use-cart";

const imagePool = [
  "/pic1.png", "/pic2.jpg", "/pic3.png", "/pic4.png", "/pic5.png",
  "/pic6.png", "/pic7.png", "/pic8.png", "/pic9.png", "/pic10.png",
  "/agric.jpg", "/sports.jpg", "/MSAC_6.jpg", "/kopatyTaiwobanner.boy_.jpg",
  "/kopatyTaiwobanner.boy2_.jpg", "/bannerboy.png", "/bannergirl.png",
  "/teacher.png", "/placeholderMale.jpg", "/placeholderFemale.webp",
];

const names = [
  "The Complete Mathematics Textbook", "English Language for Senior School", "Essential Biology Workbook",
  "Chemistry: Concepts and Practice", "Physics Principles and Applications", "World History Student Reader",
  "Geography Fieldwork Atlas", "Introduction to Computer Studies", "Creative Arts & Design Kit",
  "Business Studies Made Simple", "Literature Anthology: Student Edition", "Basic Technology Activity Book",
  "School Backpack - Classic", "Scientific Calculator", "Geometry Set - 10 Piece",
  "Premium Exercise Book Pack", "Student Water Bottle", "Daily Planner & Study Journal",
  "School Sports Kit", "Art Supplies Starter Set",
];

const categories = ["Textbooks", "Textbooks", "Workbooks", "Textbooks", "Textbooks", "Readers", "Reference", "Textbooks", "Learning kits", "Readers", "Readers", "Workbooks", "School supplies", "Stationery", "Stationery", "Stationery", "School supplies", "Stationery", "School wear", "Learning kits"];

const products = names.map((name, index) => ({
  id: `bookshop-placeholder-${index + 1}`,
  name,
  description: `A useful ${categories[index].toLowerCase()} item for learners. This sample listing is a visual placeholder; confirm current availability and pricing with the school.`,
  price: [4200, 5800, 3500, 6200, 6000, 4000, 7200, 5000, 8500, 3600][index % 10],
  images: [imagePool[index]],
  category: { name: categories[index] },
  inStock: true,
  scarce: false,
  rating: 4.5 + ((index % 2) * 0.5),
  reviews: [],
  regulatoryClassification: "OTC",
}));

export function BookshopProducts() {
  const { addItem } = useCart();
  const [query, setQuery] = useState("");
  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.category.name}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  );

  function addProduct(product: (typeof products)[number]) {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      images: product.images,
      category: product.category.name,
    });
  }

  return (
    <section className="mt-14 sm:mt-16" aria-labelledby="bookshop-products-title">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Shop the collection</p>
          <h2 id="bookshop-products-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Popular school essentials</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sample storefront display · 20 products · listings are visual placeholders.</p>
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <span className="sr-only">Search bookshop products</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search books and supplies" className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15" />
        </label>
      </div>

      <div className="mb-5 flex items-center justify-between rounded-xl border border-accent/15 bg-accent/[0.04] px-4 py-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2"><SlidersHorizontal size={15} className="text-accent" /> Browse school books, stationery, supplies and more</span>
        <span className="font-semibold text-foreground">{filteredProducts.length} items</span>
      </div>

      {filteredProducts.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              orientation="vertical"
              variant="default"
              showDiscount={false}
              onAddToCart={() => addProduct(product)}
              className="min-w-0"
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <ShoppingBag className="mx-auto h-9 w-9 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">No matching products</h3>
          <p className="mt-1 text-sm text-muted-foreground">Try a different name or category.</p>
        </div>
      )}

      <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><Check size={15} className="mt-0.5 shrink-0 text-emerald-600" /> These are demo product cards with images selected from the site&apos;s public assets. Product availability, prices, and checkout are placeholders.</p>
    </section>
  );
}
