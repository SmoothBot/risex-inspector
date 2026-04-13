"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchTradeHistory,
  fetchPortfolio,
  type Trade,
  type Position,
  type PortfolioSummary,
} from "@/lib/api";

function formatTime(nanos: string): string {
  return new Date(Number(BigInt(nanos) / 1_000_000n)).toLocaleString();
}

function formatPnl(pnl: string): { text: string; className: string } {
  const val = parseFloat(pnl);
  if (val === 0) return { text: "-", className: "text-muted-foreground" };
  const sign = val > 0 ? "+" : "";
  return {
    text: `${sign}${val.toFixed(2)}`,
    className: val > 0 ? "text-green-500" : "text-red-500",
  };
}

function formatUsd(val: number): string {
  return val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function shortenHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export function TradeHistory({ address }: { address: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [marketNames, setMarketNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchTradeHistory(address), fetchPortfolio(address)])
      .then(([tradeRes, portfolioRes]) => {
        setTrades(tradeRes.data.trades);
        setSummary(portfolioRes.data.summary);
        // Build market name lookup from portfolio positions
        const names: Record<string, string> = {};
        for (const p of portfolioRes.data.positions) {
          names[p.market_id] = p.market_name;
        }
        setMarketNames(names);
        // Only show positions with non-zero size
        setPositions(
          portfolioRes.data.positions.filter(
            (p) => parseFloat(p.size) !== 0
          )
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [address]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-red-500">
          {error}
        </CardContent>
      </Card>
    );
  }

  // Summary stats
  const totalPnl = trades.reduce(
    (sum, t) => sum + parseFloat(t.realized_pnl || "0"),
    0
  );
  const totalFees = trades.reduce(
    (sum, t) => sum + parseFloat(t.fee || "0"),
    0
  );
  const totalVolume = trades.reduce(
    (sum, t) => sum + parseFloat(t.price) * parseFloat(t.size),
    0
  );
  const otcCount = trades.filter((t) => t.is_otc).length;
  const liqCount = trades.filter((t) => t.is_liquidation).length;

  return (
    <div className="space-y-4">
      {/* Account Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground font-normal">
                Account Value
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-semibold">
                ${formatUsd(parseFloat(summary.total_account_value))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground font-normal">
                USDC Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-semibold">
                ${formatUsd(parseFloat(summary.usdc_balance))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground font-normal">
                Unrealized PnL
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p
                className={`text-2xl font-semibold ${parseFloat(summary.total_unrealized_pnl) >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                ${formatUsd(parseFloat(summary.total_unrealized_pnl))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground font-normal">
                Total Notional
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-semibold">
                ${formatUsd(parseFloat(summary.total_notional))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground font-normal">
                Risk Level
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-semibold">
                <Badge
                  variant={
                    summary.risk_level === "NORMAL" ? "default" : "destructive"
                  }
                  className={
                    summary.risk_level === "NORMAL"
                      ? "bg-green-600"
                      : undefined
                  }
                >
                  {summary.risk_level}
                </Badge>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Open Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Open Positions{" "}
            <span className="text-muted-foreground font-normal">
              ({positions.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Market</TableHead>
                <TableHead>Side</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Notional</TableHead>
                <TableHead className="text-right">Entry Price</TableHead>
                <TableHead className="text-right">Mark Price</TableHead>
                <TableHead className="text-right">Liq. Price</TableHead>
                <TableHead className="text-right">uPnL</TableHead>
                <TableHead className="text-right">Leverage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground py-8"
                  >
                    No open positions
                  </TableCell>
                </TableRow>
              ) : (
                positions.map((pos) => {
                  const size = parseFloat(pos.size);
                  const absSize = Math.abs(size);
                  const mark = parseFloat(pos.mark_price);
                  const notional = absSize * mark;
                  const upnl = formatPnl(pos.unrealized_pnl);
                  const isLong = size > 0;
                  return (
                    <TableRow key={pos.market_id}>
                      <TableCell className="font-medium">
                        {pos.market_name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            isLong
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-red-600 hover:bg-red-700"
                          }
                        >
                          {isLong ? "LONG" : "SHORT"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {absSize}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${formatUsd(notional)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {parseFloat(pos.avg_entry_price).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {mark.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {parseFloat(pos.liquidation_price) > 0
                          ? parseFloat(pos.liquidation_price).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono ${upnl.className}`}
                      >
                        {upnl.text}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {pos.leverage}x
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Trade History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Trade History{" "}
            <span className="text-muted-foreground font-normal">
              ({trades.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 pt-0">
            <div>
              <p className="text-xs text-muted-foreground">Realized PnL</p>
              <p
                className={`text-lg font-semibold ${totalPnl >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {totalPnl >= 0 ? "+" : ""}
                {formatUsd(totalPnl)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fees Paid</p>
              <p className="text-lg font-semibold">${formatUsd(totalFees)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Volume</p>
              <p className="text-lg font-semibold">
                $
                {totalVolume.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                OTC / Liquidations
              </p>
              <p className="text-lg font-semibold">
                {otcCount} / {liqCount}
              </p>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Side</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Notional</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead className="text-right">PnL</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tx</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center text-muted-foreground py-8"
                  >
                    No trades found
                  </TableCell>
                </TableRow>
              ) : (
                trades.map((trade) => {
                  const pnl = formatPnl(trade.realized_pnl);
                  const notional =
                    parseFloat(trade.price) * parseFloat(trade.size);
                  return (
                    <TableRow key={trade.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {formatTime(trade.time)}
                      </TableCell>
                      <TableCell>
                        {marketNames[trade.market_id] || `Market ${trade.market_id}`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            trade.side === "BUY" ? "default" : "secondary"
                          }
                          className={
                            trade.side === "BUY"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-red-600 hover:bg-red-700"
                          }
                        >
                          {trade.side}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {parseFloat(trade.price).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {trade.size}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${formatUsd(notional)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {parseFloat(trade.fee) === 0
                          ? "-"
                          : parseFloat(trade.fee).toFixed(4)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono ${pnl.className}`}
                      >
                        {pnl.text}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {trade.is_otc && (
                            <Badge variant="outline" className="text-xs">
                              OTC
                            </Badge>
                          )}
                          {trade.is_liquidation && (
                            <Badge variant="destructive" className="text-xs">
                              LIQ
                            </Badge>
                          )}
                          {trade.liquidity_indicator === "MAKER" && (
                            <Badge variant="outline" className="text-xs">
                              Maker
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {shortenHash(trade.blockchain_data.tx_hash)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
