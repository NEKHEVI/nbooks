// @ts-nocheck
/**
 * NBooks : tableau de bord « instrument » en tête de l'accueil.
 * Gros chiffres lisibles, sobres et denses : bénéfice net de l'exercice, encaisse,
 * comptes clients et fournisseurs (avec l'âge des soldes), TPS et TVQ nettes à remettre.
 * Lit les rapports existants de Bigcapital (aucune nouvelle route serveur).
 * L'habillage suit le thème choisi (style/pages/HomePage/nb-instrument.scss).
 */
import React from 'react';
import intl from 'react-intl-universal';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  fetchProfitLossJson,
  fetchReceivableAgingJson,
  fetchPayableAgingJson,
  fetchSalesTaxLiabilityJson,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '@/hooks/useRequest';
import { useAccounts, useCurrentOrganizationBaseCurrency } from '@/hooks/query';
import '@/style/pages/HomePage/nb-instrument.scss';

const pad = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function useLocaleTag() {
  const lang = (intl.options?.currentLocale || 'fr').toLowerCase();
  return lang.startsWith('fr') ? 'fr-CA' : 'en-CA';
}

function formatMoney(value: number | null | undefined, currency: string, locale: string) {
  if (value == null || Number.isNaN(value)) return '–';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

/** Sépare le montant et le symbole pour afficher le chiffre en grand. */
function MoneyFigure({ value, currency, locale, size = 'lg' }) {
  const text = formatMoney(value, currency, locale);
  const parts = text.match(/^([^\d\-−]*)([\-−]?[\d\s  .,]+)([^\d]*)$/);
  const negative = typeof value === 'number' && value < 0;
  return (
    <span className={`nb-fig nb-fig--${size}${negative ? ' nb-fig--neg' : ''}`}>
      {parts ? (
        <>
          {parts[1] ? <span className="nb-fig__cur">{parts[1].trim()}</span> : null}
          <span className="nb-fig__num">{parts[2].trim()}</span>
          {parts[3] ? <span className="nb-fig__cur">{parts[3].trim()}</span> : null}
        </>
      ) : (
        <span className="nb-fig__num">{text}</span>
      )}
    </span>
  );
}

function amountOf(node) {
  const a = node?.total?.amount ?? node?.amount;
  return typeof a === 'number' ? a : 0;
}

function agingBuckets(report) {
  const total = report?.data?.total;
  if (!total) return null;
  const current = total.current?.amount ?? 0;
  const aging = (total.aging || []).map((a) => a?.total?.amount ?? 0);
  const sum = total.total?.amount ?? current + aging.reduce((s, v) => s + v, 0);
  return { current, aging, sum };
}

function AgingMeter({ buckets, labels }) {
  if (!buckets || buckets.sum <= 0) {
    return <div className="nb-meter nb-meter--empty" aria-hidden="true" />;
  }
  const values = [buckets.current, ...buckets.aging];
  return (
    <div className="nb-meter" role="img" aria-label={labels.join(', ')}>
      {values.map((v, i) =>
        v > 0 ? (
          <span
            key={i}
            className={`nb-meter__seg nb-meter__seg--${Math.min(i, 3)}`}
            style={{ flexGrow: v }}
            title={`${labels[i] || ''}`}
          />
        ) : null,
      )}
    </div>
  );
}

function Gauge({ to, label, hint, children, className = '' }) {
  const body = (
    <>
      <span className="nb-gauge__label">{label}</span>
      <span className="nb-gauge__value">{children}</span>
      {hint ? <span className="nb-gauge__hint">{hint}</span> : null}
    </>
  );
  return to ? (
    <Link to={to} className={`nb-gauge ${className}`}>
      {body}
    </Link>
  ) : (
    <div className={`nb-gauge ${className}`}>{body}</div>
  );
}

export function NbInstrumentPanel() {
  const fetcher = useApiFetcher();
  const currency = useCurrentOrganizationBaseCurrency() || 'CAD';
  const locale = useLocaleTag();

  const today = new Date();
  const fromDate = `${today.getFullYear()}-01-01`;
  const toDate = isoDate(today);
  const range = { from_date: fromDate, to_date: toDate };

  const pl = useQuery({
    queryKey: ['nb-panel', 'profit-loss', range],
    queryFn: () => fetchProfitLossJson(fetcher, range),
  });
  const ar = useQuery({
    queryKey: ['nb-panel', 'ar-aging', toDate],
    queryFn: () => fetchReceivableAgingJson(fetcher, { as_date: toDate }),
  });
  const ap = useQuery({
    queryKey: ['nb-panel', 'ap-aging', toDate],
    queryFn: () => fetchPayableAgingJson(fetcher, { as_date: toDate }),
  });
  const tax = useQuery({
    queryKey: ['nb-panel', 'sales-tax', range],
    queryFn: () => fetchSalesTaxLiabilityJson(fetcher, { ...range, basis: 'accrual' }),
  });
  const accounts = useAccounts({});

  const plRows = pl.data?.data || [];
  const find = (id) => plRows.find((r) => r.id === id);
  const income = amountOf(find('INCOME')) + amountOf(find('OTHER_INCOME'));
  const expenses = amountOf(find('EXPENSES')) + amountOf(find('COST_OF_SALES')) + amountOf(find('OTHER_EXPENSES'));
  const netIncomeRow = find('NET_INCOME') || find('NET_PROFIT');
  const netIncome = netIncomeRow ? amountOf(netIncomeRow) : income - expenses;
  const margin = income > 0 ? Math.max(-1, Math.min(1, netIncome / income)) : 0;

  const accountList = Array.isArray(accounts.data) ? accounts.data : accounts.data?.accounts || [];
  const cash = accountList
    .filter((a) => ['cash', 'bank'].includes(a.account_type ?? a.accountType))
    .reduce((s, a) => s + (Number(a.amount) || 0), 0);

  const arB = agingBuckets(ar.data);
  const apB = agingBuckets(ap.data);
  const agingLabels = [
    intl.get('nbooks.panel.aging_current'),
    intl.get('nbooks.panel.aging_1_30'),
    intl.get('nbooks.panel.aging_31_60'),
    intl.get('nbooks.panel.aging_61'),
  ];

  const taxRates = tax.data?.data?.tax_rates || [];
  const taxLine = (prefix) => {
    const rows = taxRates.filter((t) => (t.tax_name || '').toUpperCase().startsWith(prefix));
    if (!rows.length) return null;
    return rows.reduce((s, t) => s + (t.net_tax_amount?.amount ?? 0), 0);
  };
  const tps = taxLine('TPS') ?? taxLine('GST');
  const tvq = taxLine('TVQ') ?? taxLine('QST');
  const netTaxTotal = tax.data?.data?.total?.net_tax_amount?.amount ?? null;

  const loading = pl.isLoading || ar.isLoading || ap.isLoading || tax.isLoading || accounts.isLoading;
  const asOf = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(today);

  return (
    <section className={`nb-panel${loading ? ' nb-panel--loading' : ''}`} aria-busy={loading}>
      <header className="nb-panel__head">
        <span className="nb-panel__eyebrow">{intl.get('nbooks.panel.eyebrow')}</span>
        <h2 className="nb-panel__title">
          {intl.get('nbooks.panel.fiscal_year', { year: today.getFullYear() })}
        </h2>
        <span className="nb-panel__asof">{intl.get('nbooks.panel.as_of', { date: asOf })}</span>
      </header>

      <div className="nb-panel__hero">
        <Gauge
          to="/financial-reports/profit-loss-sheet"
          className="nb-gauge--hero"
          label={intl.get('nbooks.panel.net_income')}
          hint={
            <>
              <span>{intl.get('nbooks.panel.income')} {formatMoney(income, currency, locale)}</span>
              <span className="nb-sep">·</span>
              <span>{intl.get('nbooks.panel.expenses')} {formatMoney(expenses, currency, locale)}</span>
            </>
          }
        >
          <MoneyFigure value={netIncome} currency={currency} locale={locale} size="xl" />
          <span className="nb-rule" aria-hidden="true">
            <span className="nb-rule__fill" style={{ width: `${Math.abs(margin) * 100}%` }} />
          </span>
          <span className="nb-gauge__sub">
            {intl.get('nbooks.panel.margin', {
              value: new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(margin),
            })}
          </span>
        </Gauge>

        <Gauge
          to="/financial-reports/balance-sheet"
          label={intl.get('nbooks.panel.cash')}
          hint={intl.get('nbooks.panel.cash_hint')}
        >
          <MoneyFigure value={cash} currency={currency} locale={locale} />
        </Gauge>
      </div>

      <div className="nb-panel__grid">
        <Gauge
          to="/financial-reports/receivable-aging-summary"
          label={intl.get('nbooks.panel.receivable')}
          hint={<AgingMeter buckets={arB} labels={agingLabels} />}
        >
          <MoneyFigure value={arB?.sum ?? 0} currency={currency} locale={locale} size="md" />
        </Gauge>
        <Gauge
          to="/financial-reports/payable-aging-summary"
          label={intl.get('nbooks.panel.payable')}
          hint={<AgingMeter buckets={apB} labels={agingLabels} />}
        >
          <MoneyFigure value={apB?.sum ?? 0} currency={currency} locale={locale} size="md" />
        </Gauge>
        <Gauge
          to="/financial-reports/sales-tax-liability-summary"
          label={intl.get('nbooks.panel.gst')}
          hint={intl.get('nbooks.panel.tax_hint')}
        >
          <MoneyFigure value={tps ?? 0} currency={currency} locale={locale} size="md" />
        </Gauge>
        <Gauge
          to="/financial-reports/sales-tax-liability-summary"
          label={intl.get('nbooks.panel.qst')}
          hint={
            netTaxTotal != null
              ? intl.get('nbooks.panel.tax_total', { value: formatMoney(netTaxTotal, currency, locale) })
              : intl.get('nbooks.panel.tax_hint')
          }
        >
          <MoneyFigure value={tvq ?? 0} currency={currency} locale={locale} size="md" />
        </Gauge>
      </div>

      <ul className="nb-panel__legend" aria-hidden="true">
        {agingLabels.map((l, i) => (
          <li key={i}>
            <span className={`nb-meter__dot nb-meter__seg--${i}`} />
            {l}
          </li>
        ))}
      </ul>
    </section>
  );
}
