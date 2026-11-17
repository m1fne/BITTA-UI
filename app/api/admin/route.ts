// app/api/admin/route.ts
// Единственный вход для админ-панели. Доступ: только Telegram ID из переменной ADMIN_TELEGRAM_IDS.
import { NextRequest, NextResponse } from "next/server";
import { supabase, refundOrder, completeOrder } from "@/lib/db";
import { verifyTelegramInitData } from "@/lib/telegram-auth";

export const dynamic = "force-dynamic";

const adminIds = (): number[] =>
  (process.env.ADMIN_TELEGRAM_IDS || "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);

// Начало дня / месяца по Ташкенту (UTC+5) в виде ISO-строки UTC
const TZ_MS = 5 * 3600 * 1000;
function startOfDayUTC(): string {
  const local = new Date(Date.now() + TZ_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - TZ_MS).toISOString();
}
function startOfMonthUTC(): string {
  const local = new Date(Date.now() + TZ_MS);
  local.setUTCDate(1);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - TZ_MS).toISOString();
}

const sum = (rows: any[] | null, field: string) =>
  (rows || []).reduce((acc, r) => acc + Number(r?.[field] || 0), 0);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const tgUser = verifyTelegramInitData(String(body?.initData || ""));
    if (!tgUser) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const adminId = Number(tgUser.id);
    const isAdmin = adminIds().includes(adminId);

    // «Я админ?» — безопасно отвечаем всем, чтобы показать/скрыть кнопку
    if (body.action === "me") return NextResponse.json({ isAdmin });
    if (!isAdmin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

    switch (body.action) {
      // ---------- Статистика ----------
      case "stats": {
        const day = startOfDayUTC();
        const month = startOfMonthUTC();

        const [users, usersToday, ordDay, ordMonth, processing, depPending, depMonth] = await Promise.all([
          supabase.from("users").select("*", { count: "exact", head: true }),
          supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", day),
          supabase.from("orders").select("price").eq("status", "completed").gte("created_at", day).limit(5000),
          supabase.from("orders").select("price").eq("status", "completed").gte("created_at", month).limit(20000),
          supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "processing"),
          supabase.from("deposits").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("deposits").select("amount").eq("status", "approved").gte("created_at", month).limit(20000),
        ]);

        return NextResponse.json({
          users: users.count ?? 0,
          usersToday: usersToday.error ? null : usersToday.count ?? 0, // null, если нет колонки created_at
          ordersToday: ordDay.data?.length ?? 0,
          revenueToday: sum(ordDay.data, "price"),
          ordersMonth: ordMonth.data?.length ?? 0,
          revenueMonth: sum(ordMonth.data, "price"),
          processing: processing.count ?? 0,
          depositsPending: depPending.count ?? 0,
          depositsMonth: sum(depMonth.data, "amount"),
        });
      }

      // ---------- Поиск пользователя ----------
      case "user": {
        const q = String(body.query || "").trim().replace(/^@/, "");
        if (!q) return NextResponse.json({ error: "EMPTY_QUERY" }, { status: 400 });

        let user: any = null;
        if (/^\d{3,15}$/.test(q)) {
          const r = await supabase.from("users").select("*").eq("telegram_id", Number(q)).maybeSingle();
          user = r.data;
        }
        if (!user) {
          const r = await supabase.from("users").select("*").ilike("username", q).limit(1).maybeSingle();
          user = r.data;
        }
        if (!user) return NextResponse.json({ found: false });

        const [orders, deposits, adjustments] = await Promise.all([
          supabase
            .from("orders")
            .select("id, service, product_name, price, status, target_id, created_at")
            .eq("user_id", user.telegram_id)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("deposits")
            .select("id, amount, status, created_at")
            .eq("user_id", user.telegram_id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("balance_adjustments")
            .select("*")
            .eq("user_id", user.telegram_id)
            .order("id", { ascending: false })
            .limit(5),
        ]);

        return NextResponse.json({
          found: true,
          user: {
            telegram_id: user.telegram_id,
            username: user.username ?? null,
            first_name: user.first_name ?? null,
            balance: Number(user.balance || 0),
            created_at: user.created_at ?? null,
            last_seen_at: user.last_seen_at ?? null,
          },
          orders: orders.data || [],
          deposits: deposits.data || [],
          adjustments: adjustments.error ? [] : adjustments.data || [],
        });
      }

      // ---------- Изменение баланса ----------
      case "adjust": {
        const userId = Number(body.userId);
        const amount = Math.round(Number(body.amount));
        const reason = String(body.reason || "").trim().slice(0, 200);
        if (!userId || !Number.isFinite(amount) || amount === 0) {
          return NextResponse.json({ error: "BAD_INPUT" }, { status: 400 });
        }
        if (Math.abs(amount) > 50_000_000) {
          return NextResponse.json({ error: "AMOUNT_TOO_BIG" }, { status: 400 });
        }
        if (!reason) return NextResponse.json({ error: "REASON_REQUIRED" }, { status: 400 });

        const { data, error } = await supabase.rpc("admin_adjust_balance", {
          p_user_id: userId,
          p_amount: amount,
          p_reason: `[admin ${adminId}] ${reason}`,
        });
        if (error) {
          const negative = String(error.message).includes("NEGATIVE");
          return NextResponse.json(
            { error: negative ? "USER_NOT_FOUND_OR_NEGATIVE_BALANCE" : "DB_ERROR", detail: error.message },
            { status: 400 }
          );
        }
        return NextResponse.json({ success: true, balance: Number(data) });
      }

      // ---------- Заказы в обработке ----------
      case "processing": {
        const { data } = await supabase
          .from("orders")
          .select("id, user_id, service, product_name, price, target_id, provider_order_id, created_at")
          .eq("status", "processing")
          .order("created_at", { ascending: true })
          .limit(50);
        return NextResponse.json({ orders: data || [] });
      }

      case "order_refund":
      case "order_complete": {
        const orderId = String(body.orderId || "");
        if (!/^[0-9a-f-]{36}$/i.test(orderId)) return NextResponse.json({ error: "BAD_ORDER_ID" }, { status: 400 });
        try {
          if (body.action === "order_refund") await refundOrder(orderId);
          else await completeOrder(orderId);
        } catch (e: any) {
          // refund_order / complete_order работают только из статуса processing
          return NextResponse.json({ error: "ORDER_ALREADY_DECIDED", detail: String(e?.message || e) }, { status: 409 });
        }
        return NextResponse.json({ success: true });
      }

      // ---------- Пополнения ----------
      case "deposits": {
        const { data } = await supabase
          .from("deposits")
          .select("id, user_id, amount, pay_amount, status, created_at")
          .order("created_at", { ascending: false })
          .limit(30);
        return NextResponse.json({ deposits: data || [] });
      }

      default:
        return NextResponse.json({ error: "UNKNOWN_ACTION" }, { status: 400 });
    }
  } catch (err) {
    console.error("Ошибка в /api/admin:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}