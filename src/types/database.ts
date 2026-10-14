// Hand-written types mirroring the Supabase schema (core_schema migration).
// Row shapes only — regenerate with `supabase gen types` once the schema stabilizes.

export type Role = 'landlord' | 'manager' | 'tenant'
export type FenceStatus = 'active' | 'inactive'
export type UnitStatus = 'occupied' | 'vacant'
export type TenancyStatus = 'active' | 'ended'
export type PaymentMethod = 'mobile_money' | 'bank' | 'cash'
export type PaymentStatus = 'pending' | 'confirmed'

export interface Profile {
  id: string
  phone: string | null
  email: string | null
  full_name: string | null
  role: Role
  created_at: string
}

export interface Fence {
  id: string
  owner_id: string
  name: string
  block_id_code: string
  address: string | null
  landmark: string | null
  latitude: number | null
  longitude: number | null
  status: FenceStatus
  created_at: string
}

export interface Unit {
  id: string
  fence_id: string
  label: string
  bedrooms: number | null
  monthly_rent: number
  status: UnitStatus
  created_at: string
}

export interface Tenancy {
  id: string
  unit_id: string
  tenant_id: string
  started_at: string
  ended_at: string | null
  status: TenancyStatus
  created_at: string
}

export interface Payment {
  id: string
  tenancy_id: string
  amount: number
  method: PaymentMethod
  period_month: string
  status: PaymentStatus
  confirmed_by: string | null
  confirmed_at: string | null
  created_at: string
}

export interface Receipt {
  id: string
  payment_id: string
  receipt_number: string
  issued_at: string
}
