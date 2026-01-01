"use client";

import { useState } from "react";
import { Menu, Search, Settings, Tags } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="flex items-center justify-between h-14 px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="メニューを開く">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-primary font-logo">Yarukoto</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 space-y-1">
              <Link
                href="/search"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Search className="h-5 w-5 text-muted-foreground" />
                <span>検索</span>
              </Link>
              <Link
                href="/categories"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Tags className="h-5 w-5 text-muted-foreground" />
                <span>カテゴリ管理</span>
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
                <span>設定</span>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex items-center">
          <Image
            src={"/icons/icon-192x192.png"}
            alt="icon"
            width={32}
            height={32}
          />
          <h1 className="text-xl font-medium font-logo">Yarukoto</h1>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/search" aria-label="検索">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings" aria-label="設定">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
