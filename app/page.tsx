"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TradeHistory } from "./trade-history";

export default function Home() {
  const [address, setAddress] = useState("");
  const [searchAddress, setSearchAddress] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = address.trim();
    if (trimmed.match(/^0x[a-fA-F0-9]{40}$/)) {
      setSearchAddress(trimmed);
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">
          RiseX Account Inspector
        </h1>
        <p className="text-sm text-muted-foreground">Staging</p>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-xl">
          <Input
            placeholder="0x... account address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="font-mono text-sm"
          />
          <Button
            type="submit"
            disabled={!address.trim().match(/^0x[a-fA-F0-9]{40}$/)}
          >
            Inspect
          </Button>
        </form>

        {searchAddress && <TradeHistory address={searchAddress} />}
      </main>
    </div>
  );
}
