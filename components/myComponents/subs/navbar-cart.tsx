"use client";

import { Minus, Plus, ShoppingBag, ShoppingCart, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";
import { formatPrice, PRICE_MARKUPS } from "@/lib/stock-pricing";
import { useAppContext } from "@/hooks/useAppContext";

export function NavbarCart() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAppContext();
  const markup = PRICE_MARKUPS[user?.role as keyof typeof PRICE_MARKUPS] || PRICE_MARKUPS.customer;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="icon" aria-label={`Open cart, ${itemCount} items`} className="relative h-10 w-10 shrink-0 rounded-xl border-border bg-background text-accent shadow-sm hover:bg-accent/5">
          <ShoppingCart className="h-[19px] w-[19px]" />
          <Badge className="absolute -right-2 -top-2 min-w-5 justify-center rounded-full border-2 border-background px-1 text-[10px] leading-4">{itemCount > 99 ? "99+" : itemCount}</Badge>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-[min(92vw,440px)] flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-5 pr-14 text-left">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent"><ShoppingBag size={19} /></span>
            <div><SheetTitle>Your cart <span className="ml-1 text-sm font-medium text-muted-foreground">({itemCount})</span></SheetTitle><SheetDescription>Review the items you added to your bag.</SheetDescription></div>
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted text-muted-foreground"><ShoppingCart size={28} /></div>
            <h3 className="mt-5 text-lg font-semibold">Your cart is empty</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Browse the bookshop and add a few school essentials to get started.</p>
            <SheetClose asChild><Button className="mt-5 rounded-xl">Continue shopping</Button></SheetClose>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {items.map((item) => {
                const image = item.images?.[0] || item.img || "/placeholderFemale.webp";
                return (
                  <article key={`${item.id}-${item.bulkPriceId || ""}`} className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
                    <img src={image} alt={item.name} className="h-20 w-20 shrink-0 rounded-xl bg-muted object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0"><p className="line-clamp-2 text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.category || "School essentials"}</p></div>
                        <button type="button" aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.id, item.bulkPriceId)} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"><X size={16} /></button>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center rounded-lg border border-border">
                          <button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => updateQuantity(item.id, item.quantity - 1, item.bulkPriceId)} className="p-1.5 text-muted-foreground hover:text-foreground"><Minus size={13} /></button>
                          <span className="min-w-7 text-center text-xs font-bold">{item.quantity}</span>
                          <button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => updateQuantity(item.id, item.quantity + 1, item.bulkPriceId)} className="p-1.5 text-muted-foreground hover:text-foreground"><Plus size={13} /></button>
                        </div>
                        <span className="text-sm font-bold">₦{formatPrice(item.price * markup * item.quantity)}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <footer className="space-y-3 border-t border-border bg-background px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><strong>₦{formatPrice(subtotal)}</strong></div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={clearCart}><Trash2 size={15} className="mr-2" />Clear cart</Button>
                <SheetClose asChild><Button asChild className="flex-1 rounded-xl"><a href="/contact">Continue</a></Button></SheetClose>
              </div>
              <p className="text-center text-[11px] text-muted-foreground">Sample bookshop listings. Confirm availability before ordering.</p>
            </footer>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
