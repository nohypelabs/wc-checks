# Billing & Upgrade Flow

## Routing Flow

```
/inspect/:locationId  (user klik Submit)
        │
        ▼
    /upgrade          (halaman UpgradePage — paket max 3jt/bulan)
        │
        ▼ (klik "Upgrade Sekarang")
    /payment-method   (halaman PaymentMethodPage — rekening bank)
        │
        ▼ (klik "Sudah Bayar")
    WhatsApp Admin    (https://wa.me/6281221575053)
        │
        ▼ (admin verifikasi manual)
    User bisa submit normal lagi
```

## Rekening Bank

| Field | Value |
|-------|-------|
| Bank | BNI |
| Atas Nama | Abdul Gofur |
| No Rekening | 1988595892 |

## WhatsApp Admin

| Field | Value |
|-------|-------|
| Nomor | 081221575053 |
| Format WA Link | `https://wa.me/6281221575053` |
| Pesan Default | `saya sudah bayar, silahkan cek saldo untuk memeriksa/verifikasi` |

## Paket

| Paket | Harga | Fitur |
|-------|-------|-------|
| Max | Rp 3.000.000/bulan | Unlimited inspections, semua fitur, priority support |

## Cara Balikin Submit Normal

Di `src/components/forms/ComprehensiveInspectionForm.tsx`, cari bagian:

```typescript
const handleSubmit = async () => {
  // 🚫 BILLING BLOCK: Redirect to upgrade page instead of submitting
  // TODO: Re-enable actual submit after user upgrades
  navigate('/upgrade');
  return;
```

Hapus 3 baris di atas (navigate + return) supaya submit jalan normal lagi.

## File Terkait

- `src/pages/UpgradePage.tsx` — Halaman upgrade plan
- `src/pages/PaymentMethodPage.tsx` — Halaman rekening bank
- `src/components/forms/ComprehensiveInspectionForm.tsx` — Submit interceptor (line ~209)
- `src/App.tsx` — Route `/upgrade` dan `/payment-method`
