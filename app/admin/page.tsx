"use client";
// app/admin/page.tsx — админ-панель (доступ проверяет сервер по ADMIN_TELEGRAM_IDS)

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Tab = "stats" | "user" | "orders" | "deposits";

const fmt = (n: number) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const when = (s?: string | null) =>
  s ? new Date(s).toLocaleString("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [tab, setTab] = useState<Tab>("stats");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [stats, setStats] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);

  const initData = () => (typeof window !== "undefined" ? (window as any).Telegram?.WebApp?.initData ?? "" : "");

  const api = async (payload: Record<string, any>) => {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: initData(), ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  };

  // старт: ждём Telegram SDK и спрашиваем сервер «я админ?»
  useEffect(() => {
    const start = async () => {
      try {
        (window as any).Telegram?.WebApp?.ready();
        (window as any).Telegram?.WebApp?.expand();
      } catch {}
      const { data } = await api({ action: "me" });
      setAllowed(!!data.isAdmin);
      setReady(true);
    };
    if ((window as any).Telegram?.WebApp) {
      start();
    } else {
      const s = document.createElement("script");
      s.src = "https://telegram.org/js/telegram-web-app.js";
      s.async = true;
      s.onload = start;
      s.onerror = () => setReady(true);
      document.body.appendChild(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // кнопка «Назад» Telegram
  useEffect(() => {
    const bb = (window as any).Telegram?.WebApp?.BackButton;
    if (!bb) return;
    const cb = () => router.push("/");
    bb.show();
    bb.onClick(cb);
    return () => {
      bb.offClick?.(cb);
      bb.hide();
    };
  }, [router]);

  const loadStats = async () => {
    const { ok, data } = await api({ action: "stats" });
    if (ok) setStats(data);
  };
  const loadOrders = async () => {
    const { ok, data } = await api({ action: "processing" });
    if (ok) setOrders(data.orders);
  };
  const loadDeposits = async () => {
    const { ok, data } = await api({ action: "deposits" });
    if (ok) setDeposits(data.deposits);
  };

  useEffect(() => {
    if (!allowed) return;
    setMsg("");
    if (tab === "stats") loadStats();
    if (tab === "orders") loadOrders();
    if (tab === "deposits") loadDeposits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, allowed]);

  const search = async (idOverride?: string) => {
    const q = (idOverride ?? query).trim();
    if (!q) return;
    setBusy(true);
    setMsg("");
    setNotFound(false);
    const { ok, data } = await api({ action: "user", query: q });
    setBusy(false);
    if (ok && data.found) setFound(data);
    else {
      setFound(null);
      setNotFound(true);
    }
  };

  const adjust = async (sign: 1 | -1) => {
    const n = parseInt(amount.replace(/[^\d]/g, ""), 10);
    if (!found || !n) return setMsg("Введите сумму");
    if (!reason.trim()) return setMsg("Укажите причину");
    const who = found.user.username ? "@" + found.user.username : found.user.telegram_id;
    if (!window.confirm(`${sign > 0 ? "Пополнить" : "Списать"} ${fmt(n)} UZS — ${who}?`)) return;
    setBusy(true);
    const { ok, data } = await api({ action: "adjust", userId: found.user.telegram_id, amount: sign * n, reason });
    setBusy(false);
    if (!ok) {
      setMsg(data.error === "USER_NOT_FOUND_OR_NEGATIVE_BALANCE" ? "Нельзя: баланс уйдёт в минус" : `Ошибка: ${data.error}`);
      return;
    }
    setMsg(`Готово. Новый баланс: ${fmt(data.balance)} UZS`);
    setAmount("");
    setReason("");
    search(String(found.user.telegram_id));
  };

  const decide = async (action: "order_refund" | "order_complete", id: string) => {
    const text = action === "order_refund" ? "Вернуть деньги пользователю?" : "Отметить заказ выполненным (без возврата)?";
    if (!window.confirm(text)) return;
    setBusy(true);
    const { ok, data } = await api({ action, orderId: id });
    setBusy(false);
    setMsg(ok ? "Готово" : data.error === "ORDER_ALREADY_DECIDED" ? "Заказ уже обработан" : `Ошибка: ${data.error}`);
    loadOrders();
  };

  if (!ready) return <div className="adm"><style dangerouslySetInnerHTML={{ __html: CSS }} /><p className="mut c">Загрузка…</p></div>;

  if (!allowed) {
    return (
      <div className="adm">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <p className="mut c" style={{ marginTop: 80 }}>Доступ запрещён</p>
        <button className="btn" onClick={() => router.push("/")}>На главную</button>
      </div>
    );
  }

  const tabs: [Tab, string][] = [["stats", "Статистика"], ["user", "Юзер"], ["orders", "Заказы"], ["deposits", "Пополнения"]];

  return (
    <div className="adm">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <h1>Админ-панель</h1>

      <div className="tabs">
        {tabs.map(([k, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
            {l}
            {k === "orders" && stats?.processing ? ` (${stats.processing})` : ""}
          </button>
        ))}
      </div>

      {msg && <div className="note">{msg}</div>}

      {/* ---------- Статистика ---------- */}
      {tab === "stats" && (
        <div className="grid">
          {!stats && <p className="mut">Загрузка…</p>}
          {stats && (
            <>
              <Stat l="Пользователей" v={fmt(stats.users)} s={stats.usersToday != null ? `+${stats.usersToday} сегодня` : ""} />
              <Stat l="Заказов сегодня" v={fmt(stats.ordersToday)} s={`${fmt(stats.revenueToday)} UZS`} />
              <Stat l="Заказов за месяц" v={fmt(stats.ordersMonth)} s={`${fmt(stats.revenueMonth)} UZS`} />
              <Stat l="Пополнено за месяц" v={fmt(stats.depositsMonth)} s="UZS" />
              <Stat l="В обработке" v={fmt(stats.processing)} s="заказов" warn={stats.processing > 0} />
              <Stat l="Ждут пополнения" v={fmt(stats.depositsPending)} s="заявок" />
            </>
          )}
        </div>
      )}

      {/* ---------- Пользователь ---------- */}
      {tab === "user" && (
        <>
          <div className="row">
            <input placeholder="Telegram ID или @username" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
            <button className="btn s" disabled={busy} onClick={() => search()}>Найти</button>
          </div>
          {notFound && <p className="mut">Пользователь не найден</p>}

          {found && (
            <>
              <div className="card">
                <b>{found.user.first_name || "—"} {found.user.username ? `@${found.user.username}` : ""}</b>
                <div className="mut">ID: {found.user.telegram_id}</div>
                <div className="big">{fmt(found.user.balance)} UZS</div>
                <div className="mut">Последний вход: {when(found.user.last_seen_at)}</div>
              </div>

              <div className="card">
                <b>Изменить баланс</b>
                <input placeholder="Сумма, например 50000" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <input placeholder="Причина (обязательно)" value={reason} onChange={(e) => setReason(e.target.value)} />
                <div className="row">
                  <button className="btn green" disabled={busy} onClick={() => adjust(1)}>+ Пополнить</button>
                  <button className="btn red" disabled={busy} onClick={() => adjust(-1)}>− Списать</button>
                </div>
              </div>

              <Section title="Последние заказы">
                {found.orders.map((o: any) => (
                  <Line key={o.id} a={`${o.service} · ${o.product_name}`} b={`${o.target_id ?? ""}`} c={`${fmt(o.price)} · ${o.status}`} d={when(o.created_at)} />
                ))}
              </Section>
              <Section title="Последние пополнения">
                {found.deposits.map((d: any) => (
                  <Line key={d.id} a={`${fmt(d.amount)} UZS`} b="" c={d.status} d={when(d.created_at)} />
                ))}
              </Section>
              {found.adjustments.length > 0 && (
                <Section title="Корректировки баланса">
                  {found.adjustments.map((a: any) => (
                    <Line key={a.id} a={`${a.amount > 0 ? "+" : ""}${fmt(a.amount)}`} b={String(a.reason ?? "")} c="" d={when(a.created_at)} />
                  ))}
                </Section>
              )}
            </>
          )}
        </>
      )}

      {/* ---------- Заказы в обработке ---------- */}
      {tab === "orders" && (
        <>
          {orders.length === 0 && <p className="mut">Зависших заказов нет 🎉</p>}
          {orders.map((o) => (
            <div key={o.id} className="card">
              <b>{o.service} · {o.product_name}</b>
              <div className="mut">Юзер {o.user_id} · ID: {o.target_id}</div>
              <div className="mut">{fmt(o.price)} UZS · {when(o.created_at)}</div>
              <div className="mut" style={{ wordBreak: "break-all" }}>Ludovex: {o.provider_order_id ?? "нет ID"}</div>
              <div className="row">
                <button className="btn red" disabled={busy} onClick={() => decide("order_refund", o.id)}>Вернуть деньги</button>
                <button className="btn green" disabled={busy} onClick={() => decide("order_complete", o.id)}>Выполнен</button>
              </div>
            </div>
          ))}
          <p className="mut tiny">Перед возвратом проверьте заказ в кабинете Ludovex: если он там выполнен — нажимайте «Выполнен».</p>
        </>
      )}

      {/* ---------- Пополнения ---------- */}
      {tab === "deposits" && (
        <>
          {deposits.map((d) => (
            <div key={d.id} className="card line">
              <div>
                <b>{fmt(d.amount)} UZS</b>
                <div className="mut">Юзер {d.user_id} · {when(d.created_at)}</div>
              </div>
              <span className={`pill ${d.status}`}>{d.status}</span>
            </div>
          ))}
        </>
      )}

      <button className="btn ghost" onClick={() => router.push("/")}>← В приложение</button>
    </div>
  );
}

function Stat({ l, v, s, warn }: { l: string; v: string; s?: string; warn?: boolean }) {
  return (
    <div className={`card stat ${warn ? "warn" : ""}`}>
      <div className="mut">{l}</div>
      <div className="big">{v}</div>
      <div className="mut">{s}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <b>{title}</b>
      {children}
    </div>
  );
}

function Line({ a, b, c, d }: { a: string; b: string; c: string; d: string }) {
  return (
    <div className="ln">
      <div>
        <div>{a}</div>
        <div className="mut">{b}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div>{c}</div>
        <div className="mut">{d}</div>
      </div>
    </div>
  );
}

const CSS = `
html,body{margin:0;background:#0E0A1B}
.adm{min-height:100vh;padding:16px 16px 40px;max-width:560px;margin:0 auto;color:#fff;font-family:system-ui,sans-serif}
.adm *{box-sizing:border-box}
.adm h1{font-size:22px;margin:4px 0 14px}
.tabs{display:flex;gap:4px;padding:4px;border-radius:14px;background:rgba(255,255,255,.06);margin-bottom:14px;overflow-x:auto}
.tabs button{flex:1;white-space:nowrap;border:0;background:none;color:rgba(255,255,255,.6);padding:9px 10px;border-radius:10px;font-weight:700;font-size:13px}
.tabs button.on{background:#8B5CF6;color:#fff}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:14px;margin-bottom:10px;display:flex;flex-direction:column;gap:6px}
.card.line{flex-direction:row;align-items:center;justify-content:space-between}
.stat.warn{border-color:#FFD166}
.big{font-size:22px;font-weight:800}
.mut{color:#A79FC2;font-size:12px}.tiny{font-size:11px}.c{text-align:center}
.row{display:flex;gap:8px;margin-bottom:10px}
.adm input{width:100%;padding:13px;font-size:16px;color:#fff;border-radius:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);outline:none}
.btn{width:100%;border:0;border-radius:12px;padding:13px;font-size:14px;font-weight:700;color:#fff;background:#6E6BFF}
.btn.s{width:auto;padding:0 18px}
.btn.green{background:#2FBF82}.btn.red{background:#E5484D}.btn.ghost{background:rgba(255,255,255,.08);margin-top:16px}
.btn:disabled{opacity:.5}
.note{padding:10px 12px;border-radius:12px;background:rgba(61,220,151,.12);border:1px solid rgba(61,220,151,.3);color:#3DDC97;font-size:13px;margin-bottom:12px}
.ln{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid rgba(255,255,255,.07);font-size:13px}
.pill{padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(255,255,255,.1)}
.pill.approved{background:rgba(61,220,151,.2);color:#3DDC97}.pill.rejected{background:rgba(229,72,77,.2);color:#FF9DAF}.pill.pending{background:rgba(255,209,102,.2);color:#FFD166}
`;